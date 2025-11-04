'use client';

import { useRouter } from 'next/navigation';
import { EditableTable, Column } from '@/components/ui/editable-table';
import Link from 'next/link';

type Revenue = {
  id: string;
  revenueDate: Date;
  description: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  paymentStatus: string;
  project?: {
    id: string;
    name: string;
  };
};

interface RevenueTableProps {
  revenues: Revenue[];
  variant?: 'full' | 'simple';
}

export function RevenueTable({
  revenues,
  variant = 'full',
}: RevenueTableProps) {
  const router = useRouter();

  const baseColumns: Column<Revenue>[] = [
    {
      key: 'revenueDate',
      header: 'Date',
      type: 'date',
      width: 'w-[130px]',
      render: (row) => new Date(row.revenueDate).toLocaleDateString(),
    },
  ];

  const projectColumn: Column<Revenue> = {
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

  const detailColumns: Column<Revenue>[] = [
    {
      key: 'description',
      header: 'Description',
      type: 'text',
      className: 'max-w-xs truncate',
    },
    {
      key: 'paymentStatus',
      header: 'Status',
      type: 'select',
      selectOptions: [
        { value: 'DELIVERED', label: 'DELIVERED' },
        { value: 'INVOICED', label: 'INVOICED' },
        { value: 'PAID', label: 'PAID' },
      ],
      render: (row) => (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            row.paymentStatus === 'PAID'
              ? 'bg-green-100 text-green-800'
              : row.paymentStatus === 'INVOICED'
                ? 'bg-blue-100 text-blue-800'
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
            className={`font-semibold ${variant === 'simple' ? 'text-green-600' : ''}`}
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

  // Conditionally include project column based on variant
  const columns =
    variant === 'full'
      ? [...baseColumns, projectColumn, ...detailColumns]
      : [...baseColumns, ...detailColumns];

  const handleSave = async (id: string, updatedData: Partial<Revenue>) => {
    try {
      const response = await fetch(`/api/revenues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        throw new Error('Failed to update revenue');
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error saving revenue:', error);
      throw error;
    }
  };

  return (
    <EditableTable
      data={revenues}
      columns={columns}
      onSave={handleSave}
      emptyMessage="No revenues found"
      rowClassName={(row) =>
        `hover:bg-muted/50 ${row.paymentStatus === 'PAID' ? '' : ''}`
      }
    />
  );
}
