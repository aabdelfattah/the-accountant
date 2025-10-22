import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default async function ChartOfAccountsPage() {
  const session = await auth();

  // Only accountants and admins can access this page
  if (session?.user.role !== 'ACCOUNTANT' && session?.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all accounts
  const accounts = await prisma.chartOfAccount.findMany({
    orderBy: {
      code: 'asc',
    },
    include: {
      parent: true,
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Chart of Accounts</h1>
          <p className="text-muted-foreground">
            Manage your accounting accounts
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Account
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Accounts ({accounts.length})</CardTitle>
          <CardDescription>
            View and manage your chart of accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-mono">{account.code}</TableCell>
                  <TableCell
                    className={account.parentId ? 'pl-8' : 'font-medium'}
                  >
                    {account.name}
                  </TableCell>
                  <TableCell>
                    <span className="rounded-full bg-muted px-2 py-1 text-xs">
                      {account.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {account.parent ? account.parent.code : '-'}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    ${account.currentBalance.toString()}
                  </TableCell>
                  <TableCell>
                    {account.active ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Inactive</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
