'use client';

import { useRouter } from 'next/navigation';
import { EditableTable, Column } from '@/components/ui/editable-table';
import Link from 'next/link';
import { formatDate } from '@/lib/utils';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Revenue = {
  id: string;
  revenueDate: Date;
  description: string;
  amount: number;
  currency: string;
  convertedAmount: number;
  paymentStatus: string;
  bankAccount?: string | null;
  paymentDate?: Date | null;
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<Revenue | null>(null);
  const [paymentDate, setPaymentDate] = useState<string>('');
  const [bankAccount, setBankAccount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const baseColumns: Column<Revenue>[] = [
    {
      key: 'revenueDate',
      header: 'Date',
      type: 'date',
      width: 'w-[130px]',
      render: (row) => formatDate(row.revenueDate),
    },
  ];

  const projectColumn: Column<Revenue> = {
    key: 'projectName',
    header: 'Client Account',
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
    // If changing status to PAID, show dialog to collect payment details
    if (
      updatedData.paymentStatus === 'PAID' &&
      revenues.find((r) => r.id === id)?.paymentStatus !== 'PAID'
    ) {
      const revenue = revenues.find((r) => r.id === id);
      if (revenue) {
        setSelectedRevenue(revenue);
        // Pre-fill payment date with today
        setPaymentDate(new Date().toISOString().split('T')[0]);
        // Pre-fill bank account if already set
        setBankAccount(revenue.bankAccount || '');
        setPaymentDialogOpen(true);
        return; // Don't save yet, wait for dialog
      }
    }

    try {
      const response = await fetch(`/api/revenues/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update revenue');
      }

      // Check if there was a journal entry warning
      const result = await response.json();
      if (result.journalEntryWarning) {
        alert(result.journalEntryWarning);
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error saving revenue:', error);
      throw error;
    }
  };

  const handlePaymentSubmit = async () => {
    if (!selectedRevenue || !paymentDate || !bankAccount) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/revenues/${selectedRevenue.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentStatus: 'PAID',
          paymentDate,
          bankAccount,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update revenue');
      }

      // Check if there was a journal entry warning
      const result = await response.json();
      if (result.journalEntryWarning) {
        alert(result.journalEntryWarning);
      }

      // Close dialog and refresh
      setPaymentDialogOpen(false);
      setSelectedRevenue(null);
      router.refresh();
    } catch (error) {
      console.error('Error updating payment:', error);
      alert(
        error instanceof Error ? error.message : 'Failed to update payment'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <EditableTable
        data={revenues}
        columns={columns}
        onSave={handleSave}
        emptyMessage="No revenues found"
        rowClassName={(row) =>
          `hover:bg-muted/50 ${row.paymentStatus === 'PAID' ? '' : ''}`
        }
      />

      {/* Payment Details Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Payment Details Required</DialogTitle>
            <DialogDescription>
              To mark this revenue as PAID and create a journal entry, please
              provide the payment details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">
                Payment Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="paymentDate"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bankAccount">
                Bank Account <span className="text-red-500">*</span>
              </Label>
              <Select value={bankAccount} onValueChange={setBankAccount}>
                <SelectTrigger id="bankAccount">
                  <SelectValue placeholder="Select bank account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1001">PayPal</SelectItem>
                  <SelectItem value="1003">Bank Account</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Select where the payment was received
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handlePaymentSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Mark as Paid'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
