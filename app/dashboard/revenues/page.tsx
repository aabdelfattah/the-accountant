import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Plus, Filter } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

type SearchParams = {
  startDate?: string;
  endDate?: string;
  status?: string;
  projectId?: string;
};

export default async function RevenuesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Build where clause based on filters
  const where: any = {
    ...(session.user.role !== 'ADMIN' ? { userId: session.user.id } : {}),
  };

  if (searchParams.status) {
    where.paymentStatus = searchParams.status;
  }

  if (searchParams.projectId) {
    where.projectId = searchParams.projectId;
  }

  if (searchParams.startDate || searchParams.endDate) {
    where.revenueDate = {};
    if (searchParams.startDate) {
      where.revenueDate.gte = new Date(searchParams.startDate);
    }
    if (searchParams.endDate) {
      where.revenueDate.lte = new Date(searchParams.endDate);
    }
  }

  // Fetch revenues with related data
  const revenues = await prisma.revenue.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      revenueDate: 'desc',
    },
  });

  // Calculate totals
  const totalAmount = revenues.reduce(
    (sum, rev) => sum + rev.convertedAmount,
    0
  );
  const paidAmount = revenues
    .filter((rev) => rev.paymentStatus === 'PAID')
    .reduce((sum, rev) => sum + rev.convertedAmount, 0);
  const pendingAmount = revenues
    .filter((rev) => rev.paymentStatus !== 'PAID')
    .reduce((sum, rev) => sum + rev.convertedAmount, 0);

  // Fetch projects for filter dropdown
  const projects = await prisma.project.findMany({
    where: {
      status: { not: 'ARCHIVED' },
      ...(session.user.role !== 'ADMIN' ? { userId: session.user.id } : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenues</h1>
          <p className="text-muted-foreground">
            Track and manage project income ({revenues.length} total)
          </p>
        </div>
        <Link href="/dashboard/revenues/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Revenue
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-2xl">
              ${totalAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Paid</CardDescription>
            <CardTitle className="text-2xl text-green-600">
              ${paidAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Pending</CardDescription>
            <CardTitle className="text-2xl text-orange-600">
              ${pendingAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Filters - Client Component */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                defaultValue={searchParams.startDate}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <input
                type="date"
                name="endDate"
                defaultValue={searchParams.endDate}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                name="status"
                defaultValue={searchParams.status || ''}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="DELIVERED">Delivered</option>
                <option value="INVOICED">Invoiced</option>
                <option value="PAID">Paid</option>
              </select>
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Project</label>
              <select
                name="projectId"
                defaultValue={searchParams.projectId || ''}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Projects</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply Filters</Button>
              <Link href="/dashboard/revenues">
                <Button type="button" variant="outline">
                  Clear
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Revenue List */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Entries</CardTitle>
          <CardDescription>
            All revenue entries sorted by date (newest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenues.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No revenues found. Create your first revenue entry to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {revenues.map((revenue) => (
                  <TableRow key={revenue.id}>
                    <TableCell className="font-medium">
                      {new Date(revenue.revenueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/dashboard/projects/${revenue.project.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {revenue.project.name}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {revenue.description}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          revenue.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : revenue.paymentStatus === 'INVOICED'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {revenue.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {revenue.currency !== 'USD' && (
                        <span className="text-xs text-muted-foreground mr-1">
                          {revenue.currency} {revenue.amount.toLocaleString()} →
                        </span>
                      )}
                      ${revenue.convertedAmount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/dashboard/projects/${revenue.project.id}`}>
                        <Button variant="ghost" size="sm">
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
