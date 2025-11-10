import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { processExpensePaid } from '@/lib/accounting/processors/expense-processor';

// Validation schema for expense creation
const createExpenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  category: z.string().min(1, 'Category is required'),
  projectId: z.string().optional().nullable(),
  freelancerId: z.string().optional().nullable(),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'EGP', 'GBP', 'SAR', 'AED']).default('USD'),
  exchangeRate: z.number().positive().default(1),
  expenseDate: z.string().min(1, 'Expense date is required'),
  invoiceDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.string().default('PAID'),
  bankAccount: z.string().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  withholdingAmount: z.number().optional().nullable(),
  isRecurring: z.boolean().default(false),
  recurringPeriod: z.string().optional().nullable(),
});

// GET /api/expenses - List all expenses
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const freelancerId = searchParams.get('freelancerId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const where: {
      projectId?: string;
      freelancerId?: string;
      category?: string;
      paymentStatus?: string;
      userId?: string;
    } = {};

    // Filter by project if provided
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by freelancer if provided
    if (freelancerId) {
      where.freelancerId = freelancerId;
    }

    // Filter by category if provided
    if (category) {
      where.category = category;
    }

    // Filter by status if provided
    if (status) {
      where.paymentStatus = status;
    }

    // Non-admin users can only see their own expenses
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    }

    const expenses = await prisma.expense.findMany({
      where,
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
      orderBy: {
        expenseDate: 'desc',
      },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch expenses' },
      { status: 500 }
    );
  }
}

// POST /api/expenses - Create new expense
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = createExpenseSchema.safeParse(body);

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

    // Verify project exists and user has access (if projectId provided)
    if (data.projectId) {
      const project = await prisma.project.findUnique({
        where: { id: data.projectId },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }

      // Non-admin users can only create expenses for their own projects
      if (session.user.role !== 'ADMIN' && project.userId !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only create expenses for your own projects' },
          { status: 403 }
        );
      }
    }

    // Verify freelancer exists (if freelancerId provided)
    if (data.freelancerId) {
      const freelancer = await prisma.freelancer.findUnique({
        where: { id: data.freelancerId },
      });

      if (!freelancer) {
        return NextResponse.json(
          { error: 'Freelancer not found' },
          { status: 404 }
        );
      }
    }

    // Calculate converted amount
    const convertedAmount = data.amount * data.exchangeRate;

    // Create expense
    const expense = await prisma.expense.create({
      data: {
        description: data.description,
        category: data.category,
        projectId: data.projectId || null,
        freelancerId: data.freelancerId || null,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        convertedAmount,
        expenseDate: new Date(data.expenseDate),
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paymentStatus: data.paymentStatus,
        bankAccount: data.bankAccount || null,
        taxAmount: data.taxAmount || null,
        withholdingAmount: data.withholdingAmount || null,
        isRecurring: data.isRecurring,
        recurringPeriod: data.recurringPeriod || null,
        userId: session.user.id,
      },
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

    // Auto-generate journal entry if expense is created as PAID (cash basis accounting)
    if (data.paymentStatus === 'PAID') {
      const result = await processExpensePaid(expense);

      if (!result.success) {
        // Log error but don't fail the creation
        console.error('Failed to create journal entry:', result.error);
        return NextResponse.json(
          {
            ...expense,
            journalEntryWarning: `Expense created but journal entry creation failed: ${result.error}`,
          },
          { status: 201 }
        );
      }

      console.log('Journal entry created:', result.mediciJournalId);

      // Fetch updated expense with journal entry
      const updatedExpense = await prisma.expense.findUnique({
        where: { id: expense.id },
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

      return NextResponse.json(updatedExpense, { status: 201 });
    }

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating expense:', error);
    return NextResponse.json(
      { error: 'Failed to create expense' },
      { status: 500 }
    );
  }
}
