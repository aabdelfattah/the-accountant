/**
 * Medici Journal Book
 *
 * Medici uses "books" to separate different accounting ledgers.
 * For our app, we'll use a single book called "Main" for all journal entries.
 *
 * Learn more: https://github.com/flash-oss/medici
 */

import { Book } from 'medici';
import { connectDb } from '../db';

// Default book name for all journal entries
export const DEFAULT_BOOK = 'Main';

/**
 * Get a Medici book instance
 * Ensures database is connected before returning
 */
export async function getBook(bookName: string = DEFAULT_BOOK) {
  // Ensure Mongoose is connected
  await connectDb();

  return new Book(bookName);
}

/**
 * Create a journal entry in the default book
 *
 * @param memo - Description of the transaction
 * @param date - Transaction date (defaults to now)
 * @returns Transaction builder
 *
 * @example
 * ```ts
 * await createJournalEntry('Revenue from Project X')
 *   .debit('1100:AccountsReceivable', 1000)
 *   .credit('4000:ProjectRevenue', 1000)
 *   .commit();
 * ```
 */
export async function createJournalEntry(memo: string, date?: Date) {
  const book = await getBook();
  return book.entry(memo, date);
}

/**
 * Get balance for an account
 *
 * @param accountPath - Account path (e.g., "1100:AccountsReceivable")
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Account balance object
 */
export async function getAccountBalance(
  accountPath: string,
  startDate?: Date,
  endDate?: Date
) {
  const book = await getBook();

  const options: {
    account: string;
    start_date?: Date;
    end_date?: Date;
  } = { account: accountPath };
  if (startDate) options.start_date = startDate;
  if (endDate) options.end_date = endDate;

  return book.balance(options);
}

/**
 * Get ledger entries for an account
 *
 * @param accountPath - Account path (e.g., "1100:AccountsReceivable")
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of ledger entries
 */
export async function getAccountLedger(
  accountPath: string,
  startDate?: Date,
  endDate?: Date
) {
  const book = await getBook();

  const options: {
    account: string;
    start_date?: Date;
    end_date?: Date;
  } = { account: accountPath };
  if (startDate) options.start_date = startDate;
  if (endDate) options.end_date = endDate;

  return book.ledger(options);
}

/**
 * Void a journal entry (creates reversal entry)
 *
 * @param journalId - Medici journal _id
 * @param memo - Reason for voiding
 */
export async function voidJournalEntry(journalId: string, memo: string) {
  const book = await getBook();
  return book.void(journalId, memo);
}
