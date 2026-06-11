/**
 * Import objective hospital data from Hospinfo.csv (GIC empanelment data)
 * into the local Prisma SQLite DB.
 *
 * CREATES new facility records for each CSV row. Never matches or updates existing facilities.
 * CSV hospitals are completely separate from review-scraped hospitals.
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { resolve } from 'path';

const prisma = new PrismaClient();

/** Simple CSV parser that handles quoted fields with commas */
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const fields: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    rows.push(fields);
  }
  return rows;
}

// Column indices from the CSV header (verified against actual header row)
const COL = {
  id: 0,
  name: 1,
  email: 2,
  mobile: 3,
  registrationDate: 4,
  status: 8,
  totalScore: 10,
  totalBeds: 11,
  address1: 12,
  address2: 13,
  area: 14,
  city: 15,
  state: 18,
  pincode: 19,
  pan: 20,
  latitude: 21,
  longitude: 22,
  registrationNo: 23,
  rohiniId: 7,
  providerCategory: 29,  // Hospital / Day Care
  providerStream: 30,    // Allopathy, Ayush
  specialityType: 31,    // Single / Multi Speciality
  speciality: 32,        // e.g., Ophthalmology (Eye Care)
  ownership: 33,         // Trust, Private Ltd, etc.
  pharmacy: 34,
  fireNoc: 35,
  nabhAccreditation: 40,
  nabhType: 41,          // NABH- Entry Level, NABH- Full
  specialtyOffered: 48,
  yearEstablished: 55,
  drBedRatio: 56,
  nurseBedRatio: 57,
  icuBeds: 58,
  iccuBeds: 59,
  nicuBeds: 60,
  picuBeds: 61,
  isolationBeds: 62,
  hduBeds: 64,
  ventilators: 65,
  ambulance: 70,
  bloodBank: 72,
  dialysis: 79,
  cathLab: 84,
  fullTimeSuperSpecialists: 98,
  fullTimeSpecialists: 99,
  fullTimeMbbs: 100,
  totalNurses: 108,
  totalSurgeons: 104,
};

function parseNabhStatus(nabhAccred: string, nabhType: string): string {
  if (!nabhAccred || nabhAccred.toLowerCase() === 'no') return 'NOT_ACCREDITED';
  const t = (nabhType || '').toLowerCase();
  if (t.includes('full')) return 'ACCREDITED_FULL';
  if (t.includes('entry')) return 'ACCREDITED_ENTRY';
  if (t.includes('progressive')) return 'ACCREDITED_PROGRESSIVE';
  return 'ACCREDITED_ENTRY';
}

function parseBool(val: string): boolean {
  if (!val) return false;
  const v = val.toLowerCase().trim();
  return v === 'yes' || v === 'true' || v === 'in-house' || v === 'outsourced';
}

