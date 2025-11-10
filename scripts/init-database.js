#!/usr/bin/env node
/**
 * Database Initialization Script
 *
 * This script sets up required database indexes that Prisma doesn't support natively.
 * Run this ONCE after deploying to a new environment (production, staging, etc.)
 *
 * What it does:
 * 1. Creates sparse unique indexes on journalEntryId fields
 * 2. Verifies the indexes were created correctly
 * 3. Safe to run multiple times (idempotent)
 *
 * Why sparse indexes?
 * - In cash accounting, only PAID transactions have journal entries
 * - Unpaid revenues/expenses have journalEntryId = null
 * - We need to allow MULTIPLE null values (many unpaid transactions)
 * - But only ONE revenue/expense per journal entry (when paid)
 *
 * MongoDB sparse indexes ignore null values, so:
 * ✓ Revenue A: journalEntryId = null (allowed)
 * ✓ Revenue B: journalEntryId = null (allowed)
 * ✓ Revenue C: journalEntryId = "abc123" (allowed)
 * ✗ Revenue D: journalEntryId = "abc123" (ERROR: duplicate!)
 *
 * Usage:
 *   node scripts/init-database.js
 *
 * Or via npm:
 *   npm run db:init
 */

const { MongoClient } = require('mongodb');

async function initDatabase() {
  const DATABASE_URL = process.env.DATABASE_URL;

  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set');
    console.error(
      '   Please set DATABASE_URL in your .env file or environment'
    );
    process.exit(1);
  }

  console.log('🚀 Initializing database indexes...\n');
  console.log(`📍 Connecting to: ${DATABASE_URL.replace(/\/\/.*@/, '//***@')}`);

  const client = new MongoClient(DATABASE_URL);

  try {
    await client.connect();
    console.log('✓ Connected to MongoDB\n');

    const db = client.db();

    // Create sparse unique index on revenues.journalEntryId
    console.log('📝 Creating sparse unique index: revenues.journalEntryId');
    try {
      await db.collection('revenues').createIndex(
        { journalEntryId: 1 },
        {
          unique: true,
          sparse: true,
          name: 'revenues_journalEntryId_sparse_unique',
        }
      );
      console.log('   ✓ Created successfully');
    } catch (error) {
      if (error.code === 85) {
        console.log('   ⚠️  Index already exists (skipping)');
      } else {
        throw error;
      }
    }

    // Create sparse unique index on expenses.journalEntryId
    console.log('📝 Creating sparse unique index: expenses.journalEntryId');
    try {
      await db.collection('expenses').createIndex(
        { journalEntryId: 1 },
        {
          unique: true,
          sparse: true,
          name: 'expenses_journalEntryId_sparse_unique',
        }
      );
      console.log('   ✓ Created successfully');
    } catch (error) {
      if (error.code === 85) {
        console.log('   ⚠️  Index already exists (skipping)');
      } else {
        throw error;
      }
    }

    // Verify indexes
    console.log('\n📋 Verifying indexes...\n');

    console.log('   Revenues indexes:');
    const revenueIndexes = await db.collection('revenues').indexes();
    revenueIndexes.forEach((idx) => {
      const flags = [];
      if (idx.unique) flags.push('unique');
      if (idx.sparse) flags.push('sparse');
      const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
      console.log(`     - ${idx.name}${flagStr}`);
    });

    console.log('\n   Expenses indexes:');
    const expenseIndexes = await db.collection('expenses').indexes();
    expenseIndexes.forEach((idx) => {
      const flags = [];
      if (idx.unique) flags.push('unique');
      if (idx.sparse) flags.push('sparse');
      const flagStr = flags.length > 0 ? ` [${flags.join(', ')}]` : '';
      console.log(`     - ${idx.name}${flagStr}`);
    });

    // Show current data stats
    const nullRevenues = await db
      .collection('revenues')
      .countDocuments({ journalEntryId: null });
    const paidRevenues = await db
      .collection('revenues')
      .countDocuments({ journalEntryId: { $ne: null } });
    const nullExpenses = await db
      .collection('expenses')
      .countDocuments({ journalEntryId: null });
    const paidExpenses = await db
      .collection('expenses')
      .countDocuments({ journalEntryId: { $ne: null } });

    console.log('\n📊 Current data:');
    console.log(`   Revenues: ${paidRevenues} paid, ${nullRevenues} unpaid`);
    console.log(`   Expenses: ${paidExpenses} paid, ${nullExpenses} unpaid`);

    console.log('\n✅ Database initialization complete!\n');
  } catch (error) {
    console.error('\n❌ Error initializing database:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  initDatabase();
}

module.exports = { initDatabase };
