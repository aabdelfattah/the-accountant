import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating freelancers
const updateFreelancerSchema = z.object({
  name: z.string().min(1, 'Freelancer name is required').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  paymentTerms: z.string().optional(),
  specialization: z.string().optional(),
  active: z.boolean().optional(),
});

// GET /api/freelancers/[id] - Get a specific freelancer
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const freelancer = await prisma.freelancer.findUnique({
      where: { id: params.id },
      include: {
        expenses: {
          orderBy: {
            expenseDate: 'desc',
          },
        },
        projectFreelancers: {
          include: {
            project: true,
          },
        },
      },
    });

    if (!freelancer) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Get the payable and expense accounts if they exist
    let payableAccount = null;
    let expenseAccount = null;

    if (freelancer.payableAccountId) {
      payableAccount = await prisma.chartOfAccount.findUnique({
        where: { id: freelancer.payableAccountId },
      });
    }

    if (freelancer.expenseAccountId) {
      expenseAccount = await prisma.chartOfAccount.findUnique({
        where: { id: freelancer.expenseAccountId },
      });
    }

    return NextResponse.json({
      ...freelancer,
      payableAccount,
      expenseAccount,
    });
  } catch (error) {
    console.error('Get freelancer error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve freelancer' },
      { status: 500 }
    );
  }
}

// PATCH /api/freelancers/[id] - Update a freelancer
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and ACCOUNTANT can update freelancers
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateFreelancerSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if freelancer exists
    const existingFreelancer = await prisma.freelancer.findUnique({
      where: { id: params.id },
    });

    if (!existingFreelancer) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // If email is being updated, check for duplicates
    if (
      validation.data.email &&
      validation.data.email !== existingFreelancer.email
    ) {
      const duplicateFreelancer = await prisma.freelancer.findUnique({
        where: { email: validation.data.email },
      });

      if (duplicateFreelancer) {
        return NextResponse.json(
          {
            error: `Freelancer with email "${validation.data.email}" already exists`,
          },
          { status: 409 }
        );
      }
    }

    // If name is being updated, update the linked account names
    if (
      validation.data.name &&
      validation.data.name !== existingFreelancer.name
    ) {
      // Update A/P account name
      if (existingFreelancer.payableAccountId) {
        await prisma.chartOfAccount.update({
          where: { id: existingFreelancer.payableAccountId },
          data: {
            name: `AP - ${validation.data.name}`,
            description: `Accounts Payable for ${validation.data.name}`,
          },
        });
      }

      // Update COGS account name
      if (existingFreelancer.expenseAccountId) {
        await prisma.chartOfAccount.update({
          where: { id: existingFreelancer.expenseAccountId },
          data: {
            name: `COGS - ${validation.data.name}`,
            description: `Cost of Sales for ${validation.data.name}`,
          },
        });
      }
    }

    const freelancer = await prisma.freelancer.update({
      where: { id: params.id },
      data: {
        ...validation.data,
        email: validation.data.email || null,
      },
      include: {
        expenses: true,
        projectFreelancers: {
          include: {
            project: true,
          },
        },
      },
    });

    return NextResponse.json(freelancer);
  } catch (error) {
    console.error('Update freelancer error:', error);
    return NextResponse.json(
      { error: 'Failed to update freelancer' },
      { status: 500 }
    );
  }
}

// DELETE /api/freelancers/[id] - Delete a freelancer
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete freelancers
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if freelancer exists
    const freelancer = await prisma.freelancer.findUnique({
      where: { id: params.id },
      include: {
        expenses: true,
        projectFreelancers: true,
      },
    });

    if (!freelancer) {
      return NextResponse.json(
        { error: 'Freelancer not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if freelancer has expenses
    if (freelancer.expenses.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete freelancer with ${freelancer.expenses.length} associated expenses`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion if freelancer is assigned to projects
    if (freelancer.projectFreelancers.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete freelancer assigned to ${freelancer.projectFreelancers.length} projects`,
        },
        { status: 400 }
      );
    }

    // Check if the linked accounts have any journal entries
    const accountsToDelete: string[] = [];

    if (freelancer.payableAccountId) {
      const apAccount = await prisma.chartOfAccount.findUnique({
        where: { id: freelancer.payableAccountId },
        include: {
          journalLines: true,
        },
      });

      if (apAccount && apAccount.journalLines.length > 0) {
        return NextResponse.json(
          {
            error:
              'Cannot delete freelancer with journal entries. Consider marking as inactive instead.',
          },
          { status: 400 }
        );
      }

      if (apAccount) {
        accountsToDelete.push(freelancer.payableAccountId);
      }
    }

    if (freelancer.expenseAccountId) {
      const expenseAccount = await prisma.chartOfAccount.findUnique({
        where: { id: freelancer.expenseAccountId },
        include: {
          journalLines: true,
        },
      });

      if (expenseAccount && expenseAccount.journalLines.length > 0) {
        return NextResponse.json(
          {
            error:
              'Cannot delete freelancer with journal entries. Consider marking as inactive instead.',
          },
          { status: 400 }
        );
      }

      if (expenseAccount) {
        accountsToDelete.push(freelancer.expenseAccountId);
      }
    }

    // Delete the linked accounts
    if (accountsToDelete.length > 0) {
      await prisma.chartOfAccount.deleteMany({
        where: {
          id: {
            in: accountsToDelete,
          },
        },
      });
    }

    // Delete the freelancer
    await prisma.freelancer.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Freelancer deleted successfully' });
  } catch (error) {
    console.error('Delete freelancer error:', error);
    return NextResponse.json(
      { error: 'Failed to delete freelancer' },
      { status: 500 }
    );
  }
}
