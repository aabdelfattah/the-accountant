import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardNav } from '@/components/dashboard/nav';
import { UserNav } from '@/components/dashboard/user-nav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/20">
        <div className="flex h-16 items-center border-b px-6">
          <h1 className="text-xl font-bold">The Accountant</h1>
        </div>
        <DashboardNav user={session.user} />
      </aside>

      {/* Main Content */}
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">
              Welcome, {session.user.name}
            </h2>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              {session.user.role}
            </span>
          </div>
          <UserNav user={session.user} />
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
