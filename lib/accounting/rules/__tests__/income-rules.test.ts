/**
 * Tests for Income Accounting Rules (Cash Basis)
 *
 * Tests Rules 1, 2, and 4
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  seedTestAccounts,
} from '../../../test-utils/db-setup';
import {
  recordClientPayment,
  recordClientPaymentWithFees,
  recordMarketingSalesRevenue,
} from '../income-rules';
import { getBalance } from '../../../medici';

describe('Income Accounting Rules', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await teardownTestDatabase();
  });

  beforeEach(async () => {
    await clearDatabase();
    await seedTestAccounts();
  });

  describe('Rule 1: Client Payment Received', () => {
    it('should record client payment and increase cash and revenue', async () => {
      const result = await recordClientPayment({
        date: new Date('2025-01-15'),
        description: 'Payment from Client X for Project Y',
        amount: 1200,
        cashAccountCode: '1003', // Bank
        revenueAccountCode: '4000', // Project Revenue
      });

      // Verify result
      if (!result.success) {
        console.error('Rule 1 failed:', result.error);
      }
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (cash)
      const cashTxn = result.transactions.find((t) => t.type === 'debit');
      expect(cashTxn).toBeDefined();
      expect(cashTxn?.accountCode).toBe('1003');
      expect(cashTxn?.amount).toBe(1200);

      // Verify credit transaction (revenue)
      const revenueTxn = result.transactions.find((t) => t.type === 'credit');
      expect(revenueTxn).toBeDefined();
      expect(revenueTxn?.accountCode).toBe('4000');
      expect(revenueTxn?.amount).toBe(1200);

      // Verify balances in Medici
      // Note: Medici calculates balance as (credits - debits)
      // For ASSET accounts (like cash), debits are positive transactions but show as negative balance
      // For INCOME accounts (like revenue), credits are positive transactions and show as positive balance
      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-1200); // Asset: debit of 1200 shows as -1200

      const revenueBalance = await getBalance('4000');
      expect(revenueBalance.balance).toBe(1200); // Income: credit of 1200 shows as 1200
    });

    it('should fail if cash account does not exist', async () => {
      const result = await recordClientPayment({
        date: new Date('2025-01-15'),
        description: 'Test payment',
        amount: 1000,
        cashAccountCode: '9999', // Non-existent
        revenueAccountCode: '4000',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cash account 9999 not found');
    });

    it('should fail if revenue account does not exist', async () => {
      const result = await recordClientPayment({
        date: new Date('2025-01-15'),
        description: 'Test payment',
        amount: 1000,
        cashAccountCode: '1003',
        revenueAccountCode: '9999', // Non-existent
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Revenue account 9999 not found');
    });

    it('should support multiple payments', async () => {
      // First payment
      await recordClientPayment({
        date: new Date('2025-01-15'),
        description: 'Payment 1',
        amount: 1000,
        cashAccountCode: '1003',
        revenueAccountCode: '4000',
      });

      // Second payment
      await recordClientPayment({
        date: new Date('2025-01-20'),
        description: 'Payment 2',
        amount: 500,
        cashAccountCode: '1003',
        revenueAccountCode: '4000',
      });

      // Verify total balances
      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-1500); // Asset: total debits of 1500 show as -1500

      const revenueBalance = await getBalance('4000');
      expect(revenueBalance.balance).toBe(1500); // Income: total credits of 1500 show as 1500
    });
  });

  describe('Rule 2: Client Payment with Fees', () => {
    it('should record payment with fees correctly', async () => {
      const result = await recordClientPaymentWithFees({
        date: new Date('2025-01-15'),
        description: 'Payment via PayPal with fees',
        amount: 1200,
        feeAmount: 30,
        cashAccountCode: '1001', // PayPal
        revenueAccountCode: '4000',
        feeAccountCode: '5400',
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(3);

      // Verify net cash received
      const cashTxn = result.transactions.find((t) => t.accountCode === '1001');
      expect(cashTxn?.type).toBe('debit');
      expect(cashTxn?.amount).toBe(1170); // 1200 - 30

      // Verify fee expense
      const feeTxn = result.transactions.find((t) => t.accountCode === '5400');
      expect(feeTxn?.type).toBe('debit');
      expect(feeTxn?.amount).toBe(30);

      // Verify total revenue
      const revenueTxn = result.transactions.find(
        (t) => t.accountCode === '4000'
      );
      expect(revenueTxn?.type).toBe('credit');
      expect(revenueTxn?.amount).toBe(1200);

      // Verify balances
      const cashBalance = await getBalance('1001');
      expect(cashBalance.balance).toBe(-1170); // Asset: debit of 1170 shows as -1170

      const feeBalance = await getBalance('5400');
      expect(feeBalance.balance).toBe(-30); // Expense: debit of 30 shows as -30

      const revenueBalance = await getBalance('4000');
      expect(revenueBalance.balance).toBe(1200); // Income: credit of 1200 shows as 1200
    });

    it('should handle zero fees', async () => {
      const result = await recordClientPaymentWithFees({
        date: new Date('2025-01-15'),
        description: 'Payment with no fees',
        amount: 1000,
        feeAmount: 0,
        cashAccountCode: '1003',
        revenueAccountCode: '4000',
        feeAccountCode: '5400',
      });

      expect(result.success).toBe(true);

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-1000); // Asset: debit of 1000 shows as -1000

      const feeBalance = await getBalance('5400');
      expect(feeBalance.balance).toBe(0); // No fee transactions
    });

    it('should fail if fee account does not exist', async () => {
      const result = await recordClientPaymentWithFees({
        date: new Date('2025-01-15'),
        description: 'Test payment',
        amount: 1000,
        feeAmount: 30,
        cashAccountCode: '1001',
        revenueAccountCode: '4000',
        feeAccountCode: '9999', // Non-existent
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Fee account 9999 not found');
    });
  });

  describe('Rule 4: Marketing & Sales Services Revenue', () => {
    it('should record marketing revenue correctly', async () => {
      const result = await recordMarketingSalesRevenue({
        date: new Date('2025-01-15'),
        description: 'Lead generation service payment',
        amount: 500,
        cashAccountCode: '1003',
        revenueAccountCode: '4010',
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify cash debit
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('debit');
      expect(cashTxn?.amount).toBe(500);

      // Verify revenue credit
      const revenueTxn = result.transactions.find(
        (t) => t.accountCode === '4010'
      );
      expect(revenueTxn?.type).toBe('credit');
      expect(revenueTxn?.amount).toBe(500);

      // Verify balances
      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-500); // Asset: debit of 500 shows as -500

      const revenueBalance = await getBalance('4010');
      expect(revenueBalance.balance).toBe(500); // Income: credit of 500 shows as 500
    });

    it('should keep marketing revenue separate from project revenue', async () => {
      // Record project revenue
      await recordClientPayment({
        date: new Date('2025-01-15'),
        description: 'Project payment',
        amount: 1000,
        cashAccountCode: '1003',
        revenueAccountCode: '4000',
      });

      // Record marketing revenue
      await recordMarketingSalesRevenue({
        date: new Date('2025-01-15'),
        description: 'Marketing payment',
        amount: 500,
        cashAccountCode: '1003',
        revenueAccountCode: '4010',
      });

      // Verify separate balances
      const projectRevenueBalance = await getBalance('4000');
      expect(projectRevenueBalance.balance).toBe(1000); // Income: credit of 1000 shows as 1000

      const marketingRevenueBalance = await getBalance('4010');
      expect(marketingRevenueBalance.balance).toBe(500); // Income: credit of 500 shows as 500

      // Verify total cash
      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-1500); // Asset: total debits of 1500 show as -1500
    });
  });

  describe('Double-Entry Validation', () => {
    it('should maintain balanced debits and credits for all rules', async () => {
      // Rule 1
      const result1 = await recordClientPayment({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 1000,
        cashAccountCode: '1003',
        revenueAccountCode: '4000',
      });
      const debits1 = result1.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits1 = result1.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits1).toBe(credits1);

      // Rule 2
      const result2 = await recordClientPaymentWithFees({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 1200,
        feeAmount: 30,
        cashAccountCode: '1001',
        revenueAccountCode: '4000',
        feeAccountCode: '5400',
      });
      const debits2 = result2.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits2 = result2.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits2).toBe(credits2);

      // Rule 4
      const result4 = await recordMarketingSalesRevenue({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 500,
        cashAccountCode: '1003',
        revenueAccountCode: '4010',
      });
      const debits4 = result4.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits4 = result4.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits4).toBe(credits4);
    });
  });
});
