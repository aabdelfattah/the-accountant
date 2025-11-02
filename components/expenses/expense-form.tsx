'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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

type Freelancer = {
  id: string;
  name: string;
};

type ExpenseFormProps = {
  projects: Project[];
  freelancers: Freelancer[];
  defaultProjectId?: string;
};

export function ExpenseForm({
  projects,
  freelancers,
  defaultProjectId,
}: ExpenseFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    description: '',
    category: 'COGS',
    projectId: defaultProjectId || 'none',
    freelancerId: 'none',
    amount: '',
    currency: 'USD',
    exchangeRate: '1',
    expenseDate: new Date().toISOString().split('T')[0],
    invoiceDate: '',
    paymentDate: '',
    dueDate: '',
    paymentStatus: 'PAID',
    bankAccount: '',
    taxAmount: '',
    withholdingAmount: '',
    isRecurring: false,
    recurringPeriod: '',
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

      if (!formData.category) {
        setMessage({ type: 'error', text: 'Category is required' });
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
        category: formData.category,
        projectId: formData.projectId === 'none' ? null : formData.projectId,
        freelancerId:
          formData.freelancerId === 'none' ? null : formData.freelancerId,
        amount: parseFloat(formData.amount),
        currency: formData.currency,
        exchangeRate: parseFloat(formData.exchangeRate),
        expenseDate: formData.expenseDate,
        invoiceDate: formData.invoiceDate || null,
        paymentDate: formData.paymentDate || null,
        dueDate: formData.dueDate || null,
        paymentStatus: formData.paymentStatus,
        bankAccount: formData.bankAccount || null,
        taxAmount: formData.taxAmount ? parseFloat(formData.taxAmount) : null,
        withholdingAmount: formData.withholdingAmount
          ? parseFloat(formData.withholdingAmount)
          : null,
        isRecurring: formData.isRecurring,
        recurringPeriod: formData.recurringPeriod || null,
      };

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to create expense',
        });
        setLoading(false);
        return;
      }

      setMessage({ type: 'success', text: 'Expense created successfully!' });

      // Redirect after success
      setTimeout(() => {
        if (formData.projectId && formData.projectId !== 'none') {
          router.push(`/dashboard/projects/${formData.projectId}`);
        } else {
          router.push('/dashboard/expenses');
        }
      }, 1000);
    } catch (error) {
      console.error('Error creating expense:', error);
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
        <CardTitle>Expense Details</CardTitle>
        <CardDescription>
          Enter the details of the expense entry
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
              placeholder="e.g., Payment to freelancer for video editing"
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">
              Category <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="COGS">
                  COGS (Cost of Goods Sold - Freelancers, Production)
                </SelectItem>
                <SelectItem value="SOFTWARE">Software & Tools</SelectItem>
                <SelectItem value="MARKETING">
                  Marketing & Advertising
                </SelectItem>
                <SelectItem value="OPERATIONS">Operations & Admin</SelectItem>
                <SelectItem value="PAYROLL">Payroll & Salary</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Project and Freelancer */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, projectId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="freelancerId">Freelancer (Optional)</Label>
              <Select
                value={formData.freelancerId}
                onValueChange={(value) =>
                  setFormData({ ...formData, freelancerId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a freelancer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {freelancers.map((freelancer) => (
                    <SelectItem key={freelancer.id} value={freelancer.id}>
                      {freelancer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              <Label htmlFor="expenseDate">
                Expense Date <span className="text-red-500">*</span>
              </Label>
              <Input
                id="expenseDate"
                type="date"
                value={formData.expenseDate}
                onChange={(e) =>
                  setFormData({ ...formData, expenseDate: e.target.value })
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

          {/* Payment Status */}
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
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
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="PAID">Paid</SelectItem>
                <SelectItem value="OVERDUE">Overdue</SelectItem>
              </SelectContent>
            </Select>
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

          {/* Recurring Expense */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRecurring"
                checked={formData.isRecurring}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isRecurring: checked as boolean })
                }
              />
              <Label htmlFor="isRecurring" className="cursor-pointer">
                This is a recurring expense (e.g., monthly subscription)
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="space-y-2">
                <Label htmlFor="recurringPeriod">Recurring Period</Label>
                <Select
                  value={formData.recurringPeriod}
                  onValueChange={(value) =>
                    setFormData({ ...formData, recurringPeriod: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                    <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                    <SelectItem value="YEARLY">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
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
              {loading ? 'Creating...' : 'Create Expense'}
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
