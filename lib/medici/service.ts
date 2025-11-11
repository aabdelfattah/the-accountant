/**
 * Medici Accounting Service
 *
 * Simple wrapper around Medici that integrates with our Chart of Accounts.
 * Provides functions for creating journal entries and querying balances.
 */

import { prisma } from '../db';
import {
  createJournalEntry,
  getAccountBalance,
  getAccountLedger,
} from './book';

/**
 * Account path format for Medici: CODE:NAME
 * Example: "1100:Accounts Receivable"
 */
async function getAccountPath(accountCode: string): Promise<string> {
  const account = await prisma.chartOfAccount.findUnique({
    where: { code: accountCode },
  });

  if (!account) {
    throw new Error(`Account with code ${accountCode} not found`);
  }

  return `${account.code}:${account.name}`;
}

/**
 * Create a journal entry
 *
 * @example
 * ```ts
 * // Record revenue
 * await createEntry({
 *   memo: 'Revenue from Project X',
 *   transactions: [
 *     { type: 'debit', accountCode: '1100', amount: 1000 }, // AR
 *     { type: 'credit', accountCode: '4000', amount: 1000 }, // Revenue
 *   ],
 * });
 * ```
 */
export async function createEntry(params: {
  memo: string;
  date?: Date;
  transactions: Array<{
    type: 'debit' | 'credit';
    accountCode: string;
    amount: number;
  }>;
}) {
  const { memo, date, transactions } = params;

  console.log('[Medici Service] Creating journal entry...');

  try {
    const entry = await createJournalEntry(memo, date);
    console.log(
      '[Medici Service] Entry object created, adding transactions...'
    );

    // Add all transactions
    for (const txn of transactions) {
      const accountPath = await getAccountPath(txn.accountCode);

      if (txn.type === 'debit') {
        entry.debit(accountPath, txn.amount);
      } else {
        entry.credit(accountPath, txn.amount);
      }
    }

    console.log('[Medici Service] Committing entry...');
    const result = await entry.commit();
    console.log('[Medici Service] Entry committed successfully');
    return result;
  } catch (error) {
    console.error('[Medici Service] Error details:', error);
    throw error;
  }
}

/**
 * Get account balance
 */
export async function getBalance(
  accountCode: string,
  startDate?: Date,
  endDate?: Date
) {
  const accountPath = await getAccountPath(accountCode);
  return getAccountBalance(accountPath, startDate, endDate);
}

/**
 * Get ledger entries for an account
 */
export async function getLedger(
  accountCode: string,
  startDate?: Date,
  endDate?: Date
) {
  const accountPath = await getAccountPath(accountCode);
  return getAccountLedger(accountPath, startDate, endDate);
}
