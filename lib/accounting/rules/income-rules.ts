/**
 * Income Accounting Rules (Cash Basis)
 *
 * Implements Rules 1, 2, and 4 from the accounting rules document
 * Uses Medici for all journal entries
 */

import { prisma } from '../../db';
import { createEntry } from '../../medici';
import {
  AccountingRuleResult,
  ClientPaymentParams,
  ClientPaymentWithFeesParams,
  MarketingSalesRevenueParams,
} from './types';

/**
 * Rule 1: Client Payment Received
 *
 * Revenue is recognized immediately when cash is received (cash basis)
 *
 * Journal Entry:
 * - Debit: Cash/Bank (asset increases)
 * - Credit: Revenue Account (income increases)
 *
 * @example
 * ```ts
 * await recordClientPayment({
 *   date: new Date(),
 *   description: 'Payment from Client X for Project Y',
 *   amount: 1200,
 *   cashAccountCode: '1003', // Bank
 *   revenueAccountCode: '4000', // Project Revenue
 * });
 * ```
 */
export async function recordClientPayment(
  params: ClientPaymentParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, cashAccountCode, revenueAccountCode } =
    params;

  try {
    // Validate accounts exist
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });
    const revenueAccount = await prisma.chartOfAccount.findUnique({
      where: { code: revenueAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }
    if (!revenueAccount) {
      throw new Error(`Revenue account ${revenueAccountCode} not found`);
    }

    // Create journal entry via Medici (only when cash is received)
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: cashAccountCode, amount }, // Increase cash
        { type: 'credit', accountCode: revenueAccountCode, amount }, // Recognize revenue
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
          accountCode: revenueAccountCode,
          accountName: revenueAccount.name,
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
 * Rule 2: Client Payment Received with Fees
 *
 * Client pays via PayPal or payment platform charging a fee
 *
 * Journal Entry:
 * - Debit: Cash/PayPal (net amount received)
 * - Debit: Transaction Fee Expense (fee amount)
 * - Credit: Revenue Account (total amount)
 *
 * @example
 * ```ts
 * await recordClientPaymentWithFees({
 *   date: new Date(),
 *   description: 'Payment from Client X via PayPal',
 *   amount: 1200,
 *   feeAmount: 30,
 *   cashAccountCode: '1001', // PayPal
 *   revenueAccountCode: '4000', // Project Revenue
 *   feeAccountCode: '5400', // Transaction Fee Expense
 * });
 * ```
 */
export async function recordClientPaymentWithFees(
  params: ClientPaymentWithFeesParams
): Promise<AccountingRuleResult> {
  const {
    date,
    description,
    amount,
    feeAmount,
    cashAccountCode,
    revenueAccountCode,
    feeAccountCode,
  } = params;

  try {
    const netAmount = amount - feeAmount;

    // Validate accounts exist
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });
    const revenueAccount = await prisma.chartOfAccount.findUnique({
      where: { code: revenueAccountCode },
    });
    const feeAccount = await prisma.chartOfAccount.findUnique({
      where: { code: feeAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }
    if (!revenueAccount) {
      throw new Error(`Revenue account ${revenueAccountCode} not found`);
    }
    if (!feeAccount) {
      throw new Error(`Fee account ${feeAccountCode} not found`);
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: cashAccountCode, amount: netAmount }, // Net cash received
        { type: 'debit', accountCode: feeAccountCode, amount: feeAmount }, // Fee expense
        { type: 'credit', accountCode: revenueAccountCode, amount }, // Total revenue
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
          amount: netAmount,
        },
        {
          accountCode: feeAccountCode,
          accountName: feeAccount.name,
          type: 'debit',
          amount: feeAmount,
        },
        {
          accountCode: revenueAccountCode,
          accountName: revenueAccount.name,
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
 * Rule 4: Marketing & Sales Services Revenue
 *
 * Marketing, sales, or lead-generation services paid directly
 *
 * Journal Entry:
 * - Debit: Cash/Bank (asset increases)
 * - Credit: Marketing & Sales Revenue (income increases)
 *
 * @example
 * ```ts
 * await recordMarketingSalesRevenue({
 *   date: new Date(),
 *   description: 'Lead generation service payment',
 *   amount: 500,
 *   cashAccountCode: '1003',
 *   revenueAccountCode: '4010', // Marketing & Sales Revenue
 * });
 * ```
 */
export async function recordMarketingSalesRevenue(
  params: MarketingSalesRevenueParams
): Promise<AccountingRuleResult> {
  const { date, description, amount, cashAccountCode, revenueAccountCode } =
    params;

  try {
    // Validate accounts exist
    const cashAccount = await prisma.chartOfAccount.findUnique({
      where: { code: cashAccountCode },
    });
    const revenueAccount = await prisma.chartOfAccount.findUnique({
      where: { code: revenueAccountCode },
    });

    if (!cashAccount) {
      throw new Error(`Cash account ${cashAccountCode} not found`);
    }
    if (!revenueAccount) {
      throw new Error(`Revenue account ${revenueAccountCode} not found`);
    }

    // Create journal entry via Medici
    const mediciJournal = await createEntry({
      memo: description,
      date,
      transactions: [
        { type: 'debit', accountCode: cashAccountCode, amount }, // Increase cash
        { type: 'credit', accountCode: revenueAccountCode, amount }, // Recognize revenue
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
          accountCode: revenueAccountCode,
          accountName: revenueAccount.name,
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
