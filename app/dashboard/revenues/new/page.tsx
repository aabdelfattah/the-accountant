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

export default function NewRevenuePage({
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
              : '/dashboard/revenues'
          }
        >
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">New Revenue</h1>
          <p className="text-muted-foreground">Record new revenue entry</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon - Phase 9</CardTitle>
          <CardDescription>
            Revenue entry form will be implemented in Phase 9
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            This page will allow you to:
          </p>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>Record revenue entries with amount and date</li>
            <li>Link to projects automatically</li>
            <li>Track payment status (Unbilled → Pending → Paid)</li>
            <li>Support multi-currency with exchange rates</li>
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
