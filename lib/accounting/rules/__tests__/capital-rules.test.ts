/**
 * Tests for Capital & Tax Accounting Rules (Cash Basis)
 *
 * Tests Rules 10, 11, and 12
 */

import {
  setupTestDatabase,
  teardownTestDatabase,
  clearDatabase,
  seedTestAccounts,
} from '../../../test-utils/db-setup';
import {
  recordTaxPayment,
  recordCapitalInjection,
  recordLoanRepayment,
} from '../capital-rules';
import { getBalance } from '../../../medici';

describe('Capital & Tax Accounting Rules', () => {
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

  describe('Rule 10: Tax or Compliance Payment', () => {
    it('should record direct tax payment (not previously recorded)', async () => {
      const result = await recordTaxPayment({
        date: new Date('2025-01-15'),
        description: 'VAT payment for Q1',
        amount: 200,
        cashAccountCode: '1003', // Bank
        previouslyRecorded: false,
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (expense)
      const expenseTxn = result.transactions.find(
        (t) => t.accountCode === '5500'
      );
      expect(expenseTxn?.type).toBe('debit');
      expect(expenseTxn?.amount).toBe(200);

      // Verify credit transaction (cash)
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('credit');
      expect(cashTxn?.amount).toBe(200);

      // Verify balances
      const expenseBalance = await getBalance('5500');
      expect(expenseBalance.balance).toBe(-200); // Expense: debit of 200 shows as -200

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(200); // Asset: credit of 200 shows as 200
    });

    it('should record tax payment for previously recorded liability', async () => {
      // First, manually create a tax liability by crediting Taxes Payable
      // (In real scenario, this would come from accrual accounting or withholding)
      // For testing, we'll just test the payment side

      const result = await recordTaxPayment({
        date: new Date('2025-01-15'),
        description: 'Payment of previously accrued VAT',
        amount: 200,
        cashAccountCode: '1003',
        previouslyRecorded: true, // Paying down liability
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (liability decreases)
      const liabilityTxn = result.transactions.find(
        (t) => t.accountCode === '2200'
      );
      expect(liabilityTxn?.type).toBe('debit');
      expect(liabilityTxn?.amount).toBe(200);

      // Verify credit transaction (cash decreases)
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('credit');
      expect(cashTxn?.amount).toBe(200);

      // Verify balances
      const liabilityBalance = await getBalance('2200');
      expect(liabilityBalance.balance).toBe(-200); // Liability: debit of 200 shows as -200

      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(200); // Asset: credit of 200 shows as 200
    });

    it('should fail if cash account does not exist', async () => {
      const result = await recordTaxPayment({
        date: new Date('2025-01-15'),
        description: 'Test payment',
        amount: 100,
        cashAccountCode: '9999', // Non-existent
        previouslyRecorded: false,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Cash account 9999 not found');
    });
  });

  describe('Rule 11: Loan or Capital Injection', () => {
    it('should record loan from founder', async () => {
      const result = await recordCapitalInjection({
        date: new Date('2025-01-15'),
        description: 'Loan from Ahmed for working capital',
        amount: 5000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601', // Ahmed's Loan Account
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (cash increases)
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('debit');
      expect(cashTxn?.amount).toBe(5000);

      // Verify credit transaction (liability increases)
      const loanTxn = result.transactions.find((t) => t.accountCode === '5601');
      expect(loanTxn?.type).toBe('credit');
      expect(loanTxn?.amount).toBe(5000);

      // Verify balances
      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-5000); // Asset: debit of 5000 shows as -5000

      const loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(5000); // Liability: credit of 5000 shows as 5000
    });

    it('should record equity capital injection', async () => {
      const result = await recordCapitalInjection({
        date: new Date('2025-01-15'),
        description: 'Capital injection from Ahmed',
        amount: 10000,
        cashAccountCode: '1003',
        isLoan: false, // Equity investment
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (cash increases)
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('debit');
      expect(cashTxn?.amount).toBe(10000);

      // Verify credit transaction (equity increases)
      const equityTxn = result.transactions.find(
        (t) => t.accountCode === '3000'
      );
      expect(equityTxn?.type).toBe('credit');
      expect(equityTxn?.amount).toBe(10000);

      // Verify balances
      const cashBalance = await getBalance('1003');
      expect(cashBalance.balance).toBe(-10000); // Asset: debit of 10000 shows as -10000

      const equityBalance = await getBalance('3000');
      expect(equityBalance.balance).toBe(10000); // Equity: credit of 10000 shows as 10000
    });

    it('should fail if loan without founder account code', async () => {
      const result = await recordCapitalInjection({
        date: new Date('2025-01-15'),
        description: 'Loan without founder account',
        amount: 5000,
        cashAccountCode: '1003',
        isLoan: true,
        // Missing founderAccountCode
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Founder account code required for loan');
    });

    it('should support multiple capital injections', async () => {
      // First loan
      await recordCapitalInjection({
        date: new Date('2025-01-15'),
        description: 'Loan 1 from Ahmed',
        amount: 3000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      // Second loan
      await recordCapitalInjection({
        date: new Date('2025-01-20'),
        description: 'Loan 2 from Ahmed',
        amount: 2000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      // Verify total loan balance
      const loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(5000); // Liability: total credits of 5000
    });
  });

  describe('Rule 12: Loan Repayment to Founder/Investor', () => {
    it('should record loan repayment correctly', async () => {
      // First, create a founder loan
      await recordCapitalInjection({
        date: new Date('2025-01-10'),
        description: 'Loan from Ahmed',
        amount: 5000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      // Now repay part of the loan
      const result = await recordLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Loan repayment to Ahmed',
        amount: 2000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Verify result
      expect(result.success).toBe(true);
      expect(result.mediciJournalId).toBeDefined();
      expect(result.transactions).toHaveLength(2);

      // Verify debit transaction (liability decreases)
      const loanTxn = result.transactions.find((t) => t.accountCode === '5601');
      expect(loanTxn?.type).toBe('debit');
      expect(loanTxn?.amount).toBe(2000);

      // Verify credit transaction (cash decreases)
      const cashTxn = result.transactions.find((t) => t.accountCode === '1003');
      expect(cashTxn?.type).toBe('credit');
      expect(cashTxn?.amount).toBe(2000);

      // Verify balances
      const loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(3000); // Liability: 5000 - 2000 = 3000 remaining

      const cashBalance = await getBalance('1003');
      // Cash had +5000 from loan (debit), then -2000 from repayment (credit)
      // In Medici terms: -5000 (debit) + 2000 (credit) = -3000
      expect(cashBalance.balance).toBe(-3000);
    });

    it('should support multiple loan repayments', async () => {
      // Create loan
      await recordCapitalInjection({
        date: new Date('2025-01-10'),
        description: 'Loan from Ahmed',
        amount: 10000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      // First repayment
      await recordLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Partial repayment 1',
        amount: 3000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Second repayment
      await recordLoanRepayment({
        date: new Date('2025-01-20'),
        description: 'Partial repayment 2',
        amount: 4000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Verify remaining loan balance
      const loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(3000); // Liability: 10000 - 3000 - 4000 = 3000
    });

    it('should allow complete loan repayment', async () => {
      // Create loan
      await recordCapitalInjection({
        date: new Date('2025-01-10'),
        description: 'Loan from Ahmed',
        amount: 5000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      // Full repayment
      await recordLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Full loan repayment to Ahmed',
        amount: 5000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      // Verify loan is fully repaid
      const loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(0); // Liability: fully repaid
    });

    it('should fail if founder account does not exist', async () => {
      const result = await recordLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Test repayment',
        amount: 1000,
        cashAccountCode: '1003',
        founderAccountCode: '9999', // Non-existent
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Founder account 9999 not found');
    });
  });

  describe('Double-Entry Validation', () => {
    it('should maintain balanced debits and credits for all capital rules', async () => {
      // Rule 10
      const result10 = await recordTaxPayment({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 200,
        cashAccountCode: '1003',
        previouslyRecorded: false,
      });
      const debits10 = result10.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits10 = result10.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits10).toBe(credits10);

      // Rule 11 (Loan)
      const result11a = await recordCapitalInjection({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 5000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });
      const debits11a = result11a.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits11a = result11a.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits11a).toBe(credits11a);

      // Rule 11 (Equity)
      const result11b = await recordCapitalInjection({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 10000,
        cashAccountCode: '1003',
        isLoan: false,
      });
      const debits11b = result11b.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits11b = result11b.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits11b).toBe(credits11b);

      // Rule 12
      const result12 = await recordLoanRepayment({
        date: new Date('2025-01-15'),
        description: 'Test',
        amount: 2000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });
      const debits12 = result12.transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0);
      const credits12 = result12.transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0);
      expect(debits12).toBe(credits12);
    });
  });

  describe('Integration: Complete Capital Lifecycle', () => {
    it('should handle complete lifecycle of founder loan and repayment', async () => {
      // Step 1: Founder provides loan
      await recordCapitalInjection({
        date: new Date('2025-01-10'),
        description: 'Initial loan from Ahmed',
        amount: 10000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      // Verify initial loan balance
      let loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(10000);

      // Step 2: Company makes first repayment
      await recordLoanRepayment({
        date: new Date('2025-02-01'),
        description: 'First repayment',
        amount: 3000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(7000);

      // Step 3: Company makes second repayment
      await recordLoanRepayment({
        date: new Date('2025-03-01'),
        description: 'Second repayment',
        amount: 4000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(3000);

      // Step 4: Founder provides additional loan
      await recordCapitalInjection({
        date: new Date('2025-04-01'),
        description: 'Additional loan from Ahmed',
        amount: 5000,
        cashAccountCode: '1003',
        isLoan: true,
        founderAccountCode: '5601',
      });

      loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(8000); // 3000 + 5000

      // Step 5: Final repayment of all remaining balance
      await recordLoanRepayment({
        date: new Date('2025-05-01'),
        description: 'Final repayment',
        amount: 8000,
        cashAccountCode: '1003',
        founderAccountCode: '5601',
      });

      loanBalance = await getBalance('5601');
      expect(loanBalance.balance).toBe(0); // Fully repaid
    });
  });
});
