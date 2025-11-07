/**
 * Expense Accounting Rules (Cash Basis)
 *
 * Implements Rules 6, 7, 8, and 9 from the accounting rules document
 * Uses Medici for all journal entries
 */

import { prisma } from '../../db';
import { createEntry } from '../../medici';
import {
  AccountingRuleResult,
  VendorPaymentParams,
  SubscriptionPaymentParams,
  FounderLoanExpenseParams,
  FounderLoanRepaymentParams,
} from './types';

/**
 * Rule 6: Vendor Payment (Freelancer, Legal, Tax Advisor, etc.)
 *
 * Payment made to vendors/freelancers for services
 *
 * Journal Entry:
 * - Debit: Expense Account (expense increases)
 * - Credit: Cash/Bank (asset decreases)
 *
 * @example
 * ```ts
 * await recordVendorPayment({
 *   date: new Date(),
 *   description: 'Payment to Freelancer X for design work',
 *   amount: 500,
 *   cashAccountCode: '1003', // Bank
 *   expenseAccountCode: '5001', // Freelancer Expense
 * });
 * ```
 */
export async function recordVendorPayment(
  params: VendorPaymentParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, cashAccountCode, expenseAccountCode } =
    params;

  try {
    // Validate accounts exist
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });
    const expenseAccount = await prisma.chartOfAccount.findUnique({
      where: { code: expenseAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }
    if (!expenseAccount) {
      throw new Error(`Expense account ${expenseAccountCode} not found`);
    }

    // Create journal entry via Medici (only when cash is paid)
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: expenseAccountCode, amount }, // Increase expense
        { type: 'credit', accountCode: cashAccountCode, amount }, // Decrease cash
      ],
    });

    return {
      success: true,
      mediciJournalId: mediciJournal._id.toString(),
      transactions: [
        {
          accountCode: expenseAccountCode,
          accountName: expenseAccount.name,
          type: 'debit',
          amount,
        },
        {
          accountCode: cashAccountCode,
          accountName: cashAccount.name,
          type: 'credit',
          amount,
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactions: [],
    };
  }
}

/**
 * Rule 7: Software Subscription Payment
 *
 * Recurring subscription payment for software/services
 *
 * Journal Entry:
 * - Debit: Subscription Expense (expense increases)
 * - Credit: Cash/Bank (asset decreases)
 *
 * @example
 * ```ts
 * await recordSubscriptionPayment({
 *   date: new Date(),
 *   description: 'Monthly Figma subscription',
 *   amount: 45,
 *   cashAccountCode: '1003', // Bank
 * });
 * ```
 */
export async function recordSubscriptionPayment(
  params: SubscriptionPaymentParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, cashAccountCode } = params;

  // Subscriptions always use account 5100
  const subscriptionAccountCode = '5100';

  try {
    // Validate accounts exist
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });
    const subscriptionAccount = await prisma.chartOfAccount.findUnique({
      where: { code: subscriptionAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }
    if (!subscriptionAccount) {
      throw new Error(
        `Subscription account ${subscriptionAccountCode} not found`
      );
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: subscriptionAccountCode, amount }, // Increase expense
        { type: 'credit', accountCode: cashAccountCode, amount }, // Decrease cash
      ],
    });

    return {
      success: true,
      mediciJournalId: mediciJournal._id.toString(),
      transactions: [
        {
          accountCode: subscriptionAccountCode,
          accountName: subscriptionAccount.name,
          type: 'debit',
          amount,
        },
        {
          accountCode: cashAccountCode,
          accountName: cashAccount.name,
          type: 'credit',
          amount,
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactions: [],
    };
  }
}

/**
 * Rule 8: Expense Paid by Founder (as Loan)
 *
 * Founder pays business expense personally, creating a liability
 *
 * Journal Entry:
 * - Debit: Expense Account (expense increases)
 * - Credit: Founder Loan Account (liability increases - company owes founder)
 *
 * @example
 * ```ts
 * await recordFounderLoanExpense({
 *   date: new Date(),
 *   description: 'Freelancer payment covered by Ahmed',
 *   amount: 500,
 *   founderAccountCode: '5601', // Ahmed's Loan Account
 *   expenseAccountCode: '5001', // Freelancer Expense
 * });
 * ```
 */
export async function recordFounderLoanExpense(
  params: FounderLoanExpenseParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, founderAccountCode, expenseAccountCode } =
    params;

  try {
    // Validate accounts exist
    const founderAccount = await prisma.chartOfAccount.findUnique({
      where: { code: founderAccountCode },
    });
    const expenseAccount = await prisma.chartOfAccount.findUnique({
      where: { code: expenseAccountCode },
    });

    if (!founderAccount) {
      throw new Error(`Founder account ${founderAccountCode} not found`);
    }
    if (!expenseAccount) {
      throw new Error(`Expense account ${expenseAccountCode} not found`);
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: expenseAccountCode, amount }, // Increase expense
        { type: 'credit', accountCode: founderAccountCode, amount }, // Increase liability (company owes founder)
      ],
    });

    return {
      success: true,
      mediciJournalId: mediciJournal._id.toString(),
      transactions: [
        {
          accountCode: expenseAccountCode,
          accountName: expenseAccount.name,
          type: 'debit',
          amount,
        },
        {
          accountCode: founderAccountCode,
          accountName: founderAccount.name,
          type: 'credit',
          amount,
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactions: [],
    };
  }
}

/**
 * Rule 9: Founder Loan Repaid
 *
 * Company pays back money owed to founder
 *
 * Journal Entry:
 * - Debit: Founder Loan Account (liability decreases)
 * - Credit: Cash/Bank (asset decreases)
 *
 * @example
 * ```ts
 * await recordFounderLoanRepayment({
 *   date: new Date(),
 *   description: 'Repayment to Ahmed',
 *   amount: 500,
 *   cashAccountCode: '1003', // Bank
 *   founderAccountCode: '5601', // Ahmed's Loan Account
 * });
 * ```
 */
export async function recordFounderLoanRepayment(
  params: FounderLoanRepaymentParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, cashAccountCode, founderAccountCode } =
    params;

  try {
    // Validate accounts exist
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });
    const founderAccount = await prisma.chartOfAccount.findUnique({
      where: { code: founderAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }
    if (!founderAccount) {
      throw new Error(`Founder account ${founderAccountCode} not found`);
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: founderAccountCode, amount }, // Decrease liability (company owes less)
        { type: 'credit', accountCode: cashAccountCode, amount }, // Decrease cash
      ],
    });

    return {
      success: true,
      mediciJournalId: mediciJournal._id.toString(),
      transactions: [
        {
          accountCode: founderAccountCode,
          accountName: founderAccount.name,
          type: 'debit',
          amount,
        },
        {
          accountCode: cashAccountCode,
          accountName: cashAccount.name,
          type: 'credit',
          amount,
        },
      ],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      transactions: [],
    };
  }
}
