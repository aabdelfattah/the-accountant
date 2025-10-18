import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function JournalPage() {
  const session = await auth();

  // Only accountants and admins can access this page
  if (session?.user.role !== 'ACCOUNTANT' && session?.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Journal Entries</h1>
        <p className="text-muted-foreground">View and manage accounting journal entries</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming Soon</CardTitle>
          <CardDescription>Journal entries interface will be implemented here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            This page will allow you to:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground list-disc list-inside">
            <li>View all journal entries (auto-generated and manual)</li>
            <li>Filter by date range, source, account</li>
            <li>See debits and credits for each entry</li>
            <li>Create manual journal entries for adjustments</li>
            <li>Reverse entries if needed</li>
            <li>Export to Excel/CSV</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
