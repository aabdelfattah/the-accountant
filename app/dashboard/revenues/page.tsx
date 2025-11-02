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
import { Plus, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { RevenueFilters } from '@/components/revenues/revenue-filters';

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

  const hasActiveFilters =
    searchParams.startDate ||
    searchParams.endDate ||
    searchParams.status ||
    searchParams.projectId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revenues</h1>
          <p className="text-muted-foreground mt-1">
            Track and manage project income
          </p>
        </div>
        <Link href="/dashboard/revenues/new">
          <Button size="lg" className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Revenue
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                Total Revenue
              </CardDescription>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </div>
            <CardTitle className="text-3xl font-bold">
              ${totalAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {revenues.length} entries
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                Paid
              </CardDescription>
              <div className="h-2 w-2 rounded-full bg-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-600">
              ${paidAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {revenues.filter((r) => r.paymentStatus === 'PAID').length} paid
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                Pending
              </CardDescription>
              <div className="h-2 w-2 rounded-full bg-orange-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-orange-600">
              ${pendingAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {revenues.filter((r) => r.paymentStatus !== 'PAID').length} pending
          </CardContent>
        </Card>
      </div>

      {/* Modern Google Sheets-style Filters */}
      <div className="flex items-center justify-between">
        <RevenueFilters projects={projects} />
      </div>

      {/* Revenue List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Revenue Entries</CardTitle>
          <CardDescription>
            {revenues.length} {revenues.length === 1 ? 'entry' : 'entries'}{' '}
            sorted by date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {revenues.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No revenues found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first revenue entry'}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/revenues/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Revenue
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Date</TableHead>
                    <TableHead className="font-semibold">Project</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="text-right font-semibold">
                      Amount
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {revenues.map((revenue) => (
                    <TableRow key={revenue.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {new Date(revenue.revenueDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Link
                          href={`/dashboard/projects/${revenue.project.id}`}
                          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                        >
                          {revenue.project.name}
                        </Link>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {revenue.description}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
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
                      <TableCell className="text-right">
                        <div className="font-semibold">
                          ${revenue.convertedAmount.toLocaleString()}
                        </div>
                        {revenue.currency !== 'USD' && (
                          <div className="text-xs text-muted-foreground">
                            {revenue.currency} {revenue.amount.toLocaleString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/dashboard/projects/${revenue.project.id}`}
                        >
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
