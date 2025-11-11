import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { processRevenuePaid } from '@/lib/accounting/processors/revenue-processor';

// Validation schema for revenue update
const updateRevenueSchema = z.object({
  description: z.string().min(1).optional(),
  amount: z.number().positive().optional(),
  currency: z.enum(['USD', 'EUR', 'EGP', 'GBP', 'SAR', 'AED']).optional(),
  exchangeRate: z.number().positive().optional(),
  revenueDate: z.string().optional(),
  invoiceDate: z.string().optional().nullable(),
  paymentDate: z.string().optional().nullable(),
  dueDate: z.string().optional().nullable(),
  paymentStatus: z.enum(['DELIVERED', 'INVOICED', 'PAID']).optional(),
  bankAccount: z.string().optional().nullable(),
  taxAmount: z.number().optional().nullable(),
  withholdingAmount: z.number().optional().nullable(),
});

// GET /api/revenues/[id] - Get single revenue
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const revenue = await prisma.revenue.findUnique({
      where: { id: params.id },
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
    });

    if (!revenue) {
      return NextResponse.json({ error: 'Revenue not found' }, { status: 404 });
    }

    // Non-admin users can only view their own revenues
    if (session.user.role !== 'ADMIN' && revenue.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    return NextResponse.json(revenue);
  } catch (error) {
    console.error('Error fetching revenue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch revenue' },
      { status: 500 }
    );
  }
}

// PATCH /api/revenues/[id] - Update revenue
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
    const validationResult = updateRevenueSchema.safeParse(body);

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

    // Check if revenue exists
    const existingRevenue = await prisma.revenue.findUnique({
      where: { id: params.id },
      include: { project: true },
    });

    if (!existingRevenue) {
      return NextResponse.json({ error: 'Revenue not found' }, { status: 404 });
    }

    // Non-admin users can only update their own revenues
    if (
      session.user.role !== 'ADMIN' &&
      existingRevenue.userId !== session.user.id
    ) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {};

    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.currency !== undefined) updateData.currency = data.currency;
    if (data.exchangeRate !== undefined)
      updateData.exchangeRate = data.exchangeRate;
    if (data.revenueDate !== undefined)
      updateData.revenueDate = new Date(data.revenueDate);
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

    // Recalculate converted amount if amount or exchange rate changed
    if (data.amount !== undefined || data.exchangeRate !== undefined) {
      const amount = data.amount ?? existingRevenue.amount;
      const exchangeRate = data.exchangeRate ?? existingRevenue.exchangeRate;
      updateData.convertedAmount = amount * exchangeRate;
    }

    // Detect if payment status is changing to PAID
    const statusChangingToPaid =
      data.paymentStatus === 'PAID' && existingRevenue.paymentStatus !== 'PAID';

    // Update revenue
    const revenue = await prisma.revenue.update({
      where: { id: params.id },
      data: updateData,
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

    // Auto-generate journal entry if status changed to PAID (cash basis accounting)
    if (statusChangingToPaid) {
      const result = await processRevenuePaid(revenue);

      if (!result.success) {
        // Log error but don't fail the update
        console.error('Failed to create journal entry:', result.error);
        // You might want to return this info to the user
        return NextResponse.json({
          ...revenue,
          journalEntryWarning: `Revenue updated but journal entry creation failed: ${result.error}`,
        });
      }

      console.log('Journal entry created:', result.mediciJournalId);

      // Fetch updated revenue with journal entry
      const updatedRevenue = await prisma.revenue.findUnique({
        where: { id: params.id },
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
      });

      return NextResponse.json(updatedRevenue);
    }

    return NextResponse.json(revenue);
  } catch (error) {
    console.error('Error updating revenue:', error);
    return NextResponse.json(
      { error: 'Failed to update revenue' },
      { status: 500 }
    );
  }
}

// DELETE /api/revenues/[id] - Delete revenue
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if revenue exists
    const revenue = await prisma.revenue.findUnique({
      where: { id: params.id },
      include: { journalEntry: true },
    });

    if (!revenue) {
      return NextResponse.json({ error: 'Revenue not found' }, { status: 404 });
    }

    // Non-admin users can only delete their own revenues
    if (session.user.role !== 'ADMIN' && revenue.userId !== session.user.id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If revenue has journal entry, we should create a reversal instead of deleting
    // For now, we'll prevent deletion if journal entry exists
    if (revenue.journalEntryId) {
      return NextResponse.json(
        {
          error:
            'Cannot delete revenue with journal entry. Use reversal instead.',
        },
        { status: 400 }
      );
    }

    // Delete revenue
    await prisma.revenue.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Revenue deleted successfully' });
  } catch (error) {
    console.error('Error deleting revenue:', error);
    return NextResponse.json(
      { error: 'Failed to delete revenue' },
      { status: 500 }
    );
  }
}
