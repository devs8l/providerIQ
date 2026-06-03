/**
 * Batch Google Maps review fetcher + Neon storage.
 * Rotates API keys and sort orders to fetch ALL reviews in 500-review batches.
 *
 * Usage:
 *   npx tsx src/dev/batch-google-reviews.ts
 *
 * Strategy:
 *   - Fetches 500 reviews per batch with different sort orders
 *   - Rotates Apify API keys across batches to avoid hitting any single key's limit
 *   - Delta logic: only inserts new reviews (skips duplicates by source_record_id)
 *   - Stops when a batch returns 0 new reviews (all already in DB)
 */
import { config } from 'dotenv';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';

config({ path: resolve(import.meta.dirname, '../../../../.env') });

import { ApifyGoogleMapsReviewsConnector } from '../connectors/apify-google-maps-reviews.connector.js';
import { buildAcquisitionConfig } from '../config/acquisition-config.js';
import { NeonEvidenceStore } from '../storage/neon-evidence-store.js';

// ─── API Key Pool ────────────────────────────────────────────────────────────

const API_KEYS: string[] = [
  process.env['APIFY_API_TOKEN_STELLAR8LABS']!,
  process.env['APIFY_API_TOKEN_STELLAR8TECH']!,
  process.env['APIFY_API_TOKEN_VD']!,
  process.env['APIFY_API_TOKEN_DC']!,
  process.env['APIFY_API_TOKEN_DS']!,
  process.env['APIFY_API_TOKEN_DEVELOPER_STELLAR8LABS']!,
].filter(Boolean);

// Sort orders to maximize unique review coverage (Apify uses camelCase)
const SORT_ORDERS = ['newest'] as const;

const BATCH_SIZE = 1000; // Pull all reviews in one shot

// ─── Hospital Seeds ──────────────────────────────────────────────────────────

interface HospitalSeed {
  id: string;
  name: string;
  city: string;
  googleMapsUrl: string;
}

const HOSPITAL_SEEDS: HospitalSeed[] = [
  {
    id: 'newera-hospitals',
    name: 'NewEra Hospitals',
    city: 'Unknown',
    googleMapsUrl: 'https://maps.app.goo.gl/TmyggRLmc2iABoL58',
  },
  {
    id: 'nurture-hospital',
    name: 'Nurture Hospital',
    city: 'Unknown',
    googleMapsUrl: 'https://maps.app.goo.gl/7H4xzYHxRKRkVrQa8',
  },
];

// ─── Main ────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const neonUrl = process.env['NEON_RAW_EVIDENCE_URL'];
  if (!neonUrl) throw new Error('Missing NEON_RAW_EVIDENCE_URL in .env');
  if (API_KEYS.length === 0) throw new Error('No Apify API keys found in .env');

  console.log(`Loaded ${API_KEYS.length} API keys`);
  console.log(`Sort orders: ${SORT_ORDERS.join(', ')}`);
  console.log(`Batch size: ${BATCH_SIZE}\n`);

  const acqConfig = buildAcquisitionConfig();
  const store = new NeonEvidenceStore({ connectionString: neonUrl });
  const connector = new ApifyGoogleMapsReviewsConnector(acqConfig);

  await store.ensureTable();
  console.log('Table ready.\n');

  let keyIndex = 2; // keys 0-1 exhausted
  let totalNewReviews = 0;
  let consecutiveEmptyBatches = 0;

  for (const seed of HOSPITAL_SEEDS) {
    console.log(`══ ${seed.name} (${seed.city}) ══`);
    const existingCount = await store.getCount(seed.id, 'GOOGLE_MAPS_REVIEWS');
    console.log(`  Existing reviews in DB: ${existingCount}`);

    consecutiveEmptyBatches = 0;

    for (const sort of SORT_ORDERS) {
      if (consecutiveEmptyBatches >= 2) {
        console.log(`  Stopping: 2 consecutive batches returned no new reviews.`);
        break;
      }

      const token = API_KEYS[keyIndex % API_KEYS.length]!;
      const tokenLabel = `key[${keyIndex % API_KEYS.length}]`;
      keyIndex++;

      const runId = randomUUID();
      console.log(`  ── Batch: sort=${sort}, ${tokenLabel} ──`);

      try {
        const result = await connector.fetchReviews({
          runId,
          hospitalSeedId: seed.id,
          hospitalName: seed.name,
          city: seed.city,
          googleMapsUrl: seed.googleMapsUrl,
          maxReviews: BATCH_SIZE,
          reviewsSort: sort,
          apiTokenOverride: token,
        });

        console.log(`    Apify returned: ${result.records.length} reviews`);

        const { inserted, skipped } = await store.upsertBatch(result.records);
        console.log(`    Stored: ${inserted} new, ${skipped} duplicates skipped`);
        totalNewReviews += inserted;

        if (inserted === 0) {
          consecutiveEmptyBatches++;
        } else {
          consecutiveEmptyBatches = 0;
        }

        const newTotal = await store.getCount(seed.id, 'GOOGLE_MAPS_REVIEWS');
        console.log(`    Total in DB: ${newTotal}\n`);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.includes('usage hard limit')) {
          console.log(`    Key exhausted (limit hit), rotating...`);
          // Try next key with same sort
          const nextToken = API_KEYS[keyIndex % API_KEYS.length]!;
          keyIndex++;
          try {
            const result = await connector.fetchReviews({
              runId: randomUUID(),
              hospitalSeedId: seed.id,
              hospitalName: seed.name,
              city: seed.city,
              googleMapsUrl: seed.googleMapsUrl,
              maxReviews: BATCH_SIZE,
              reviewsSort: sort,
              apiTokenOverride: nextToken,
            });
            console.log(`    Retry OK: ${result.records.length} reviews`);
            const { inserted, skipped } = await store.upsertBatch(result.records);
            console.log(`    Stored: ${inserted} new, ${skipped} duplicates\n`);
            totalNewReviews += inserted;
          } catch (retryErr) {
            console.error(`    Retry also failed: ${retryErr instanceof Error ? retryErr.message : String(retryErr)}\n`);
          }
        } else {
          console.error(`    ERROR: ${msg}\n`);
        }
      }
    }
  }

  await store.disconnect();
  console.log(`\n══ Summary ══`);
  console.log(`  New reviews added this run: ${totalNewReviews}`);
  console.log('Done.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
