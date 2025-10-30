import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewExpensePage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={
            searchParams.projectId
              ? `/dashboard/projects/${searchParams.projectId}`
              : '/dashboard/expenses'
          }
        >
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Expense</h1>
          <p className="text-muted-foreground">Record new expense entry</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon - Phase 10</CardTitle>
          <CardDescription>
            Expense entry form will be implemented in Phase 10
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This page will allow you to:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Record expense entries (COGS and operating expenses)</li>
            <li>Link to projects and freelancers</li>
            <li>Track payment status and due dates</li>
            <li>Support multi-currency with exchange rates</li>
            <li>Handle recurring expenses (subscriptions)</li>
            <li>Auto-generate journal entries</li>
          </ul>
          {searchParams.projectId && (
            <p className="mt-4 text-sm text-blue-600">
              Project ID: {searchParams.projectId}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
