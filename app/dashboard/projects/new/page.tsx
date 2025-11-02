'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

type Client = {
  id: string;
  name: string;
  email: string | null;
};

export default function NewProjectPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientId: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    createRevenueAccount: true,
    createCogsAccount: true,
  });

  // Fetch clients on mount
  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/clients?active=true');
        if (response.ok) {
          const data = await response.json();
          setClients(data.clients || []);
        }
      } catch (err) {
        console.error('Failed to fetch clients:', err);
      } finally {
        setLoadingClients(false);
      }
    };

    fetchClients();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Filter out empty optional fields
      const payload = {
        name: formData.name,
        clientName: formData.clientName,
        ...(formData.clientId && { clientId: formData.clientId }),
        ...(formData.description && { description: formData.description }),
        status: formData.status,
        ...(formData.startDate && { startDate: formData.startDate }),
        createRevenueAccount: formData.createRevenueAccount,
        createCogsAccount: formData.createCogsAccount,
      };

      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create project');
      }

      router.push('/dashboard/projects');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fill client name when client is selected
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      clientId,
      clientName: selectedClient?.name || formData.clientName,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/projects">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Project</h1>
          <p className="text-muted-foreground">
            Create a new project with auto-generated accounts
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Basic Information
                </h3>

                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Website Redesign 2024"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Description
                  </label>
                  <Textarea
                    placeholder="Brief description of the project"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
              </div>

              {/* Client Information */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Client Information
                </h3>

                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Existing Client
                  </label>
                  <div className="space-y-1.5">
                    <Select
                      value={formData.clientId}
                      onValueChange={handleClientSelect}
                      disabled={loadingClients}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            loadingClients
                              ? 'Loading clients...'
                              : 'Choose a client (optional)'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Or enter new client name below
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="e.g., Acme Corporation"
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData({ ...formData, clientName: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              {/* Status & Dates */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Status & Dates
                </h3>

                <div className="grid grid-cols-[140px_1fr_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">Status</label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="COMPLETED">Completed</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <DatePicker
                      date={
                        formData.startDate
                          ? new Date(formData.startDate)
                          : undefined
                      }
                      onDateChange={(date) =>
                        setFormData({
                          ...formData,
                          startDate: date
                            ? date.toISOString().split('T')[0]
                            : '',
                        })
                      }
                      placeholder="Select start date"
                    />
                  </div>
                </div>
              </div>

              {/* Account Generation */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Account Generation
                </h3>

                <div className="grid grid-cols-[140px_1fr] gap-4 items-start">
                  <label className="text-sm font-medium pt-2">
                    Auto-create
                  </label>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="revenueAccount"
                        checked={formData.createRevenueAccount}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            createRevenueAccount: checked as boolean,
                          })
                        }
                      />
                      <div>
                        <label
                          htmlFor="revenueAccount"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Revenue Account (4xxx)
                        </label>
                        <p className="text-xs text-muted-foreground">
                          For project income tracking
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cogsAccount"
                        checked={formData.createCogsAccount}
                        onCheckedChange={(checked) =>
                          setFormData({
                            ...formData,
                            createCogsAccount: checked as boolean,
                          })
                        }
                      />
                      <div>
                        <label
                          htmlFor="cogsAccount"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          COGS Account (5xxx)
                        </label>
                        <p className="text-xs text-muted-foreground">
                          For project cost tracking
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Creating...' : 'Create Project'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
