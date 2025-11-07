/**
 * Tests for Expense Accounting Rules (Cash Basis)
 *
 * Tests Rules 6, 7, 8, and 9
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  seedTestAccounts,
} from '../../../test-utils/db-setup';
import {
  recordVendorPayment,
  recordSubscriptionPayment,
  recordFounderLoanExpense,
  recordFounderLoanRepayment,
} from '../expense-rules';
import { getBalance } from '../../../medici';

describe('Expense Accounting Rules', () => {
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

  describe('Rule 6: Vendor Payment', () => {
    it('should record vendor payment and decrease cash', async () => {
      const result = await recordVendorPayment({
        date: new Date('2025-01-15'),
        description: 'Payment to Freelancer X for design work',
        amount: 500,
        cashAccountCode: '1003', // Bank
        expenseAccountCode: '5001', // Freelancer Expense
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (expense)
      const expenseTxn = result.transactions.find((t) => t.type === 'debit');
      expect(expenseTxn).toBeDefined();
      expect(expenseTxn?.accountCode).toBe('5001');
      expect(expenseTxn?.amount).toBe(500);

      // Verify credit transaction (cash)
      const cashTxn = result.transactions.find((t) => t.type === 'credit');
      expect(cashTxn).toBeDefined();
      expect(cashTxn?.accountCode).toBe('1003');
      expect(cashTxn?.amount).toBe(500);

      // Verify balances in Medici
      const expenseBalance = await getBalance('5001');
      expect(expenseBalance.balance).toBe(-500); // Expense: debit of 500 shows as -500

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(500); // Asset: credit of 500 shows as 500
    });

    it('should fail if cash account does not exist', async () => {
      const result = await recordVendorPayment({
        date: new Date('2025-01-15'),
        description: 'Test payment',
        amount: 500,
        cashAccountCode: '9999', // Non-existent
        expenseAccountCode: '5001',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cash account 9999 not found');
    });

    it('should fail if expense account does not exist', async () => {
      const result = await recordVendorPayment({
        date: new Date('2025-01-15'),
        description: 'Test payment',
        amount: 500,
        cashAccountCode: '1003',
        expenseAccountCode: '9999', // Non-existent
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expense account 9999 not found');
    });

    it('should support multiple vendor payments', async () => {
      // First payment
      await recordVendorPayment({
        date: new Date('2025-01-15'),
        description: 'Payment 1',
        amount: 300,
        cashAccountCode: '1003',
        expenseAccountCode: '5001',
      });

      // Second payment
      await recordVendorPayment({
        date: new Date('2025-01-20'),
        description: 'Payment 2',
        amount: 200,
        cashAccountCode: '1003',
        expenseAccountCode: '5001',
      });

      // Verify total balances
      const expenseBalance = await getBalance('5001');
      expect(expenseBalance.balance).toBe(-500); // Expense: total debits of 500 show as -500

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(500); // Asset: total credits of 500 show as 500
    });
  });

  describe('Rule 7: Software Subscription Payment', () => {
    it('should record subscription payment correctly', async () => {
      const result = await recordSubscriptionPayment({
        date: new Date('2025-01-15'),
        description: 'Monthly Figma subscription',
        amount: 45,
        cashAccountCode: '1003', // Bank
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify expense debit
      const expenseTxn = result.transactions.find(
        (t) => t.accountCode === '5100'
      );
      expect(expenseTxn?.type).toBe('debit');
      expect(expenseTxn?.amount).toBe(45);

      // Verify cash credit
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('credit');
      expect(cashTxn?.amount).toBe(45);

      // Verify balances
      const subscriptionBalance = await getBalance('5100');
      expect(subscriptionBalance.balance).toBe(-45); // Expense: debit of 45 shows as -45

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(45); // Asset: credit of 45 shows as 45
    });

    it('should support multiple subscription payments', async () => {
      // Figma
      await recordSubscriptionPayment({
        date: new Date('2025-01-15'),
        description: 'Figma subscription',
        amount: 45,
        cashAccountCode: '1003',
      });

      // Canva
      await recordSubscriptionPayment({
        date: new Date('2025-01-16'),
        description: 'Canva subscription',
        amount: 30,
        cashAccountCode: '1003',
      });

      // Verify total subscription expenses
      const subscriptionBalance = await getBalance('5100');
      expect(subscriptionBalance.balance).toBe(-75); // Expense: total debits of 75 show as -75
    });
  });

  describe('Rule 8: Expense Paid by Founder (as Loan)', () => {
    it('should record founder loan expense correctly', async () => {
      const result = await recordFounderLoanExpense({
        date: new Date('2025-01-15'),
        description: 'Freelancer payment covered by Ahmed',
        amount: 500,
        founderAccountCode: '5601', // Ahmed's Loan Account
        expenseAccountCode: '5001', // Freelancer Expense
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify expense debit
      const expenseTxn = result.transactions.find(
        (t) => t.accountCode === '5001'
      );
      expect(expenseTxn?.type).toBe('debit');
      expect(expenseTxn?.amount).toBe(500);

      // Verify founder loan credit (liability increases)
      const founderTxn = result.transactions.find(
        (t) => t.accountCode === '5601'
      );
      expect(founderTxn?.type).toBe('credit');
      expect(founderTxn?.amount).toBe(500);

      // Verify balances
      const expenseBalance = await getBalance('5001');
      expect(expenseBalance.balance).toBe(-500); // Expense: debit of 500 shows as -500

      const founderLoanBalance = await getBalance('5601');
      expect(founderLoanBalance.balance).toBe(500); // Liability: credit of 500 shows as 500
    });

    it('should support multiple founder loan expenses', async () => {
      // Ahmed covers freelancer expense
      await recordFounderLoanExpense({
        date: new Date('2025-01-15'),
        description: 'Freelancer payment covered by Ahmed',
        amount: 300,
        founderAccountCode: '5601',
        expenseAccountCode: '5001',
      });

      // Ahmed covers subscription
      await recordFounderLoanExpense({
        date: new Date('2025-01-20'),
        description: 'Subscription covered by Ahmed',
        amount: 45,
        founderAccountCode: '5601',
        expenseAccountCode: '5100',
      });

      // Verify Ahmed's total loan balance
      const ahmedLoanBalance = await getBalance('5601');
      expect(ahmedLoanBalance.balance).toBe(345); // Liability: total credits of 345 show as 345
    });

    it('should track separate balances for different founders', async () => {
      // Ahmed covers expense
      await recordFounderLoanExpense({
        date: new Date('2025-01-15'),
        description: 'Expense covered by Ahmed',
        amount: 500,
        founderAccountCode: '5601',
        expenseAccountCode: '5001',
      });

      // Yasser covers expense
      await recordFounderLoanExpense({
        date: new Date('2025-01-16'),
        description: 'Expense covered by Yasser',
        amount: 300,
        founderAccountCode: '5602',
        expenseAccountCode: '5001',
      });

      // Verify separate balances
      const ahmedBalance = await getBalance('5601');
      expect(ahmedBalance.balance).toBe(500); // Liability: Ahmed's loan

      const yasserBalance = await getBalance('5602');
      expect(yasserBalance.balance).toBe(300); // Liability: Yasser's loan
    });
  });

  describe('Rule 9: Founder Loan Repayment', () => {
    it('should record founder loan repayment correctly', async () => {
      // First, create a founder loan
      await recordFounderLoanExpense({
        date: new Date('2025-01-10'),
        description: 'Expense covered by Ahmed',
        amount: 500,
        founderAccountCode: '5601',
        expenseAccountCode: '5001',
      });

      // Now repay the loan
      const result = await recordFounderLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Repayment to Ahmed',
        amount: 300,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify founder loan debit (liability decreases)
      const founderTxn = result.transactions.find(
        (t) => t.accountCode === '5601'
      );
      expect(founderTxn?.type).toBe('debit');
      expect(founderTxn?.amount).toBe(300);

      // Verify cash credit
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('credit');
      expect(cashTxn?.amount).toBe(300);

      // Verify balances
      const founderLoanBalance = await getBalance('5601');
      expect(founderLoanBalance.balance).toBe(200); // Liability: 500 - 300 = 200 remaining

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(300); // Asset: credit of 300 shows as 300
    });

    it('should support multiple repayments', async () => {
      // Create founder loan
      await recordFounderLoanExpense({
        date: new Date('2025-01-10'),
        description: 'Expense covered by Ahmed',
        amount: 1000,
        founderAccountCode: '5601',
        expenseAccountCode: '5001',
      });

      // First repayment
      await recordFounderLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Partial repayment 1',
        amount: 300,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Second repayment
      await recordFounderLoanRepayment({
        date: new Date('2025-01-20'),
        description: 'Partial repayment 2',
        amount: 400,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Verify remaining loan balance
      const founderLoanBalance = await getBalance('5601');
      expect(founderLoanBalance.balance).toBe(300); // Liability: 1000 - 300 - 400 = 300 remaining
    });

    it('should allow complete loan repayment', async () => {
      // Create founder loan
      await recordFounderLoanExpense({
        date: new Date('2025-01-10'),
        description: 'Expense covered by Ahmed',
        amount: 500,
        founderAccountCode: '5601',
        expenseAccountCode: '5001',
      });

      // Full repayment
      await recordFounderLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Full repayment to Ahmed',
        amount: 500,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Verify loan is fully repaid
      const founderLoanBalance = await getBalance('5601');
      expect(founderLoanBalance.balance).toBe(0); // Liability: fully repaid
    });
  });

  describe('Double-Entry Validation', () => {
    it('should maintain balanced debits and credits for all expense rules', async () => {
      // Rule 6
      const result6 = await recordVendorPayment({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 500,
        cashAccountCode: '1003',
        expenseAccountCode: '5001',
      });
      const debits6 = result6.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits6 = result6.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits6).toBe(credits6);

      // Rule 7
      const result7 = await recordSubscriptionPayment({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 45,
        cashAccountCode: '1003',
      });
      const debits7 = result7.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits7 = result7.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits7).toBe(credits7);

      // Rule 8
      const result8 = await recordFounderLoanExpense({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 300,
        founderAccountCode: '5601',
        expenseAccountCode: '5001',
      });
      const debits8 = result8.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits8 = result8.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits8).toBe(credits8);

      // Rule 9
      const result9 = await recordFounderLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 200,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });
      const debits9 = result9.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits9 = result9.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits9).toBe(credits9);
    });
  });
});
