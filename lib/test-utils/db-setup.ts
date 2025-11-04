/**
 * Test Database Setup Utilities
 *
 * Provides helper functions for setting up and tearing down test databases
 * for accounting rules tests.
 */

import { prisma } from '../db';
import { connectDb, disconnectDb, mongoose } from '../db';

/**
 * Connect to the test database before all tests
 */
export async function setupTestDatabase() {
  await connectDb();
}

/**
 * Disconnect from the test database after all tests
 */
export async function teardownTestDatabase() {
  await disconnectDb();
}

/**
 * Clear all data from the database (use with caution!)
 * This is useful for test isolation
 */
export async function clearDatabase() {
  // Clear Prisma data
  await prisma.journalEntryLine.deleteMany({});
  await prisma.journalEntry.deleteMany({});
  await prisma.revenue.deleteMany({});
  await prisma.expense.deleteMany({});
  await prisma.projectFreelancer.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.client.deleteMany({});
  await prisma.freelancer.deleteMany({});

  // Clear self-referential parent relationships first
  await prisma.chartOfAccount.updateMany({
    where: { parentId: { not: null } },
    data: { parentId: null },
  });

  // Now delete all accounts
  await prisma.chartOfAccount.deleteMany({});
  await prisma.user.deleteMany({});

  // Clear Medici collections (if they exist)
  if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
    const collections = [
      'medici_transactions',
      'medici_journals',
      'medici_balances',
      'medici_locks',
    ];
    for (const collectionName of collections) {
      try {
        await mongoose.connection.db.collection(collectionName).deleteMany({});
      } catch (_error) {
        // Collection might not exist yet, ignore error
      }
    }
  }
}

/**
 * Create a test user
 */
export async function createTestUser() {
  return prisma.user.create({
    data: {
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedpassword',
      role: 'USER',
      active: true,
    },
  });
}

/**
 * Create standard chart of accounts for testing
 * Based on the cash basis accounting rules
 */
export async function seedTestAccounts() {
  const accounts = [
    // ASSETS (1xxx)
    {
      code: '1001',
      name: 'Cash - PayPal',
      type: 'ASSET',
      description: 'PayPal account balance',
      isSystem: true,
    },
    {
      code: '1003',
      name: 'Cash - Bank',
      type: 'ASSET',
      description: 'Main bank account',
      isSystem: true,
    },
    {
      code: '1300',
      name: 'Prepaid Expenses',
      type: 'ASSET',
      description: 'Expenses paid in advance',
      isSystem: true,
    },

    // LIABILITIES (2xxx)
    {
      code: '2200',
      name: 'Taxes Payable',
      type: 'LIABILITY',
      description: 'Tax obligations',
      isSystem: true,
    },
    {
      code: '2300',
      name: 'Deferred Revenue',
      type: 'LIABILITY',
      description: 'Revenue received in advance',
      isSystem: true,
    },

    // EQUITY (3xxx)
    {
      code: '3000',
      name: "Owner's Equity",
      type: 'EQUITY',
      description: 'Owner capital contributions',
      isSystem: true,
    },

    // INCOME/REVENUE (4xxx)
    {
      code: '4000',
      name: 'Project Revenue',
      type: 'INCOME',
      description: 'Revenue from client projects',
      isSystem: true,
    },
    {
      code: '4010',
      name: 'Marketing & Sales Revenue',
      type: 'INCOME',
      description: 'Revenue from marketing and sales services',
      isSystem: true,
    },

    // EXPENSES (5xxx)
    {
      code: '5001',
      name: 'Freelancer Expense',
      type: 'EXPENSE',
      description: 'Payments to freelancers and vendors',
      isSystem: true,
    },
    {
      code: '5100',
      name: 'Subscription Expense',
      type: 'EXPENSE',
      description: 'Software subscriptions and recurring services',
      isSystem: true,
    },
    {
      code: '5400',
      name: 'Transaction Fee Expense',
      type: 'EXPENSE',
      description: 'Payment processing fees',
      isSystem: true,
    },
    {
      code: '5500',
      name: 'Legal & Compliance',
      type: 'EXPENSE',
      description: 'Legal and compliance expenses',
      isSystem: true,
    },
    {
      code: '5601',
      name: 'Founder Loan - Ahmed',
      type: 'LIABILITY',
      description: 'Liability owed to founder Ahmed',
      isSystem: true,
    },
    {
      code: '5602',
      name: 'Founder Loan - Yasser',
      type: 'LIABILITY',
      description: 'Liability owed to founder Yasser',
      isSystem: true,
    },
  ];

  for (const account of accounts) {
    await prisma.chartOfAccount.create({
      data: account,
    });
  }
}
