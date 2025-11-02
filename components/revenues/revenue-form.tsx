'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

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
    invoiceDate: '',
    paymentDate: '',
    dueDate: '',
    paymentStatus: 'DELIVERED',
    bankAccount: '',
    taxAmount: '',
    withholdingAmount: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setLoading(true);

    try {
      // Validate required fields
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

      // Prepare data for API
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

      // Redirect after success
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
        text: 'An unexpected error occurred',
      });
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Details</CardTitle>
        <CardDescription>
          Enter the details of the revenue entry
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Description <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Payment for Project XYZ - Milestone 1"
              required
            />
          </div>

          {/* Project */}
          <div className="space-y-2">
            <Label htmlFor="projectId">
              Project <span className="text-red-500">*</span>
            </Label>
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
            {defaultProjectId && (
              <p className="text-xs text-muted-foreground">
                Project is pre-selected and cannot be changed
              </p>
            )}
          </div>

          {/* Amount and Currency */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                Amount <span className="text-red-500">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
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
                  <SelectItem value="EGP">EGP</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                  <SelectItem value="SAR">SAR</SelectItem>
                  <SelectItem value="AED">AED</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Exchange Rate */}
          {formData.currency !== 'USD' && (
            <div className="space-y-2">
              <Label htmlFor="exchangeRate">
                Exchange Rate to USD <span className="text-red-500">*</span>
              </Label>
              <Input
                id="exchangeRate"
                type="number"
                step="0.0001"
                value={formData.exchangeRate}
                onChange={(e) =>
                  setFormData({ ...formData, exchangeRate: e.target.value })
                }
                placeholder="1.0000"
                required
              />
              <p className="text-xs text-muted-foreground">
                1 {formData.currency} = {formData.exchangeRate} USD
              </p>
            </div>
          )}

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="revenueDate">
                Revenue Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="revenueDate"
                type="date"
                value={formData.revenueDate}
                onChange={(e) =>
                  setFormData({ ...formData, revenueDate: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate">Invoice Date</Label>
              <Input
                id="invoiceDate"
                type="date"
                value={formData.invoiceDate}
                onChange={(e) =>
                  setFormData({ ...formData, invoiceDate: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                value={formData.paymentDate}
                onChange={(e) =>
                  setFormData({ ...formData, paymentDate: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Due Date</Label>
              <Input
                id="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
          </div>

          {/* Revenue Status */}
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Revenue Status</Label>
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
            <p className="text-xs text-muted-foreground">
              Workflow: Delivered → Invoiced → Paid
            </p>
          </div>

          {/* Bank Account */}
          <div className="space-y-2">
            <Label htmlFor="bankAccount">Bank Account</Label>
            <Input
              id="bankAccount"
              value={formData.bankAccount}
              onChange={(e) =>
                setFormData({ ...formData, bankAccount: e.target.value })
              }
              placeholder="e.g., PayPal, Bank Account"
            />
          </div>

          {/* Tax and Withholding */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="taxAmount">Tax Amount</Label>
              <Input
                id="taxAmount"
                type="number"
                step="0.01"
                value={formData.taxAmount}
                onChange={(e) =>
                  setFormData({ ...formData, taxAmount: e.target.value })
                }
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="withholdingAmount">Withholding Amount</Label>
              <Input
                id="withholdingAmount"
                type="number"
                step="0.01"
                value={formData.withholdingAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    withholdingAmount: e.target.value,
                  })
                }
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Message */}
          {message && (
            <div
              className={`p-3 rounded ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-700'
                  : 'bg-red-50 text-red-700'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Revenue'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
