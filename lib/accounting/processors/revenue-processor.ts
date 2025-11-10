/**
 * Revenue Transaction Processor
 *
 * Processes revenue transactions and generates journal entries
 * using the accounting rules.
 */

import { prisma } from '@/lib/db';
import {
  recordClientPayment,
  recordClientPaymentWithFees,
} from '../rules/income-rules';
import type { Revenue } from '@prisma/client';

export interface ProcessRevenueResult {
  success: boolean;
  mediciJournalId?: string;
  error?: string;
}

/**
 * Process a revenue transaction when it becomes PAID
 *
 * This follows cash basis accounting - journal entries are only
 * created when cash is received (status = PAID)
 */
export async function processRevenuePaid(
  revenue: Revenue
): Promise<ProcessRevenueResult> {
  try {
    // Verify revenue is actually PAID
    if (revenue.paymentStatus !== 'PAID') {
      return {
        success: false,
        error: 'Revenue must have status PAID to generate journal entry',
      };
    }

    // Verify payment date exists
    if (!revenue.paymentDate) {
      return {
        success: false,
        error: 'Payment date is required for PAID revenue',
      };
    }

    // Verify bank account is specified
    if (!revenue.bankAccount) {
      return {
        success: false,
        error: 'Bank account is required for PAID revenue',
      };
    }

    // Determine which rule to use based on whether there are transaction fees
    const hasFees = revenue.taxAmount && revenue.taxAmount > 0;

    let result;

    if (hasFees) {
      // Rule 2: Client Payment with Fees
      result = await recordClientPaymentWithFees({
        date: revenue.paymentDate,
        description: `${revenue.description} (Revenue Payment)`,
        amount: revenue.convertedAmount,
        feeAmount: revenue.taxAmount || 0,
        cashAccountCode: revenue.bankAccount, // e.g., '1001' (PayPal), '1003' (Bank)
        revenueAccountCode: '4000', // Project Revenue account
        feeAccountCode: '5400', // Transaction Fee Expense
      });
    } else {
      // Rule 1: Client Payment Received (no fees)
      result = await recordClientPayment({
        date: revenue.paymentDate,
        description: `${revenue.description} (Revenue Payment)`,
        amount: revenue.convertedAmount,
        cashAccountCode: revenue.bankAccount,
        revenueAccountCode: '4000', // Project Revenue account
      });
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

    // Update revenue record with journal entry ID
    await prisma.revenue.update({
      where: { id: revenue.id },
      data: {
        // Note: We don't have journalEntryId in the schema yet, only mediciJournalId reference
        // For now, we'll just return the mediciJournalId
        // TODO: Add mediciJournalId field to Revenue model
      },
    });

    return {
      success: true,
      mediciJournalId: result.mediciJournalId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if revenue can be processed (all required fields present)
 */
export function canProcessRevenue(revenue: Revenue): {
  canProcess: boolean;
  reason?: string;
} {
  if (revenue.paymentStatus !== 'PAID') {
    return {
      canProcess: false,
      reason: 'Revenue status must be PAID',
    };
  }

  if (!revenue.paymentDate) {
    return {
      canProcess: false,
      reason: 'Payment date is required',
    };
  }

  if (!revenue.bankAccount) {
    return {
      canProcess: false,
      reason: 'Bank account is required',
    };
  }

  return { canProcess: true };
}
