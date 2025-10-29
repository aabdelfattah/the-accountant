import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating clients
const updateClientSchema = z.object({
  name: z.string().min(1, 'Client name is required').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  billingAddress: z.string().optional(),
  paymentTerms: z.string().optional(),
  active: z.boolean().optional(),
});

// GET /api/clients/[id] - Get a specific client
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Get the receivable account if it exists
    let receivableAccount = null;
    if (client.receivableAccountId) {
      receivableAccount = await prisma.chartOfAccount.findUnique({
        where: { id: client.receivableAccountId },
      });
    }

    return NextResponse.json({
      ...client,
      receivableAccount,
    });
  } catch (error) {
    console.error('Get client error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve client' },
      { status: 500 }
    );
  }
}

// PATCH /api/clients/[id] - Update a client
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN and ACCOUNTANT can update clients
    if (session.user.role !== 'ADMIN' && session.user.role !== 'ACCOUNTANT') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validation = updateClientSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if client exists
    const existingClient = await prisma.client.findUnique({
      where: { id: params.id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // If name is being updated, check for duplicates
    if (validation.data.name && validation.data.name !== existingClient.name) {
      const duplicateClient = await prisma.client.findFirst({
        where: { name: validation.data.name },
      });

      if (duplicateClient) {
        return NextResponse.json(
          { error: `Client "${validation.data.name}" already exists` },
          { status: 409 }
        );
      }

      // Update the linked A/R account name if it exists
      if (existingClient.receivableAccountId) {
        await prisma.chartOfAccount.update({
          where: { id: existingClient.receivableAccountId },
          data: {
            name: `AR - ${validation.data.name}`,
            description: `Accounts Receivable for ${validation.data.name}`,
          },
        });
      }
    }

    const client = await prisma.client.update({
      where: { id: params.id },
      data: {
        ...validation.data,
        email: validation.data.email || null,
      },
      include: {
        projects: true,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error('Update client error:', error);
    return NextResponse.json(
      { error: 'Failed to update client' },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Delete a client
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete clients
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if client exists
    const client = await prisma.client.findUnique({
      where: { id: params.id },
      include: {
        projects: true,
      },
    });

    if (!client) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    // Prevent deletion if client has projects
    if (client.projects.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete client with ${client.projects.length} associated projects`,
        },
        { status: 400 }
      );
    }

    // Check if the linked A/R account has any journal entries
    if (client.receivableAccountId) {
      const account = await prisma.chartOfAccount.findUnique({
        where: { id: client.receivableAccountId },
        include: {
          journalLines: true,
        },
      });

      if (account && account.journalLines.length > 0) {
        return NextResponse.json(
          {
            error:
              'Cannot delete client with journal entries. Consider marking as inactive instead.',
          },
          { status: 400 }
        );
      }

      // Delete the A/R account if it has no journal entries
      if (account) {
        await prisma.chartOfAccount.delete({
          where: { id: client.receivableAccountId },
        });
      }
    }

    // Delete the client
    await prisma.client.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    return NextResponse.json(
      { error: 'Failed to delete client' },
      { status: 500 }
    );
  }
}
