import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for creating/updating projects
const projectSchema = z.object({
  name: z.string().min(1, 'Project name is required'),
  clientName: z.string().min(1, 'Client name is required'),
  clientId: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).default('ACTIVE'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  createRevenueAccount: z.boolean().default(true),
  createCogsAccount: z.boolean().default(true),
});

// Helper function to find next available account code
async function getNextAccountCode(parentCode: string): Promise<string> {
  // Get the base code (e.g., '4000' -> '400', '5000' -> '500')
  const baseCode = parentCode.substring(0, parentCode.length - 1);

  const accounts = await prisma.chartOfAccount.findMany({
    where: {
      AND: [
        {
          code: {
            startsWith: baseCode,
          },
        },
        {
          code: {
            not: parentCode, // Exclude the parent account itself
          },
        },
      ],
    },
    orderBy: {
      code: 'desc',
    },
  });

  // Filter to only get codes of the same length (4 digits)
  const sameLengthAccounts = accounts.filter(
    (acc) => acc.code.length === parentCode.length
  );

  if (sameLengthAccounts.length === 0) {
    // First sub-account: 4000 -> 4001, 5000 -> 5001
    const baseNum = parseInt(parentCode);
    return `${baseNum + 1}`;
  }

  const lastCode = sameLengthAccounts[0].code;
  const nextNum = parseInt(lastCode) + 1;
  return `${nextNum}`;
}

// GET /api/client-accounts - List all projects
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');

    const where: { status?: string; clientId?: string } = {};

    if (status) {
      where.status = status;
    }

    if (clientId) {
      where.clientId = clientId;
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        revenues: {
          select: {
            id: true,
            description: true,
            amount: true,
            revenueDate: true,
            paymentStatus: true,
          },
          take: 5,
          orderBy: {
            revenueDate: 'desc',
          },
        },
        expenses: {
          select: {
            id: true,
            description: true,
            amount: true,
            expenseDate: true,
            paymentStatus: true,
          },
          take: 5,
          orderBy: {
            expenseDate: 'desc',
          },
        },
      },
    });

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve projects' },
      { status: 500 }
    );
  }
}

// POST /api/client-accounts - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = projectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const data = validation.data;

    // Verify user exists (important after database reseeds)
    const userExists = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!userExists) {
      return NextResponse.json(
        {
          error: 'User session is invalid. Please log out and log back in.',
        },
        { status: 401 }
      );
    }

    let revenueAccountId: string | undefined;
    let cogsAccountId: string | undefined;

    // Create Revenue account for the project if requested
    if (data.createRevenueAccount) {
      // Find the parent Revenue account (4000)
      const parentAccount = await prisma.chartOfAccount.findUnique({
        where: { code: '4000' },
      });

      if (!parentAccount) {
        return NextResponse.json(
          { error: 'Project Revenue parent account (4000) not found' },
          { status: 500 }
        );
      }

      // Get next available account code
      const accountCode = await getNextAccountCode('4000');

      // Create the Revenue sub-account
      const revenueAccount = await prisma.chartOfAccount.create({
        data: {
          code: accountCode,
          name: `Revenue - ${data.name}`,
          type: 'INCOME',
          parentId: parentAccount.id,
          linkedEntityType: 'PROJECT',
          autoGenerated: true,
          description: `Revenue account for project ${data.name}`,
        },
      });

      revenueAccountId = revenueAccount.id;
    }

    // Create COGS account for the project if requested
    if (data.createCogsAccount) {
      // Find the parent COGS account (5000)
      const parentAccount = await prisma.chartOfAccount.findUnique({
        where: { code: '5000' },
      });

      if (!parentAccount) {
        return NextResponse.json(
          { error: 'Cost of Sales parent account (5000) not found' },
          { status: 500 }
        );
      }

      // Get next available account code
      const accountCode = await getNextAccountCode('5000');

      // Create the COGS sub-account
      const cogsAccount = await prisma.chartOfAccount.create({
        data: {
          code: accountCode,
          name: `COGS - ${data.name}`,
          type: 'EXPENSE',
          parentId: parentAccount.id,
          linkedEntityType: 'PROJECT',
          autoGenerated: true,
          description: `Cost of Sales for project ${data.name}`,
        },
      });

      cogsAccountId = cogsAccount.id;
    }

    // Create the project
    const project = await prisma.project.create({
      data: {
        name: data.name,
        clientName: data.clientName,
        clientId: data.clientId,
        description: data.description,
        status: data.status,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        userId: session.user.id,
        revenueAccountId,
        cogsAccountId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update the linked accounts with the project ID
    if (revenueAccountId) {
      await prisma.chartOfAccount.update({
        where: { id: revenueAccountId },
        data: { linkedEntityId: project.id },
      });
    }

    if (cogsAccountId) {
      await prisma.chartOfAccount.update({
        where: { id: cogsAccountId },
        data: { linkedEntityId: project.id },
      });
    }

    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Create project error:', error);
    // Log the full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return NextResponse.json(
      {
        error: 'Failed to create project',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
