/**
 * Type definitions for accounting rules
 *
 * Based on cash basis accounting principles - Simplified version
 */

/**
 * Result of applying an accounting rule
 */
export interface AccountingRuleResult {
  success: boolean;
  journalEntryId?: string;
  mediciJournalId?: string;
  error?: string;
  transactions: AccountingTransaction[];
}

/**
 * Individual accounting transaction (debit or credit)
 */
export interface AccountingTransaction {
  accountCode: string;
  accountName: string;
  type: 'debit' | 'credit';
  amount: number;
}

/**
 * Common parameters for all accounting rules
 */
export interface BaseRuleParams {
  date: Date;
  description: string;
  amount: number;
}

/**
 * Rule 1: Client Payment Received
 */
export interface ClientPaymentParams extends BaseRuleParams {
  cashAccountCode: string; // e.g., '1001' (PayPal) or '1003' (Bank)
  revenueAccountCode: string; // e.g., '4000' (Project Revenue)
}

/**
 * Rule 2: Client Payment with Fees
 */
export interface ClientPaymentWithFeesParams extends BaseRuleParams {
  cashAccountCode: string;
  feeAmount: number;
  revenueAccountCode: string; // e.g., '4000' (Project Revenue)
  feeAccountCode: string; // e.g., '5400' (Transaction Fee Expense)
}

/**
 * Rule 4: Marketing & Sales Services Revenue
 */
export interface MarketingSalesRevenueParams extends BaseRuleParams {
  cashAccountCode: string;
  revenueAccountCode: string; // e.g., '4010' (Marketing & Sales Revenue)
}

/**
 * Rule 6: Vendor Payment (Freelancer, Legal, Tax Advisor, etc.)
 */
export interface VendorPaymentParams extends BaseRuleParams {
  cashAccountCode: string;
  expenseAccountCode: string; // e.g., '5001' (Freelancer), '5500' (Legal & Compliance)
}

/**
 * Rule 7: Software Subscription Payment
 */
export interface SubscriptionPaymentParams extends BaseRuleParams {
  cashAccountCode: string;
}

/**
 * Rule 8: Expense Paid by Founder (as Loan)
 */
export interface FounderLoanExpenseParams extends BaseRuleParams {
  founderAccountCode: string; // '5601' (Ahmed) or '5602' (Yasser)
  expenseAccountCode: string; // e.g., '5100' (Subscription), '5001' (Freelancer), '5500' (Legal)
}

/**
 * Rule 9: Founder Loan Repaid
 */
export interface FounderLoanRepaymentParams extends BaseRuleParams {
  cashAccountCode: string;
  founderAccountCode: string; // '5601' or '5602'
}

/**
 * Rule 10: Tax or Compliance Payment
 */
export interface TaxPaymentParams extends BaseRuleParams {
  cashAccountCode: string;
  previouslyRecorded: boolean; // true = clear liability, false = direct expense
}

/**
 * Rule 11: Loan or Capital Injection
 */
export interface CapitalInjectionParams extends BaseRuleParams {
  cashAccountCode: string;
  isLoan: boolean; // true = loan, false = equity
  founderAccountCode?: string; // Required if isLoan = true
}

/**
 * Rule 12: Loan Repayment to Founder/Investor
 */
export interface LoanRepaymentParams extends BaseRuleParams {
  cashAccountCode: string;
  founderAccountCode: string;
}
