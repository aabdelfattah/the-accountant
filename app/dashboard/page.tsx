import { auth } from '@/auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { BookOpen, FolderKanban, Receipt, DollarSign } from 'lucide-react';

export default async function DashboardPage() {
  const session = await auth();

  const dashboardCards = [
    {
      title: 'Projects',
      description: 'Manage your projects',
      icon: FolderKanban,
      href: '/dashboard/client-accounts',
      roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
    },
    {
      title: 'Revenues',
      description: 'Track project income',
      icon: DollarSign,
      href: '/dashboard/revenues',
      roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
    },
    {
      title: 'Expenses',
      description: 'Record business expenses',
      icon: Receipt,
      href: '/dashboard/expenses',
      roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
    },
    {
      title: 'Journal Entries',
      description: 'Review accounting entries',
      icon: BookOpen,
      href: '/dashboard/journal',
      roles: ['ACCOUNTANT', 'ADMIN'],
    },
  ];

  const allowedCards = dashboardCards.filter((card) =>
    card.roles.includes(session!.user.role)
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your accounting system
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {allowedCards.map((card) => {
          const Icon = card.icon;
          return (
            <a key={card.href} href={card.href}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <CardDescription>{card.description}</CardDescription>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {session?.user.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Functions</CardTitle>
            <CardDescription>
              Administrative tools and user management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a
              href="/dashboard/admin/users"
              className="text-primary hover:underline"
            >
              Manage Users →
            </a>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
