/**
 * Expense Transaction Processor
 *
 * Processes expense transactions and generates journal entries
 * using the accounting rules.
 */

import {
  recordVendorPayment,
  recordSubscriptionPayment,
} from '../rules/expense-rules';
import type { Expense } from '@prisma/client';

export interface ProcessExpenseResult {
  success: boolean;
  mediciJournalId?: string;
  error?: string;
}

/**
 * Process an expense transaction when it becomes PAID
 *
 * This follows cash basis accounting - journal entries are only
 * created when cash is paid out (status = PAID)
 *
 * NOTE: For founder-paid expenses, use the capital management API instead
 * This processor only handles expenses paid from company bank accounts
 */
export async function processExpensePaid(
  expense: Expense
): Promise<ProcessExpenseResult> {
  try {
    // Verify expense is actually PAID
    if (expense.paymentStatus !== 'PAID') {
      return {
        success: false,
        error: 'Expense must have status PAID to generate journal entry',
      };
    }

    // Verify payment date exists
    if (!expense.paymentDate) {
      return {
        success: false,
        error: 'Payment date is required for PAID expense',
      };
    }

    // Verify bank account exists (founder-paid expenses should be handled separately)
    if (!expense.bankAccount || expense.bankAccount === '') {
      return {
        success: false,
        error:
          'Bank account is required. For founder-paid expenses, use Capital Management instead.',
      };
    }

    // Determine which accounting rule to use based on category
    let result;

    if (expense.category === 'SUBSCRIPTION' || expense.isRecurring) {
      // Rule 7: Software Subscription Payment
      result = await recordSubscriptionPayment({
        date: expense.paymentDate,
        description: expense.description,
        amount: expense.convertedAmount,
        cashAccountCode: expense.bankAccount,
      });
    } else {
      // Rule 6: Vendor Payment (Freelancer, Legal, Tax Advisor, etc.)
      result = await recordVendorPayment({
        date: expense.paymentDate,
        description: expense.description,
        amount: expense.convertedAmount,
        cashAccountCode: expense.bankAccount,
        expenseAccountCode: determineExpenseAccount(expense.category),
      });
    }

    if (!result.success) {
      return {
        success: false,
        error: result.error,
      };
    }

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
 * Determine the expense account code based on category
 */
function determineExpenseAccount(category: string): string {
  switch (category.toUpperCase()) {
    case 'FREELANCER':
    case 'COGS':
      return '5001'; // Freelancer Expense
    case 'SUBSCRIPTION':
    case 'SOFTWARE':
      return '5100'; // Subscription Expense
    case 'LEGAL':
    case 'COMPLIANCE':
      return '5500'; // Legal & Compliance
    default:
      return '5001'; // Default to Freelancer/Vendor expense
  }
}

/**
 * Check if expense can be processed (all required fields present)
 */
export function canProcessExpense(expense: Expense): {
  canProcess: boolean;
  reason?: string;
} {
  if (expense.paymentStatus !== 'PAID') {
    return {
      canProcess: false,
      reason: 'Expense status must be PAID',
    };
  }

  if (!expense.paymentDate) {
    return {
      canProcess: false,
      reason: 'Payment date is required',
    };
  }

  if (!expense.bankAccount || expense.bankAccount === '') {
    return {
      canProcess: false,
      reason:
        'Bank account is required (use Capital Management for founder-paid expenses)',
    };
  }

  return { canProcess: true };
}
