/**
 * Sync script: Pull reviews from Neon raw_evidence → local SQLite Prisma DB
 * 
 * Maps hospital_seed_id → Prisma Facility ID, inserts reviews,
 * and recomputes scores from real review data.
 */

import { PrismaClient } from '@prisma/client';
import pg from 'pg';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '../../../.env') });

const prisma = new PrismaClient();
const { Pool } = pg;

// Mapping: raw_evidence hospital_seed_id → facility name + city (to match Prisma)
const HOSPITAL_MAP: Record<string, { name: string; city: string }> = {
  'apollo-indore': { name: 'Apollo Hospitals', city: 'Indore' },
  'tata-memorial-mumbai': { name: 'Tata Memorial Hospital', city: 'Mumbai' },
  'manipal-whitefield-blr': { name: 'Manipal Hospital Whitefield', city: 'Bengaluru' },
  'bombay-hospital-indore': { name: 'Bombay Hospital', city: 'Indore' },
  'nanavati-max-mumbai': { name: 'Nanavati Max Hospital', city: 'Mumbai' },
  'saraswathi-ims-hapur': { name: 'Saraswathi Institute of Medical Sciences', city: 'Hapur' },
  'fame-hospital-mangalore': { name: 'FAME Hospital', city: 'Mysuru' },
  'sgnc-eye-indore': { name: 'Shri Gurudev Netra Chikitsalaya', city: 'Indore' },
  'rajalakshmi-hospital-bangalore': { name: 'Rajalakshmi Hospital', city: 'Bangalore' },
  'manomay-maternity-bhopal': { name: 'Manomay Maternity and Nursing Home', city: 'Bhopal' },
  'dadar-eye-gynaec-mumbai': { name: 'Dadar Eye and Gynaec Centre', city: 'Mumbai' },
  'newera-hospitals': { name: 'NewEra Hospitals', city: 'Navi Mumbai' },
  'nurture-hospital': { name: 'Nurture Hospital', city: 'Indore' },
};

async function main() {
  const neonUrl = process.env['NEON_RAW_EVIDENCE_URL'];
  if (!neonUrl) throw new Error('Missing NEON_RAW_EVIDENCE_URL in .env');

  const pool = new Pool({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });

  console.log('Connecting to Neon raw_evidence...');

  // Resolve Prisma facility IDs (auto-create if not found)
  const facilityMap = new Map<string, string>(); // hospital_seed_id → prisma facility ID
  for (const [seedId, { name, city }] of Object.entries(HOSPITAL_MAP)) {
    let fac = await prisma.facility.findFirst({
      where: { name, city },
      select: { id: true },
    });
    if (!fac) {
      // Auto-create facility for new hospitals
      fac = await prisma.facility.create({
        data: {
          name,
          city,
          state: 'Unknown',
          tier: 'TIER_2',
          facilityType: 'HOSPITAL',
          bedCount: 100,
          icuBeds: 10,
          nabhStatus: 'NOT_ACCREDITED',
          piiScore: 50,
          trustScore: 50,
          operationalScore: 50,
          billingStabilityScore: 50,
          clinicalQualityScore: 50,
          patientExperienceScore: 50,
          fraudRiskScore: 10,
          fraudRiskLevel: 'LOW',
        },
        select: { id: true },
      });
      console.log(`  CREATED: ${name} (${city}) → ${fac.id}`);
    }
    facilityMap.set(seedId, fac.id);
    console.log(`  Mapped: ${seedId} → ${fac.id} (${name}, ${city})`);
  }

  // Pull all reviews from Neon
  const { rows } = await pool.query(`
    SELECT hospital_seed_id, source, rating, text, published_at, collected_at
    FROM raw_evidence
    ORDER BY hospital_seed_id, published_at DESC
  `);
  console.log(`\nFetched ${rows.length} reviews from Neon raw_evidence.`);

  // Group by hospital
  const grouped = new Map<string, typeof rows>();
  for (const row of rows) {
    const seedId = row.hospital_seed_id;
    if (!grouped.has(seedId)) grouped.set(seedId, []);
    grouped.get(seedId)!.push(row);
  }

  // Delete existing reviews for these facilities, then insert real ones
  let totalInserted = 0;
  for (const [seedId, reviews] of grouped) {
    const facilityId = facilityMap.get(seedId);
    if (!facilityId) {
      console.log(`  Skipping ${seedId} (no facility mapping)`);
      continue;
    }

    // Clear old mock reviews for this facility
    await prisma.review.deleteMany({ where: { facilityId } });

    // Batch insert reviews (SQLite has a limit, so chunk by 100)
    const chunkSize = 100;
    let inserted = 0;
    for (let i = 0; i < reviews.length; i += chunkSize) {
      const chunk = reviews.slice(i, i + chunkSize);
      await prisma.review.createMany({
        data: chunk.map((r: any) => ({
          facilityId,
          source: 'GOOGLE_MAPS',
          rating: r.rating ?? null,
          text: r.text?.slice(0, 2000) ?? null,
          themes: extractThemes(r.text ?? ''),
          sentimentScore: computeSentiment(r.rating, r.text),
          reviewDate: r.published_at ? new Date(r.published_at) : null,
          crawledAt: r.collected_at ? new Date(r.collected_at) : new Date(),
        })),
      });
      inserted += chunk.length;
    }
    totalInserted += inserted;
    console.log(`  ${seedId}: inserted ${inserted} reviews → facility ${facilityId}`);
  }

  console.log(`\nTotal inserted: ${totalInserted} reviews`);

  // Recompute scores from real review data
  console.log('\nRecomputing scores from real reviews...');
  for (const [seedId, reviews] of grouped) {
    const facilityId = facilityMap.get(seedId);
    if (!facilityId) continue;

    // Fetch facility record for infrastructure bonus
    const facility = await prisma.facility.findUnique({
      where: { id: facilityId },
      select: { bedCount: true, icuBeds: true, nabhStatus: true, tier: true, hasDialysis: true, hasBloodBank: true, hasCathLab: true, hasAmbulance: true },
    });

    const scores = computeScoresFromReviews(reviews, facility);
    await prisma.facility.update({
      where: { id: facilityId },
      data: {
        piiScore: scores.pii,
        trustScore: scores.trust,
        operationalScore: scores.operational,
        billingStabilityScore: scores.billing,
        clinicalQualityScore: scores.clinical,
        patientExperienceScore: scores.patient,
        fraudRiskScore: scores.fraud,
        fraudRiskLevel: scores.fraud < 30 ? 'LOW' : scores.fraud < 60 ? 'MEDIUM' : 'HIGH',
        scoreUpdatedAt: new Date(),
      },
    });
    console.log(`  ${seedId}: PII=${scores.pii.toFixed(1)}, Trust=${scores.trust.toFixed(0)}, Patient=${scores.patient.toFixed(0)}`);
  }

  await pool.end();
  await prisma.$disconnect();
  console.log('\nDone! Reviews synced and scores recomputed.');
}

