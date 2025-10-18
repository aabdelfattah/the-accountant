import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { FileText, TrendingUp, DollarSign } from 'lucide-react';

export default async function ReportsPage() {
  const session = await auth();

  // Only accountants and admins can access this page
  if (session?.user.role !== 'ACCOUNTANT' && session?.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  const reports = [
    {
      title: 'Income Statement',
      description: 'Profit & Loss statement showing revenue and expenses',
      icon: TrendingUp,
    },
    {
      title: 'Balance Sheet',
      description: 'Assets, Liabilities, and Equity overview',
      icon: DollarSign,
    },
    {
      title: 'Trial Balance',
      description: 'Verify debits equal credits',
      icon: FileText,
    },
    {
      title: 'Cash Flow Statement',
      description: 'Track cash inflows and outflows',
      icon: DollarSign,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Financial Reports</h1>
        <p className="text-muted-foreground">Generate and view financial statements</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.title}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle>{report.title}</CardTitle>
                </div>
                <CardDescription>{report.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Coming Soon</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
