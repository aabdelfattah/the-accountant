import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating accounts
const updateAccountSchema = z.object({
  name: z.string().min(1, 'Account name is required').optional(),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
});

// GET /api/accounts/[id] - Get a specific account
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const account = await prisma.chartOfAccount.findUnique({
      where: { id: params.id },
      include: {
        parent: true,
        children: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve account' },
      { status: 500 }
    );
  }
}

// PATCH /api/accounts/[id] - Update an account
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and ACCOUNTANT can update accounts
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateAccountSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if account exists
    const existingAccount = await prisma.chartOfAccount.findUnique({
      where: { id: params.id },
    });

    if (!existingAccount) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Prevent modification of certain fields for system accounts
    if (existingAccount.isSystem && validation.data.isSystem === false) {
      return NextResponse.json(
        { error: 'Cannot remove system flag from system accounts' },
        { status: 400 }
      );
    }

    const account = await prisma.chartOfAccount.update({
      where: { id: params.id },
      data: validation.data,
      include: {
        parent: true,
        children: true,
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      { error: 'Failed to update account' },
      { status: 500 }
    );
  }
}

// DELETE /api/accounts/[id] - Delete an account
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete accounts
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if account exists
    const account = await prisma.chartOfAccount.findUnique({
      where: { id: params.id },
      include: {
        children: true,
        journalLines: true,
      },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Prevent deletion of system accounts
    if (account.isSystem) {
      return NextResponse.json(
        { error: 'Cannot delete system accounts' },
        { status: 400 }
      );
    }

    // Prevent deletion if account has children
    if (account.children.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account with ${account.children.length} child accounts`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion if account has journal entries
    if (account.journalLines.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete account with ${account.journalLines.length} journal entries`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion if account is linked to an entity
    if (account.linkedEntityId) {
      return NextResponse.json(
        {
          error: `Cannot delete account linked to ${account.linkedEntityType}`,
        },
        { status: 400 }
      );
    }

    await prisma.chartOfAccount.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}
