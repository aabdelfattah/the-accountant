'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { EditableTable, Column } from '@/components/ui/editable-table';

type Project = {
  id: string;
  name: string;
  clientName: string;
  description: string | null;
  status: string;
  startDate: string | null;
  client?: {
    id: string;
    name: string;
  } | null;
  revenues: { amount: number }[];
  expenses: { amount: number }[];
};

export default function ClientAccountsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects
  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/client-accounts');
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Handle save
  const handleSave = async (id: string, updatedData: Partial<Project>) => {
    const response = await fetch(`/api/client-accounts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: updatedData.name,
        clientName: updatedData.clientName,
        description: updatedData.description || null,
        status: updatedData.status,
        startDate: updatedData.startDate || null,
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Failed to save changes');
    }

    await fetchProjects(); // Refresh data
  };

  // Define columns
  const columns: Column<Project>[] = [
    {
      key: 'name',
      header: 'Account Name',
      width: 'w-[250px]',
      type: 'text',
      className: 'font-medium',
      render: (row) => (
        <Link
          href={`/dashboard/client-accounts/${row.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: 'clientName',
      header: 'Client',
      width: 'w-[180px]',
      type: 'text',
      render: (row) => row.client?.name || row.clientName,
    },
    {
      key: 'description',
      header: 'Description',
      type: 'text',
      className: 'max-w-xs truncate',
      render: (row) =>
        row.description || (
          <span className="text-muted-foreground text-sm">—</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      width: 'w-[120px]',
      type: 'select',
      selectOptions: [
        { value: 'ACTIVE', label: 'Active' },
        { value: 'COMPLETED', label: 'Completed' },
        { value: 'ARCHIVED', label: 'Archived' },
      ],
      render: (row) => {
        const styles = {
          ACTIVE: 'bg-green-100 text-green-800',
          COMPLETED: 'bg-blue-100 text-blue-800',
          ARCHIVED: 'bg-gray-100 text-gray-800',
        };
        const style =
          styles[row.status as keyof typeof styles] || styles.ACTIVE;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style}`}
          >
            {row.status}
          </span>
        );
      },
    },
    {
      key: 'startDate',
      header: 'Start Date',
      width: 'w-[110px]',
      type: 'date',
    },
    {
      key: 'revenues',
      header: 'Revenue',
      width: 'w-[130px]',
      type: 'readonly',
      editable: false,
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => {
        const revenue = row.revenues.reduce((sum, r) => sum + r.amount, 0);
        return (
          <div className="font-semibold text-green-600">
            ${revenue.toLocaleString()}
          </div>
        );
      },
    },
    {
      key: 'expenses',
      header: 'Expenses',
      width: 'w-[130px]',
      type: 'readonly',
      editable: false,
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => {
        const expenses = row.expenses.reduce((sum, e) => sum + e.amount, 0);
        return (
          <div className="font-semibold text-red-600">
            ${expenses.toLocaleString()}
          </div>
        );
      },
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Accounts</h1>
          <p className="text-muted-foreground mt-1">
            Manage client accounts and track revenue/expenses
          </p>
        </div>
        <Link href="/dashboard/client-accounts/new">
          <Button size="lg" className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            New Client Account
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">
              Total Accounts
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              {projects.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">
              Active
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-green-600">
              {activeProjects}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">
              Total Revenue
            </CardDescription>
            <CardTitle className="text-3xl font-bold">
              ${totalRevenue.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-l-4 border-l-indigo-500">
          <CardHeader className="pb-3">
            <CardDescription className="text-sm font-medium">
              Net Profit
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-blue-600">
              ${(totalRevenue - totalExpenses).toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Editable Table */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>All Client Accounts</CardTitle>
          <CardDescription>
            {projects.length} {projects.length === 1 ? 'account' : 'accounts'} •
            Click edit to modify inline
          </CardDescription>
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
            <EditableTable
              data={projects}
              columns={columns}
              onSave={handleSave}
              emptyMessage="No client accounts found"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
