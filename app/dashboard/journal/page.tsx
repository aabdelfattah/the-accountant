import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { getAllLedgerEntries } from '@/lib/medici/book';
import { formatDistanceToNow } from 'date-fns';

export default async function JournalPage() {
  const session = await auth();

  // Only accountants and admins can access this page
  if (session?.user.role !== 'ACCOUNTANT' && session?.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch all journal entries from Medici
  const entries = await getAllLedgerEntries();

  // Group by journal entry
  type JournalEntry = {
    id: string;
    date: Date;
    memo: string;
    lines: Array<{ account: string; debit: number; credit: number }>;
  };

  type MediciTransaction = {
    _id: string;
    memo: string;
    datetime: Date;
    account_path: string[];
    credit?: number;
    debit?: number;
    book: string;
    approved: boolean;
    timestamp: Date;
    voided: boolean;
    void_reason?: string;
  };

  const journalMap = new Map<string, JournalEntry>();

  entries.forEach((entry: unknown) => {
    const transaction = entry as MediciTransaction;

    // Use memo + datetime as grouping key since we don't have direct journal ID
    const key = `${transaction.memo}_${new Date(transaction.datetime).getTime()}`;

    if (!journalMap.has(key)) {
      journalMap.set(key, {
        id: key,
        date: new Date(transaction.datetime),
        memo: transaction.memo,
        lines: [],
      });
    }

    journalMap.get(key)!.lines.push({
      account: transaction.account_path.join(':'),
      debit: transaction.debit || 0,
      credit: transaction.credit || 0,
    });
  });

  const sortedEntries = Array.from(journalMap.values()).sort(
    (a, b) => b.date.getTime() - a.date.getTime()
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Journal Entries</h1>
        <p className="text-muted-foreground">
          View accounting journal entries ({sortedEntries.length} total)
        </p>
      </div>

      <div className="space-y-4">
        {sortedEntries.map((entry) => (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{entry.memo}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(entry.date).toLocaleDateString()} •{' '}
                    {formatDistanceToNow(new Date(entry.date), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {entry.id.substring(0, 8)}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead className="text-right">Debit</TableHead>
                    <TableHead className="text-right">Credit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entry.lines.map((line, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {line.account}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.debit > 0
                          ? `$${line.debit.toLocaleString()}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-right">
                        {line.credit > 0
                          ? `$${line.credit.toLocaleString()}`
                          : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-semibold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      $
                      {entry.lines
                        .reduce((sum: number, l) => sum + l.debit, 0)
                        .toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      $
                      {entry.lines
                        .reduce((sum: number, l) => sum + l.credit, 0)
                        .toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}

        {sortedEntries.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No journal entries found. Run the seed script to create sample
              entries.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
