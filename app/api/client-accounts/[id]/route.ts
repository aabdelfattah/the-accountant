import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for updating projects
const updateProjectSchema = z.object({
  name: z.string().min(1, 'Project name is required').optional(),
  clientName: z.string().min(1, 'Client name is required').optional(),
  clientId: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  status: z.enum(['ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
});

// GET /api/client-accounts/[id] - Get a specific project
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
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
            receivableAccountId: true,
          },
        },
        revenues: {
          orderBy: {
            revenueDate: 'desc',
          },
        },
        expenses: {
          orderBy: {
            expenseDate: 'desc',
          },
        },
        projectFreelancers: {
          include: {
            freelancer: {
              select: {
                id: true,
                name: true,
                email: true,
                specialization: true,
              },
            },
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve project' },
      { status: 500 }
    );
  }
}

// PATCH /api/client-accounts/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateProjectSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const data = validation.data;

    // Prepare update data
    const updateData: {
      name?: string;
      clientName?: string;
      clientId?: string | null;
      description?: string | null;
      status?: string;
      startDate?: Date | null;
      endDate?: Date | null;
    } = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.clientName !== undefined) updateData.clientName = data.clientName;
    if (data.clientId !== undefined) updateData.clientId = data.clientId;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.startDate !== undefined) {
      updateData.startDate = data.startDate ? new Date(data.startDate) : null;
    }
    if (data.endDate !== undefined) {
      updateData.endDate = data.endDate ? new Date(data.endDate) : null;
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
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

    return NextResponse.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/client-accounts/[id] - Delete a project
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only ADMIN can delete projects
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        revenues: true,
        expenses: true,
        journalEntries: true,
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Prevent deletion if project has revenues
    if (project.revenues.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete project with ${project.revenues.length} revenue records`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion if project has expenses
    if (project.expenses.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete project with ${project.expenses.length} expense records`,
        },
        { status: 400 }
      );
    }

    // Prevent deletion if project has journal entries
    if (project.journalEntries.length > 0) {
      return NextResponse.json(
        {
          error: `Cannot delete project with ${project.journalEntries.length} journal entries`,
        },
        { status: 400 }
      );
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