/** Simple keyword-based theme extraction */
function extractThemes(text: string): string {
  const themes: string[] = [];
  const t = text.toLowerCase();
  if (/wait|delay|queue/.test(t)) themes.push('wait_time');
  if (/clean|hygien/.test(t)) themes.push('cleanliness');
  if (/staff|nurse|rude|behav/.test(t)) themes.push('staff');
  if (/bill|charge|cost|expensive/.test(t)) themes.push('billing');
  if (/doctor|treat|surgery|care/.test(t)) themes.push('clinical');
  if (/emergency|icu|critical/.test(t)) themes.push('emergency');
  if (themes.length === 0) themes.push('general');
  return themes.join(',');
}

/** Compute sentiment from rating + text heuristics */
function computeSentiment(rating: number | null, text: string | null): number {
  if (!rating && !text) return 0.5;
  // Rating-based baseline
  let score = rating ? (rating / 5) : 0.5;
  // Adjust by text heuristics
  if (text) {
    const t = text.toLowerCase();
    const negWords = (t.match(/worst|terrible|horrible|avoid|never|disgusting|fraud|cheat|died|death|negligence/g) || []).length;
    const posWords = (t.match(/excellent|amazing|best|recommend|thank|wonderful|great|superb|outstanding/g) || []).length;
    score += (posWords - negWords) * 0.05;
  }
  return Math.max(0, Math.min(1, score));
}

