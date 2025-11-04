#!/usr/bin/env tsx
/**
 * Flush Database Script
 *
 * WARNING: This script deletes ALL data from the database.
 * Use only for testing purposes!
 *
 * Usage: npm run db:flush
 */

/* eslint-disable no-console */
import {
  clearDatabase,
  seedTestAccounts,
  setupTestDatabase,
  teardownTestDatabase,
} from '../lib/test-utils/db-setup';

async function main() {
  console.log('🔄 Connecting to database...');
  await setupTestDatabase();

  console.log('🗑️  Clearing all data...');
  await clearDatabase();

  console.log('🌱 Seeding test accounts...');
  await seedTestAccounts();

  console.log('✅ Database flushed and test accounts seeded successfully!');

  await teardownTestDatabase();
  process.exit(0);
}

main().catch((error) => {
  console.error('❌ Error flushing database:', error);
  process.exit(1);
});
