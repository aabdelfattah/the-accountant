import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Receipt, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { ExpenseFilters } from '@/components/expenses/expense-filters';
import { ExpenseTable } from '@/components/expenses/expense-table';

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

  const hasActiveFilters =
    searchParams.startDate ||
    searchParams.endDate ||
    searchParams.status ||
    searchParams.category ||
    searchParams.projectId ||
    searchParams.freelancerId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground mt-1">
            Record and manage business expenses
          </p>
        </div>
        <Link href="/dashboard/expenses/new">
          <Button size="lg" className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Expense
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm font-medium">
                Total Expenses
              </CardDescription>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
            <CardTitle className="text-3xl font-bold">
              ${totalAmount.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            {expenses.length} entries
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
            {expenses.filter((e) => e.paymentStatus === 'PAID').length} paid
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
            {expenses.filter((e) => e.paymentStatus !== 'PAID').length} pending
          </CardContent>
        </Card>
      </div>

      {/* Modern Google Sheets-style Filters */}
      <div className="flex items-center justify-between">
        <ExpenseFilters projects={projects} freelancers={freelancers} />
      </div>

      {/* Expense List */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Expense Entries</CardTitle>
          <CardDescription>
            {expenses.length} {expenses.length === 1 ? 'entry' : 'entries'}{' '}
            sorted by date
          </CardDescription>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-4">
                <Receipt className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                No expenses found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Get started by creating your first expense entry'}
              </p>
              {!hasActiveFilters && (
                <Link href="/dashboard/expenses/new">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Expense
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <ExpenseTable expenses={expenses} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
