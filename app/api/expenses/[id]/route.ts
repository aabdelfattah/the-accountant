import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for expense update
const updateExpenseSchema = z.object({
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'EUR', 'EGP', 'GBP', 'SAR', 'AED']).optional(),
  exchangeRate: z.number().positive().optional(),
  expenseDate: z.string().optional(),
  invoiceDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.string().optional(),
  bankAccount: z.string().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  withholdingAmount: z.number().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringPeriod: z.string().optional().nullable(),
});

// GET /api/expenses/[id] - Get single expense
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        project: true,
        freelancer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        journalEntry: {
          include: {
            lines: {
              include: {
                account: true,
              },
            },
          },
        },
      },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Non-admin users can only view their own expenses
    if (session.user.role !== 'ADMIN' && expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching expense:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expense' },
      { status: 500 }
    );
  }
}

// PATCH /api/expenses/[id] - Update expense
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = updateExpenseSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validationResult.error.format(),
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // Check if expense exists
    const existingExpense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { project: true, freelancer: true },
    });

    if (!existingExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Non-admin users can only update their own expenses
    if (
      session.user.role !== 'ADMIN' &&
      existingExpense.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate;
    if (data.expenseDate !== undefined)
      updateData.expenseDate = new Date(data.expenseDate);
    if (data.invoiceDate !== undefined)
      updateData.invoiceDate = data.invoiceDate
        ? new Date(data.invoiceDate)
        : null;
    if (data.paymentDate !== undefined)
      updateData.paymentDate = data.paymentDate
        ? new Date(data.paymentDate)
        : null;
    if (data.dueDate !== undefined)
      updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (data.paymentStatus !== undefined)
      updateData.paymentStatus = data.paymentStatus;
    if (data.bankAccount !== undefined)
      updateData.bankAccount = data.bankAccount;
    if (data.taxAmount !== undefined) updateData.taxAmount = data.taxAmount;
    if (data.withholdingAmount !== undefined)
      updateData.withholdingAmount = data.withholdingAmount;
    if (data.isRecurring !== undefined)
      updateData.isRecurring = data.isRecurring;
    if (data.recurringPeriod !== undefined)
      updateData.recurringPeriod = data.recurringPeriod;

    // Recalculate converted amount if amount or exchange rate changed
    if (data.amount !== undefined || data.exchangeRate !== undefined) {
      const amount = data.amount ?? existingExpense.amount;
      const exchangeRate = data.exchangeRate ?? existingExpense.exchangeRate;
      updateData.convertedAmount = amount * exchangeRate;
    }

    // Update expense
    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: updateData,
      include: {
        project: true,
        freelancer: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: In Phase 11, update journal entries if payment status changed

    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating expense:', error);
    return NextResponse.json(
      { error: 'Failed to update expense' },
      { status: 500 }
    );
  }
}

// DELETE /api/expenses/[id] - Delete expense
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if expense exists
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { journalEntry: true },
    });

    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }

    // Non-admin users can only delete their own expenses
    if (session.user.role !== 'ADMIN' && expense.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If expense has journal entry, we should create a reversal instead of deleting
    // For now, we'll prevent deletion if journal entry exists
    if (expense.journalEntryId) {
      return NextResponse.json(
        {
          error:
            'Cannot delete expense with journal entry. Use reversal instead.',
        },
        { status: 400 }
      );
    }

    // Delete expense
    await prisma.expense.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    return NextResponse.json(
      { error: 'Failed to delete expense' },
      { status: 500 }
    );
  }
}
