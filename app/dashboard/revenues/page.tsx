import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function RevenuesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Revenues</h1>
          <p className="text-muted-foreground">Track and manage project income</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Revenue
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Revenue tracking interface will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will allow you to:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Add revenue entries for projects</li>
            <li>Track payment status (Unbilled, Pending, Paid)</li>
            <li>Multi-currency support with exchange rates</li>
            <li>Link to bank accounts (PayPal, Bank)</li>
            <li>Record tax and withholding amounts</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
