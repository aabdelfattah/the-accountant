'use client';

import { useRouter } from 'next/navigation';
import { EditableTable, Column } from '@/components/ui/editable-table';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';

type Expense = {
  id: string;
  expenseDate: Date;
  description: string;
  category: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  paymentStatus: string;
  project?: {
    id: string;
    name: string;
  } | null;
  freelancer?: {
    id: string;
    name: string;
  } | null;
};

interface ExpenseTableProps {
  expenses: Expense[];
  variant?: 'full' | 'simple';
}

export function ExpenseTable({
  expenses,
  variant = 'full',
}: ExpenseTableProps) {
  const router = useRouter();

  const baseColumns: Column<Expense>[] = [
    {
      key: 'expenseDate',
      header: 'Date',
      type: 'date',
      width: 'w-[130px]',
      render: (row) => formatDate(row.expenseDate),
    },
    {
      key: 'description',
      header: 'Description',
      type: 'text',
      className: 'max-w-xs truncate',
    },
    {
      key: 'category',
      header: 'Category',
      type: 'select',
      selectOptions: [
        { value: 'COGS', label: 'COGS' },
        { value: 'SOFTWARE', label: 'SOFTWARE' },
        { value: 'MARKETING', label: 'MARKETING' },
        { value: 'OPERATIONS', label: 'OPERATIONS' },
        { value: 'PAYROLL', label: 'PAYROLL' },
        { value: 'OTHER', label: 'OTHER' },
      ],
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          {row.category}
        </span>
      ),
    },
  ];

  const projectColumn: Column<Expense> = {
    key: 'project',
    header: 'Project',
    type: 'readonly',
    render: (row) =>
      row.project ? (
        <Link
          href={`/dashboard/client-accounts/${row.project.id}`}
          className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
        >
          {row.project.name}
        </Link>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  };

  const freelancerColumn: Column<Expense> = {
    key: 'freelancer',
    header: 'Freelancer',
    type: 'readonly',
    render: (row) =>
      row.freelancer ? (
        <span className="text-sm font-medium">{row.freelancer.name}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      ),
  };

  const statusAndAmountColumns: Column<Expense>[] = [
    {
      key: 'paymentStatus',
      header: 'Status',
      type: 'select',
      selectOptions: [
        { value: 'PENDING', label: 'PENDING' },
        { value: 'PAID', label: 'PAID' },
        { value: 'OVERDUE', label: 'OVERDUE' },
      ],
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.paymentStatus === 'PAID'
              ? 'bg-green-100 text-green-800'
              : row.paymentStatus === 'OVERDUE'
                ? 'bg-red-100 text-red-800'
                : 'bg-orange-100 text-orange-800'
          }`}
        >
          {row.paymentStatus}
        </span>
      ),
    },
    {
      key: 'convertedAmount',
      header: 'Amount',
      type: 'number',
      className: 'text-right',
      headerClassName: 'text-right',
      render: (row) => (
        <div className="text-right">
          <div
            className={`font-semibold ${variant === 'simple' ? 'text-red-600' : ''}`}
          >
            ${row.convertedAmount.toLocaleString()}
          </div>
          {row.currency !== 'USD' && (
            <div className="text-xs text-muted-foreground">
              {row.currency} {row.amount.toLocaleString()}
            </div>
          )}
        </div>
      ),
      editable: false,
    },
  ];

  // Conditionally include project and freelancer columns based on variant
  const columns =
    variant === 'full'
      ? [
          ...baseColumns,
          projectColumn,
          freelancerColumn,
          ...statusAndAmountColumns,
        ]
      : [...baseColumns, ...statusAndAmountColumns];

  const handleSave = async (id: string, updatedData: Partial<Expense>) => {
    try {
      const response = await fetch(`/api/expenses/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update expense');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error saving expense:', error);
      throw error;
    }
  };

  return (
    <EditableTable
      data={expenses}
      columns={columns}
      onSave={handleSave}
      emptyMessage="No expenses found"
      rowClassName={(row) =>
        `hover:bg-muted/50 ${row.paymentStatus === 'PAID' ? '' : ''}`
      }
    />
  );
}
