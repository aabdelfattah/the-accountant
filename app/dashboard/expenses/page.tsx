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
  category?: string;
  projectId?: string;
  freelancerId?: string;
};

export default async function ExpensesPage({
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

  if (searchParams.category) {
    where.category = searchParams.category;
  }

  if (searchParams.projectId) {
    where.projectId = searchParams.projectId;
  }

  if (searchParams.freelancerId) {
    where.freelancerId = searchParams.freelancerId;
  }

  if (searchParams.startDate || searchParams.endDate) {
    where.expenseDate = {};
    if (searchParams.startDate) {
      where.expenseDate.gte = new Date(searchParams.startDate);
    }
    if (searchParams.endDate) {
      where.expenseDate.lte = new Date(searchParams.endDate);
    }
  }

  // Fetch expenses with related data
  const expenses = await prisma.expense.findMany({
    where,
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      freelancer: {
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
      expenseDate: 'desc',
    },
  });

  // Calculate totals
  const totalAmount = expenses.reduce(
    (sum, exp) => sum + exp.convertedAmount,
    0
  );
  const paidAmount = expenses
    .filter((exp) => exp.paymentStatus === 'PAID')
    .reduce((sum, exp) => sum + exp.convertedAmount, 0);
  const pendingAmount = expenses
    .filter((exp) => exp.paymentStatus !== 'PAID')
    .reduce((sum, exp) => sum + exp.convertedAmount, 0);

  // Fetch projects and freelancers for filter dropdowns
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

  const freelancers = await prisma.freelancer.findMany({
    where: { active: true },
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
          <h1 className="text-3xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Record and manage business expenses ({expenses.length} total)
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-2xl">
              ${totalAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Paid</CardDescription>
            <CardTitle className="text-2xl text-red-600">
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[180px]">
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
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-2 block">End Date</label>
              <input
                type="date"
                name="endDate"
                defaultValue={searchParams.endDate}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <select
                name="status"
                defaultValue={searchParams.status || ''}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-2 block">Category</label>
              <select
                name="category"
                defaultValue={searchParams.category || ''}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Categories</option>
                <option value="COGS">COGS</option>
                <option value="SOFTWARE">Software</option>
                <option value="MARKETING">Marketing</option>
                <option value="OPERATIONS">Operations</option>
                <option value="PAYROLL">Payroll</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div className="flex-1 min-w-[180px]">
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
            <div className="flex-1 min-w-[180px]">
              <label className="text-sm font-medium mb-2 block">
                Freelancer
              </label>
              <select
                name="freelancerId"
                defaultValue={searchParams.freelancerId || ''}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="">All Freelancers</option>
                {freelancers.map((freelancer) => (
                  <option key={freelancer.id} value={freelancer.id}>
                    {freelancer.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit">Apply Filters</Button>
              <Link href="/dashboard/expenses">
                <Button type="button" variant="outline">
                  Clear
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Expense List */}
      <Card>
        <CardHeader>
          <CardTitle>Expense Entries</CardTitle>
          <CardDescription>
            All expense entries sorted by date (newest first)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No expenses found. Create your first expense entry to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead>Freelancer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium">
                      {new Date(expense.expenseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.description}
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {expense.category}
                      </span>
                    </TableCell>
                    <TableCell>
                      {expense.project ? (
                        <Link
                          href={`/dashboard/projects/${expense.project.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {expense.project.name}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {expense.freelancer ? (
                        <span className="text-sm">
                          {expense.freelancer.name}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          expense.paymentStatus === 'PAID'
                            ? 'bg-green-100 text-green-800'
                            : expense.paymentStatus === 'OVERDUE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-orange-100 text-orange-800'
                        }`}
                      >
                        {expense.paymentStatus}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {expense.currency !== 'USD' && (
                        <span className="text-xs text-muted-foreground mr-1">
                          {expense.currency} {expense.amount.toLocaleString()} →
                        </span>
                      )}
                      ${expense.convertedAmount.toLocaleString()}
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