/** Compute dimension scores from raw reviews + facility infrastructure */
function computeScoresFromReviews(reviews: any[], facility?: any): {
  pii: number; trust: number; operational: number; billing: number;
  clinical: number; patient: number; fraud: number;
} {
  const ratings = reviews.map((r: any) => r.rating).filter((r: any) => r != null) as number[];
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 3;
  const reviewCount = reviews.length;

  // Base patient experience from average rating (0-5 → 0-100)
  const patient = Math.min(100, (avgRating / 5) * 100);

  // Volume confidence bonus (more reviews = higher confidence, capped at 5)
  const volumeBonus = Math.min(5, reviewCount / 200);

  // Sentiment analysis across reviews
  const texts = reviews.map((r: any) => (r.text ?? '').toLowerCase());
  const totalText = texts.join(' ');

  // Clinical quality signals — stricter baseline
  const clinicalPosCount = (totalText.match(/good doctor|excellent care|proper treatment|saved|life saving|skilled|professional|accurate diagnosis/g) || []).length;
  const clinicalNegCount = (totalText.match(/wrong diagnosis|negligence|malpractice|died|death due to|medical error|misdiagnos|complications|infection/g) || []).length;
  const clinicalRatio = reviewCount > 0 ? (clinicalPosCount - clinicalNegCount) / reviewCount : 0;
  let clinical = Math.min(100, Math.max(30, 70 + clinicalRatio * 40));

  // NABH accreditation implies audited clinical standards
  if (facility?.nabhStatus === 'ACCREDITED_FULL') clinical = Math.min(100, clinical + 5);
  else if (facility?.nabhStatus === 'ACCREDITED_ENTRY') clinical = Math.min(100, clinical + 3);

  // Billing signals — stricter baseline
  const billingComplaints = (totalText.match(/overcharg|expensive|loot|bill.*high|hidden charge|fraud.*bill|unnecessary.*test|money minded|costly|rip.?off/g) || []).length;
  const billingRatio = reviewCount > 0 ? billingComplaints / reviewCount : 0;
  let billing = Math.min(100, Math.max(30, 80 - billingRatio * 300));

  // Accredited hospitals have audited billing practices
  if (facility?.nabhStatus === 'ACCREDITED_FULL') billing = Math.min(100, billing + 3);

  // Trust signals (based on overall sentiment distribution)
  const highRatings = ratings.filter(r => r >= 4).length;
  const lowRatings = ratings.filter(r => r <= 2).length;
  const trustRatio = ratings.length > 0 ? highRatings / ratings.length : 0.5;
  const lowRatio = ratings.length > 0 ? lowRatings / ratings.length : 0;
  const trust = Math.min(100, Math.max(40, trustRatio * 100 - lowRatio * 30 + volumeBonus));

  // Operational signals (wait times, infrastructure)
  const opComplaints = (totalText.match(/long wait|hours? wait|crowd|dirty|no parking|poor infra|broken|unhygien|unclean|smell|delay/g) || []).length;
  const opRatio = reviewCount > 0 ? opComplaints / reviewCount : 0;
  let operational = Math.min(100, Math.max(30, 78 - opRatio * 200));

  // Facilities bonus: reward hospitals with real infrastructure
  if (facility) {
    let facBonus = 0;
    if (facility.nabhStatus === 'ACCREDITED_FULL') facBonus += 5;
    else if (facility.nabhStatus === 'ACCREDITED_ENTRY') facBonus += 3;
    if (facility.tier === 'METRO') facBonus += 3;
    if (facility.bedCount && facility.bedCount >= 100) facBonus += Math.min(4, Math.floor(facility.bedCount / 150));
    if (facility.icuBeds && facility.icuBeds >= 10) facBonus += 2;
    if (facility.hasBloodBank) facBonus += 1;
    if (facility.hasDialysis) facBonus += 1;
    if (facility.hasCathLab) facBonus += 1;
    if (facility.hasAmbulance) facBonus += 1;
    operational = Math.min(100, operational + facBonus);
  }

  // Fraud signals — baseline from negative review patterns, boosted by explicit fraud keywords
  const fraudSignals = (totalText.match(/fraud|cheat|unnecessary.*surgery|forced.*admit|money.*making|racket|scam|consumer court|negligence|sued|legal/g) || []).length;
  const fraudRatio = reviewCount > 0 ? fraudSignals / reviewCount : 0;
  // Baseline: derive from low ratings + billing complaints (every hospital has some risk)
  const lowRatingRatio = ratings.length > 0 ? ratings.filter(r => r <= 2).length / ratings.length : 0;
  const fraudBaseline = Math.max(2, lowRatingRatio * 20 + billingRatio * 25);
  const fraud = Math.min(20, fraudBaseline + fraudRatio * 400);

  // PII composite: PII = (Patient×0.30 + Clinical×0.25 + Billing×0.20 + Trust×0.15 + Operational×0.10) / 0.96 − FraudPenalty
  // Weights sum to 1.00; /0.96 normalization allows top-rated hospitals to reach ~90
  const baseScore = (patient * 0.30 + clinical * 0.25 + billing * 0.20 + trust * 0.15 + operational * 0.10) / 0.96;
  const fraudPenalty = fraud > 20 ? Math.min(15, 15 * ((fraud - 20) / 80)) : 0;
  const pii = Math.max(0, Math.min(100, baseScore - fraudPenalty));

  return { pii, trust, operational, billing, clinical, patient, fraud };
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
