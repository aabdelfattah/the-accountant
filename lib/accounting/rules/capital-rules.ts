/**
 * Capital & Tax Accounting Rules (Cash Basis)
 *
 * Implements Rules 10, 11, and 12 from the accounting rules document
 * Uses Medici for all journal entries
 */

import { prisma } from '../../db';
import { createEntry } from '../../medici';
import {
  AccountingRuleResult,
  TaxPaymentParams,
  CapitalInjectionParams,
  LoanRepaymentParams,
} from './types';

/**
 * Rule 10: Tax or Compliance Payment
 *
 * Two scenarios:
 * 1. Direct tax payment (not previously recorded): Debit Tax Expense, Credit Cash
 * 2. Paying down tax liability (previously recorded): Debit Taxes Payable, Credit Cash
 *
 * Journal Entry (Direct Payment):
 * - Debit: Legal & Compliance Expense (5500)
 * - Credit: Cash/Bank (asset decreases)
 *
 * Journal Entry (Liability Payment):
 * - Debit: Taxes Payable (2200)
 * - Credit: Cash/Bank (asset decreases)
 *
 * @example
 * ```ts
 * // Direct tax payment
 * await recordTaxPayment({
 *   date: new Date(),
 *   description: 'VAT payment for Q1',
 *   amount: 200,
 *   cashAccountCode: '1003',
 *   previouslyRecorded: false,
 * });
 *
 * // Paying down previously recorded liability
 * await recordTaxPayment({
 *   date: new Date(),
 *   description: 'VAT payment for Q1',
 *   amount: 200,
 *   cashAccountCode: '1003',
 *   previouslyRecorded: true,
 * });
 * ```
 */
export async function recordTaxPayment(
  params: TaxPaymentParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, cashAccountCode, previouslyRecorded } =
    params;

  try {
    // Validate cash account exists
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }

    let debitAccountCode: string;
    let debitAccount;

    if (previouslyRecorded) {
      // Pay down liability
      debitAccountCode = '2200'; // Taxes Payable
      debitAccount = await prisma.chartOfAccount.findUnique({
        where: { code: debitAccountCode },
      });
    } else {
      // Direct expense
      debitAccountCode = '5500'; // Legal & Compliance
      debitAccount = await prisma.chartOfAccount.findUnique({
        where: { code: debitAccountCode },
      });
    }

    if (!debitAccount) {
      throw new Error(`Account ${debitAccountCode} not found`);
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: debitAccountCode, amount }, // Decrease liability or increase expense
        { type: 'credit', accountCode: cashAccountCode, amount }, // Decrease cash
      ],
    });

    return {
      success: true,
      mediciJournalId: mediciJournal._id.toString(),
      transactions: [
        {
          accountCode: debitAccountCode,
          accountName: debitAccount.name,
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
 * Rule 11: Loan or Capital Injection
 *
 * Two scenarios:
 * 1. Loan from founder: Creates liability (company must repay)
 * 2. Capital injection: Increases owner's equity (no repayment obligation)
 *
 * Journal Entry (Loan):
 * - Debit: Cash/Bank (asset increases)
 * - Credit: Founder Loan Account (liability increases)
 *
 * Journal Entry (Equity):
 * - Debit: Cash/Bank (asset increases)
 * - Credit: Owner's Equity (equity increases)
 *
 * @example
 * ```ts
 * // Loan from founder
 * await recordCapitalInjection({
 *   date: new Date(),
 *   description: 'Loan from Ahmed for working capital',
 *   amount: 5000,
 *   cashAccountCode: '1003',
 *   isLoan: true,
 *   founderAccountCode: '5601',
 * });
 *
 * // Equity investment
 * await recordCapitalInjection({
 *   date: new Date(),
 *   description: 'Capital injection from Ahmed',
 *   amount: 10000,
 *   cashAccountCode: '1003',
 *   isLoan: false,
 * });
 * ```
 */
export async function recordCapitalInjection(
  params: CapitalInjectionParams
): Promise<AccountingRuleResult> {
  const {
    date,
    description,
    amount,
    cashAccountCode,
    isLoan,
    founderAccountCode,
  } = params;

  try {
    // Validate cash account exists
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }

    let creditAccountCode: string;
    let creditAccount;

    if (isLoan) {
      // Loan - creates liability
      if (!founderAccountCode) {
        throw new Error('Founder account code required for loan');
      }
      creditAccountCode = founderAccountCode;
      creditAccount = await prisma.chartOfAccount.findUnique({
        where: { code: creditAccountCode },
      });
    } else {
      // Equity injection
      creditAccountCode = '3000'; // Owner's Equity
      creditAccount = await prisma.chartOfAccount.findUnique({
        where: { code: creditAccountCode },
      });
    }

    if (!creditAccount) {
      throw new Error(`Account ${creditAccountCode} not found`);
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: cashAccountCode, amount }, // Increase cash
        { type: 'credit', accountCode: creditAccountCode, amount }, // Increase liability or equity
      ],
    });

    return {
      success: true,
      mediciJournalId: mediciJournal._id.toString(),
      transactions: [
        {
          accountCode: cashAccountCode,
          accountName: cashAccount.name,
          type: 'debit',
          amount,
        },
        {
          accountCode: creditAccountCode,
          accountName: creditAccount.name,
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
 * Rule 12: Loan Repayment to Founder/Investor
 *
 * Company repays loan principal (not interest) to founder
 *
 * Journal Entry:
 * - Debit: Founder Loan Account (liability decreases)
 * - Credit: Cash/Bank (asset decreases)
 *
 * Note: This is the same as Rule 9 (Founder Loan Repayment)
 * but included here for completeness as it's listed separately in the rules
 *
 * @example
 * ```ts
 * await recordLoanRepayment({
 *   date: new Date(),
 *   description: 'Loan repayment to Ahmed',
 *   amount: 1000,
 *   cashAccountCode: '1003',
 *   founderAccountCode: '5601',
 * });
 * ```
 */
export async function recordLoanRepayment(
  params: LoanRepaymentParams
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
        { type: 'debit', accountCode: founderAccountCode, amount }, // Decrease liability
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
