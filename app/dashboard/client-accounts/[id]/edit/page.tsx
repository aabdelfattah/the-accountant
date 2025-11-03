'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Project = {
  id: string;
  name: string;
  clientName: string;
  clientId: string | null;
  client?: {
    id: string;
    name: string;
    email: string | null;
  } | null;
  description: string | null;
  status: string;
  startDate: string | null;
  endDate: string | null;
};

type Client = {
  id: string;
  name: string;
  email: string | null;
};

export default function EditClientAccountPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    clientName: '',
    clientId: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    endDate: '',
  });

  // Fetch project and clients
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch project
        const projectRes = await fetch(`/api/client-accounts/${params.id}`);
        if (projectRes.ok) {
          const projectData = await projectRes.json();
          setProject(projectData);
          setFormData({
            name: projectData.name,
            clientName: projectData.clientName,
            clientId: projectData.client?.id || '',
            description: projectData.description || '',
            status: projectData.status,
            startDate: projectData.startDate
              ? new Date(projectData.startDate).toISOString().split('T')[0]
              : '',
            endDate: projectData.endDate
              ? new Date(projectData.endDate).toISOString().split('T')[0]
              : '',
          });
        }

        // Fetch clients
        const clientsRes = await fetch('/api/clients?active=true');
        if (clientsRes.ok) {
          const clientsData = await clientsRes.json();
          setClients(clientsData.clients || []);
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoadingData(false);
      }
    };

    fetchData();
  }, [params.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        name: formData.name,
        clientName: formData.clientName,
        ...(formData.clientId && { clientId: formData.clientId }),
        ...(formData.description && { description: formData.description }),
        status: formData.status,
        ...(formData.startDate && { startDate: formData.startDate }),
        ...(formData.endDate && { endDate: formData.endDate }),
      };

      const response = await fetch(`/api/client-accounts/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update client account');
      }

      router.push(`/dashboard/client-accounts/${params.id}`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update client account'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find((c) => c.id === clientId);
    setFormData({
      ...formData,
      clientId,
      clientName: selectedClient?.name || formData.clientName,
    });
  };

  if (loadingData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/client-accounts/${params.id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Client Account</h1>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/client-accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Client Account Not Found</h1>
            <p className="text-muted-foreground">
              {"The client account you're looking for doesn't exist."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/client-accounts/${params.id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Client Account</h1>
          <p className="text-muted-foreground">Update client account details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Client Account Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="name">Account Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="client">
                  Select Existing Client (Optional)
                </Label>
                <Select
                  value={formData.clientId}
                  onValueChange={handleClientSelect}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) =>
                    setFormData({ ...formData, clientName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                        startDate: date ? date.toISOString().split('T')[0] : '',
                      })
                    }
                    placeholder="Select start date"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <DatePicker
                    date={
                      formData.endDate ? new Date(formData.endDate) : undefined
                    }
                    onDateChange={(date) =>
                      setFormData({
                        ...formData,
                        endDate: date ? date.toISOString().split('T')[0] : '',
                      })
                    }
                    placeholder="Select end date"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Link href={`/dashboard/client-accounts/${params.id}`}>
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
