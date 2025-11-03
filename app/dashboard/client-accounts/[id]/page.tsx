import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  Users,
  TrendingUp,
  TrendingDown,
  FileText,
  Plus,
} from 'lucide-react';
import { auth } from '@/auth';
import { redirect, notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ClientAccountDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch project with all related data
  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      client: true,
      user: true,
      revenues: {
        orderBy: { revenueDate: 'desc' },
      },
      expenses: {
        orderBy: { expenseDate: 'desc' },
      },
      projectFreelancers: {
        include: {
          freelancer: true,
        },
      },
    },
  });

  if (!project) {
    notFound();
  }

  // Fetch linked accounts details
  const revenueAccount = project.revenueAccountId
    ? await prisma.chartOfAccount.findUnique({
        where: { id: project.revenueAccountId },
      })
    : null;

  const cogsAccount = project.cogsAccountId
    ? await prisma.chartOfAccount.findUnique({
        where: { id: project.cogsAccountId },
      })
    : null;

  // Calculate financials
  const totalRevenue = project.revenues.reduce((sum, r) => sum + r.amount, 0);
  const totalExpenses = project.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin =
    totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;

  // Status badge styles
  const getStatusBadge = (status: string) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700',
      COMPLETED: 'bg-blue-100 text-blue-700',
      ARCHIVED: 'bg-gray-100 text-gray-700',
    };
    return styles[status as keyof typeof styles] || styles.ACTIVE;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/client-accounts">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <span
              className={`text-xs px-2 py-1 rounded ${getStatusBadge(project.status)}`}
            >
              {project.status}
            </span>
          </div>
          <p className="text-muted-foreground">
            {project.description || 'No description'}
          </p>
        </div>
        <Link href={`/dashboard/client-accounts/${project.id}/edit`}>
          <Button variant="outline">Edit Account</Button>
        </Link>
      </div>

      {/* Project Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Client</span>
            </div>
            <p className="font-semibold">
              {project.client?.name || project.clientName}
            </p>
            {project.client?.email && (
              <p className="text-xs text-muted-foreground">
                {project.client.email}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Start Date</span>
            </div>
            <p className="font-semibold">
              {project.startDate
                ? new Date(project.startDate).toLocaleDateString()
                : 'Not set'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Transactions
              </span>
            </div>
            <p className="font-semibold">
              {project.revenues.length} revenues, {project.expenses.length}{' '}
              expenses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Team</span>
            </div>
            <p className="font-semibold">
              {project.projectFreelancers.length} freelancers
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Revenue</CardDescription>
            <CardTitle className="text-3xl">
              ${totalRevenue.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-3xl">
              ${totalExpenses.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Profit</CardDescription>
            <CardTitle
              className={`text-3xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              ${netProfit.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Profit Margin</CardDescription>
            <CardTitle
              className={`text-3xl ${Number(profitMargin) >= 0 ? 'text-green-600' : 'text-red-600'}`}
            >
              {profitMargin}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Linked Accounts */}
      {(revenueAccount || cogsAccount) && (
        <Card>
          <CardHeader>
            <CardTitle>Linked Accounts</CardTitle>
            <CardDescription>
              Auto-generated accounts for this client account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {revenueAccount && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Revenue Account</span>
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="font-mono text-sm">{revenueAccount.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {revenueAccount.name}
                  </p>
                </div>
              )}

              {cogsAccount && (
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">COGS Account</span>
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  </div>
                  <p className="font-mono text-sm">{cogsAccount.code}</p>
                  <p className="text-sm text-muted-foreground">
                    {cogsAccount.name}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members */}
      {project.projectFreelancers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>
              Freelancers assigned to this client account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {project.projectFreelancers.map((pf) => (
                <div
                  key={pf.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{pf.freelancer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pf.role || 'Team Member'} •{' '}
                      {new Date(pf.assignedDate).toLocaleDateString()}
                    </p>
                  </div>
                  {pf.freelancer.email && (
                    <p className="text-sm text-muted-foreground">
                      {pf.freelancer.email}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Revenues */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Revenues</CardTitle>
              <CardDescription>
                Latest revenue entries for this client account
              </CardDescription>
            </div>
            <Link href={`/dashboard/revenues/new?projectId=${project.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Revenue
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {project.revenues.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No revenues recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {project.revenues.slice(0, 5).map((revenue) => (
                <div
                  key={revenue.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{revenue.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(revenue.revenueDate).toLocaleDateString()} •{' '}
                      {revenue.paymentStatus}
                    </p>
                  </div>
                  <p className="font-semibold text-green-600">
                    ${revenue.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Expenses</CardTitle>
              <CardDescription>
                Latest expense entries for this client account
              </CardDescription>
            </div>
            <Link href={`/dashboard/expenses/new?projectId=${project.id}`}>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Expense
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {project.expenses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No expenses recorded yet
            </p>
          ) : (
            <div className="space-y-2">
              {project.expenses.slice(0, 5).map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(expense.expenseDate).toLocaleDateString()} •{' '}
                      {expense.category}
                    </p>
                  </div>
                  <p className="font-semibold text-red-600">
                    ${expense.amount.toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
