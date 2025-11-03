import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Calendar, DollarSign, Users } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function ClientAccountsPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch all projects with related data
  const projects = await prisma.project.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      client: true,
      user: true,
      revenues: true,
      expenses: true,
      projectFreelancers: {
        include: {
          freelancer: true,
        },
      },
    },
  });

  // Calculate stats
  const activeProjects = projects.filter((p) => p.status === 'ACTIVE').length;
  const totalRevenue = projects.reduce(
    (sum, p) => sum + p.revenues.reduce((s, r) => s + r.amount, 0),
    0
  );
  const totalExpenses = projects.reduce(
    (sum, p) => sum + p.expenses.reduce((s, e) => s + e.amount, 0),
    0
  );

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Client Accounts</h1>
          <p className="text-muted-foreground">
            Manage client accounts and track revenue/expenses
          </p>
        </div>
        <Link href="/dashboard/client-accounts/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Client Account
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Accounts</CardDescription>
            <CardTitle className="text-3xl">{projects.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active</CardDescription>
            <CardTitle className="text-3xl text-green-600">
              {activeProjects}
            </CardTitle>
          </CardHeader>
        </Card>
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
            <CardDescription>Net Profit</CardDescription>
            <CardTitle className="text-3xl text-blue-600">
              ${(totalRevenue - totalExpenses).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Client Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>All Client Accounts ({projects.length})</CardTitle>
          <CardDescription>View and manage all client accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                No client accounts yet. Create your first account to get
                started.
              </p>
              <Link href="/dashboard/client-accounts/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Client Account
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const projectRevenue = project.revenues.reduce(
                  (sum, r) => sum + r.amount,
                  0
                );
                const projectExpenses = project.expenses.reduce(
                  (sum, e) => sum + e.amount,
                  0
                );
                const projectProfit = projectRevenue - projectExpenses;

                return (
                  <Link
                    key={project.id}
                    href={`/dashboard/client-accounts/${project.id}`}
                  >
                    <Card className="hover:bg-muted/50 transition-colors cursor-pointer">
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="text-lg font-semibold">
                                {project.name}
                              </h3>
                              <span
                                className={`text-xs px-2 py-0.5 rounded ${getStatusBadge(project.status)}`}
                              >
                                {project.status}
                              </span>
                            </div>

                            <p className="text-sm text-muted-foreground mb-3">
                              {project.description || 'No description'}
                            </p>

                            <div className="flex items-center gap-6 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4" />
                                <span>
                                  {project.client?.name || project.clientName}
                                </span>
                              </div>
                              {project.startDate && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-4 w-4" />
                                  <span>
                                    {new Date(
                                      project.startDate
                                    ).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                <span>
                                  {project.revenues.length} revenues,{' '}
                                  {project.expenses.length} expenses
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right ml-4">
                            <div className="text-sm text-muted-foreground mb-1">
                              Profit
                            </div>
                            <div
                              className={`text-2xl font-bold ${
                                projectProfit >= 0
                                  ? 'text-green-600'
                                  : 'text-red-600'
                              }`}
                            >
                              ${projectProfit.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Revenue: ${projectRevenue.toLocaleString()} |
                              Costs: ${projectExpenses.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