function parseIntSafe(val: string): number | null {
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function parseCity(raw: string): string {
  let city = raw.trim().split('-')[0].split(',')[0].trim();
  city = city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  const map: Record<string, string> = {
    'bangalore': 'Bangalore',
    'bangalore rural': 'Bangalore',
    'mumbai': 'Mumbai',
    'indore': 'Indore',
    'bhopal': 'Bhopal',
    'ujjain': 'Ujjain',
  };
  return map[city.toLowerCase()] || city;
}

function parseState(raw: string): string {
  const s = raw.trim();
  return s.split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

async function main() {
  const csvPath = resolve(import.meta.dirname, '../../../Hospinfo.csv');
  const raw = readFileSync(csvPath, 'utf-8');
  const records = parseCSV(raw);

  // Skip header row
  const dataRows = records.slice(1);
  console.log(`Loaded ${dataRows.length} hospitals from Hospinfo.csv\n`);

  let created = 0;
  let skipped = 0;

  for (const row of dataRows) {
    const csvName = row[COL.name] || '';
    const csvCity = parseCity(row[COL.city] || '');
    const csvState = parseState(row[COL.state] || '');

    if (!csvName) {
      skipped++;
      continue;
    }

    const totalBeds = parseIntSafe(row[COL.totalBeds]);
    const icuBeds = parseIntSafe(row[COL.icuBeds]);
    const nicuBeds = parseIntSafe(row[COL.nicuBeds]);
    const picuBeds = parseIntSafe(row[COL.picuBeds]);
    const isolationBeds = parseIntSafe(row[COL.isolationBeds]);
    const hduBeds = parseIntSafe(row[COL.hduBeds]);
    const ventilators = parseIntSafe(row[COL.ventilators]);
    const yearEst = parseIntSafe(row[COL.yearEstablished]);

    const fullTimeSS = parseIntSafe(row[COL.fullTimeSuperSpecialists]) ?? 0;
    const fullTimeSpec = parseIntSafe(row[COL.fullTimeSpecialists]) ?? 0;
    const fullTimeMbbs = parseIntSafe(row[COL.fullTimeMbbs]) ?? 0;
    const totalDoctors = fullTimeSS + fullTimeSpec + fullTimeMbbs || null;
    const totalNurses = parseIntSafe(row[COL.totalNurses]);
    const totalSurgeons = parseIntSafe(row[COL.totalSurgeons]);

    const specialties = row[COL.specialtyOffered] === 'Yes' ?
      (row[COL.specialityType] === 'Multi Speciality' ? 'Multi Speciality' : row[COL.speciality] || null)
      : row[COL.speciality] || null;

    const address = [row[COL.address1], row[COL.address2], row[COL.area]].filter(Boolean).join(', ');

    // Create as a brand new facility — never match existing
    await prisma.facility.create({
      data: {
        name: csvName,
        city: csvCity,
        state: csvState,
        tier: 'TIER_2',
        facilityType: 'HOSPITAL',

        // Location
        ...(row[COL.latitude] ? { latitude: parseFloat(row[COL.latitude]) || undefined } : {}),
        ...(row[COL.longitude] ? { longitude: parseFloat(row[COL.longitude]) || undefined } : {}),
        ...(row[COL.pincode] ? { pincode: row[COL.pincode] } : {}),
        ...(address ? { address } : {}),

        // Beds & infrastructure
        ...(totalBeds ? { bedCount: totalBeds } : {}),
        ...(icuBeds != null ? { icuBeds } : {}),
        ...(nicuBeds != null ? { nicuBeds } : {}),
        ...(picuBeds != null ? { picuBeds } : {}),
        ...(isolationBeds != null ? { isolationBeds } : {}),
        ...(hduBeds != null ? { hduBeds } : {}),
        ...(ventilators != null ? { ventilatorCount: ventilators } : {}),

        // Characteristics
        ...(row[COL.ownership] ? { ownershipType: row[COL.ownership] } : {}),
        ...(yearEst ? { yearEstablished: yearEst } : {}),
        ...(row[COL.providerStream] ? { providerStream: row[COL.providerStream] } : {}),
        ...(specialties ? { specialties } : {}),

        // GIC empanelment (always true for CSV hospitals)
        gicEmpanelled: true,
        ...(row[COL.rohiniId] ? { gicRohiniId: row[COL.rohiniId] } : {}),
        ...(parseIntSafe(row[COL.totalScore]) ? { gicTotalScore: parseIntSafe(row[COL.totalScore]) } : {}),
        ...(row[COL.registrationNo] ? { gicRegistrationNo: row[COL.registrationNo] } : {}),

        // NABH
        nabhStatus: parseNabhStatus(row[COL.nabhAccreditation], row[COL.nabhType]),

        // Infrastructure booleans
        hasPharmacy: parseBool(row[COL.pharmacy]),
        hasFireNoc: parseBool(row[COL.fireNoc]),
        hasBloodBank: parseBool(row[COL.bloodBank]),
        hasAmbulance: parseBool(row[COL.ambulance]),
        ambulanceType: row[COL.ambulance] && row[COL.ambulance].trim() !== 'Not Available' ? row[COL.ambulance].trim() : null,
        hasCathLab: parseBool(row[COL.cathLab]),
        hasDialysis: parseBool(row[COL.dialysis]),

        // Ratios
        ...(row[COL.drBedRatio] ? { drBedRatio: row[COL.drBedRatio] } : {}),
        ...(row[COL.nurseBedRatio] ? { nurseBedRatio: row[COL.nurseBedRatio] } : {}),

        // Staff
        ...(totalDoctors ? { totalDoctors } : {}),
        ...(totalNurses ? { totalNurses } : {}),
        ...(totalSurgeons ? { totalSurgeons } : {}),

        // Default scores (will be computed later when we have review data)
        piiScore: 50,
        trustScore: 50,
        operationalScore: 50,
        billingStabilityScore: 50,
        clinicalQualityScore: 50,
        patientExperienceScore: 50,
        fraudRiskScore: 10,
        fraudRiskLevel: 'LOW',
      },
    });

    created++;
    console.log(`  ✓ CREATED: ${csvName} (${csvCity}, ${csvState})`);
  }

  console.log(`\n══ Summary ══`);
  console.log(`  Created: ${created} new facilities`);
  console.log(`  Skipped (no name): ${skipped}`);

  await prisma.$disconnect();
  console.log('\nDone!');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
