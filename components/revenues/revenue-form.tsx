'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

type Project = {
  id: string;
  name: string;
};

type RevenueFormProps = {
  projects: Project[];
  defaultProjectId?: string;
};

export function RevenueForm({ projects, defaultProjectId }: RevenueFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    projectId: defaultProjectId || '',
    amount: '',
    currency: 'USD',
    exchangeRate: '1',
    revenueDate: new Date().toISOString().split('T')[0],
    paymentStatus: 'DELIVERED',
    invoiceDate: '',
    paymentDate: '',
    dueDate: '',
    bankAccount: '',
    taxAmount: '',
    withholdingAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      if (!formData.description.trim()) {
        setMessage({ type: 'error', text: 'Description is required' });
        setLoading(false);
        return;
      }

      if (!formData.projectId) {
        setMessage({ type: 'error', text: 'Project is required' });
        setLoading(false);
        return;
      }

      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        setMessage({
          type: 'error',
          text: 'Amount must be greater than zero',
        });
        setLoading(false);
        return;
      }

      const payload = {
        description: formData.description,
        projectId: formData.projectId,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        exchangeRate: parseFloat(formData.exchangeRate),
        revenueDate: formData.revenueDate,
        invoiceDate: formData.invoiceDate || null,
        paymentDate: formData.paymentDate || null,
        dueDate: formData.dueDate || null,
        paymentStatus: formData.paymentStatus,
        bankAccount: formData.bankAccount || null,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : null,
        withholdingAmount: formData.withholdingAmount
          ? parseFloat(formData.withholdingAmount)
          : null,
      };

      const response = await fetch('/api/revenues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to create revenue',
        });
        setLoading(false);
        return;
      }

      setMessage({ type: 'success', text: 'Revenue created successfully!' });

      setTimeout(() => {
        if (formData.projectId) {
          router.push(`/dashboard/projects/${formData.projectId}`);
        } else {
          router.push('/dashboard/revenues');
        }
      }, 1000);
    } catch (error) {
      console.error('Error creating revenue:', error);
      setMessage({
        type: 'error',
        text: 'An unexpected error occurred. Please try again.',
      });
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Basic Information
              </h3>

              <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                <label className="text-sm font-medium pt-2">
                  Project <span className="text-red-500">*</span>
                </label>
                <Select
                  value={formData.projectId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, projectId: value })
                  }
                  required
                  disabled={!!defaultProjectId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                <label className="text-sm font-medium pt-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Brief description of the revenue"
                  required
                  rows={3}
                />
              </div>
            </div>

            {/* Amount & Currency */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Amount
              </h3>

              <div className="grid grid-cols-[140px_1fr_1fr] gap-4 items-start">
                <label className="text-sm font-medium pt-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
                <Select
                  value={formData.currency}
                  onValueChange={(value) =>
                    setFormData({ ...formData, currency: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="EGP">EGP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.currency !== 'USD' && (
                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Exchange Rate
                  </label>
                  <Input
                    type="number"
                    step="0.0001"
                    value={formData.exchangeRate}
                    onChange={(e) =>
                      setFormData({ ...formData, exchangeRate: e.target.value })
                    }
                    placeholder="1.0000"
                  />
                </div>
              )}
            </div>

            {/* Dates & Status */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Dates & Status
              </h3>

              <div className="grid grid-cols-[140px_1fr_1fr] gap-4 items-start">
                <label className="text-sm font-medium pt-2">
                  Revenue Date <span className="text-red-500">*</span>
                </label>
                <DatePicker
                  date={
                    formData.revenueDate
                      ? new Date(formData.revenueDate)
                      : undefined
                  }
                  onDateChange={(date) =>
                    setFormData({
                      ...formData,
                      revenueDate: date ? date.toISOString().split('T')[0] : '',
                    })
                  }
                  placeholder="Select revenue date"
                />
                <Select
                  value={formData.paymentStatus}
                  onValueChange={(value) =>
                    setFormData({ ...formData, paymentStatus: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELIVERED">Delivered</SelectItem>
                    <SelectItem value="INVOICED">Invoiced</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentStatus === 'INVOICED' && (
                <div className="grid grid-cols-[140px_1fr_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Invoice Date
                  </label>
                  <DatePicker
                    date={
                      formData.invoiceDate
                        ? new Date(formData.invoiceDate)
                        : undefined
                    }
                    onDateChange={(date) =>
                      setFormData({
                        ...formData,
                        invoiceDate: date
                          ? date.toISOString().split('T')[0]
                          : '',
                      })
                    }
                    placeholder="Select invoice date"
                  />
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    placeholder="Due Date"
                  />
                </div>
              )}

              {formData.paymentStatus === 'PAID' && (
                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Payment Date
                  </label>
                  <DatePicker
                    date={
                      formData.paymentDate
                        ? new Date(formData.paymentDate)
                        : undefined
                    }
                    onDateChange={(date) =>
                      setFormData({
                        ...formData,
                        paymentDate: date
                          ? date.toISOString().split('T')[0]
                          : '',
                      })
                    }
                    placeholder="Select payment date"
                  />
                </div>
              )}
            </div>

            {/* Optional Details */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Additional Details (Optional)
              </h3>

              <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                <label className="text-sm font-medium pt-2">Bank Account</label>
                <Input
                  value={formData.bankAccount}
                  onChange={(e) =>
                    setFormData({ ...formData, bankAccount: e.target.value })
                  }
                  placeholder="e.g., PayPal, Bank Transfer"
                />
              </div>

              <div className="grid grid-cols-[140px_1fr_1fr] gap-4 items-start">
                <label className="text-sm font-medium pt-2">Deductions</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.taxAmount}
                  onChange={(e) =>
                    setFormData({ ...formData, taxAmount: e.target.value })
                  }
                  placeholder="Tax Amount"
                />
                <Input
                  type="number"
                  step="0.01"
                  value={formData.withholdingAmount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      withholdingAmount: e.target.value,
                    })
                  }
                  placeholder="Withholding"
                />
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-3 rounded-md text-sm ${
                  message.type === 'success'
                    ? 'bg-green-50 text-green-800 border border-green-200'
                    : 'bg-red-50 text-red-800 border border-red-200'
                }`}
              >
                {message.text}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Revenue
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
