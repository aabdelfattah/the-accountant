import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for revenue creation
const createRevenueSchema = z.object({
  projectId: z.string().min(1, 'Project is required'),
  description: z.string().min(1, 'Description is required'),
  amount: z.number().positive('Amount must be positive'),
  currency: z.enum(['USD', 'EUR', 'EGP', 'GBP', 'SAR', 'AED']).default('USD'),
  exchangeRate: z.number().positive().default(1),
  revenueDate: z.string().min(1, 'Revenue date is required'),
  invoiceDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.enum(['DELIVERED', 'INVOICED', 'PAID']).default('DELIVERED'),
  bankAccount: z.string().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  withholdingAmount: z.number().optional().nullable(),
});

// GET /api/revenues - List all revenues
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');

    const where: {
      projectId?: string;
      paymentStatus?: string;
      userId?: string;
    } = {};

    // Filter by project if provided
    if (projectId) {
      where.projectId = projectId;
    }

    // Filter by status if provided
    if (status) {
      where.paymentStatus = status;
    }

    // Non-admin users can only see their own revenues
    if (session.user.role !== 'ADMIN') {
      where.userId = session.user.id;
    }

    const revenues = await prisma.revenue.findMany({
      where,
      include: {
        project: true,
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
        revenueDate: 'desc',
      },
    });

    return NextResponse.json({ revenues });
  } catch (error) {
    console.error('Error fetching revenues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenues' },
      { status: 500 }
    );
  }
}

// POST /api/revenues - Create new revenue
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Validate input
    const validationResult = createRevenueSchema.safeParse(body);

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

    // Verify project exists and user has access
    const project = await prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Non-admin users can only create revenues for their own projects
    if (session.user.role !== 'ADMIN' && project.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'You can only create revenues for your own projects' },
        { status: 403 }
      );
    }

    // Calculate converted amount
    const convertedAmount = data.amount * data.exchangeRate;

    // Create revenue
    const revenue = await prisma.revenue.create({
      data: {
        projectId: data.projectId,
        description: data.description,
        amount: data.amount,
        currency: data.currency,
        exchangeRate: data.exchangeRate,
        convertedAmount,
        revenueDate: new Date(data.revenueDate),
        invoiceDate: data.invoiceDate ? new Date(data.invoiceDate) : null,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paymentStatus: data.paymentStatus,
        bankAccount: data.bankAccount || null,
        taxAmount: data.taxAmount || null,
        withholdingAmount: data.withholdingAmount || null,
        userId: session.user.id,
      },
      include: {
        project: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // TODO: In Phase 11, we'll auto-generate journal entries here

    return NextResponse.json(revenue, { status: 201 });
  } catch (error) {
    console.error('Error creating revenue:', error);
    return NextResponse.json(
      { error: 'Failed to create revenue' },
      { status: 500 }
    );
  }
}
