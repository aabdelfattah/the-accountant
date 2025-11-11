/**
 * Medici Journal Book
 *
 * Medici uses "books" to separate different accounting ledgers.
 * For our app, we'll use a single book called "Main" for all journal entries.
 *
 * Learn more: https://github.com/flash-oss/medici
 */

import { connectDb } from '../db';
import type { Book as BookType } from 'medici';

// Default book name for all journal entries
export const DEFAULT_BOOK = 'Main';

// Cache the Book class after first dynamic import
let BookClass: typeof BookType | null = null;

/**
 * Get a Medici book instance
 *
 * CRITICAL FIX: Uses dynamic import() instead of static import
 * - Static import: `import { Book } from 'medici'` runs BEFORE mongoose connects
 * - Dynamic import: `await import('medici')` runs AFTER mongoose connects
 *
 * This ensures Medici's models are created with an active mongoose connection
 */
export async function getBook(
  bookName: string = DEFAULT_BOOK
): Promise<BookType> {
  // Step 1: Ensure Mongoose is connected
  await connectDb();

  // Step 2: Load Medici AFTER connection (only once, then cache)
  if (!BookClass) {
    console.log(
      '[Medici] Dynamically importing Book class after connection...'
    );
    const medici = await import('medici');
    BookClass = medici.Book;
    console.log('[Medici] Book class loaded successfully');
  }

  // Step 3: Create and return new Book instance
  return new BookClass(bookName);
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
 * Get all ledger entries across all accounts
 *
 * @param startDate - Optional start date
 * @param endDate - Optional end date
 * @returns Array of all ledger entries
 */
export async function getAllLedgerEntries(startDate?: Date, endDate?: Date) {
  // Connect to database
  await connectDb();

  // Import mongoose models
  const mongoose = (await import('mongoose')).default;

  // Query the medici_transactions collection directly
  const query: Record<string, unknown> = { book: DEFAULT_BOOK };

  if (startDate || endDate) {
    const dateQuery: Record<string, Date> = {};
    if (startDate) dateQuery.$gte = startDate;
    if (endDate) dateQuery.$lte = endDate;
    query.datetime = dateQuery;
  }

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database connection not established');
  }

  const transactions = await db
    .collection('medici_transactions')
    .find(query)
    .sort({ datetime: -1 })
    .toArray();

  return transactions;
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
