import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { RevenueForm } from '@/components/revenues/revenue-form';

export default async function NewRevenuePage({
  searchParams,
}: {
  searchParams: { projectId?: string };
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  // Fetch projects for the dropdown
  const projects = await prisma.project.findMany({
    where: {
      status: {
        not: 'ARCHIVED',
      },
      // Non-admin users can only see their own projects
      ...(session.user.role !== 'ADMIN' ? { userId: session.user.id } : {}),
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href={
            searchParams.projectId
              ? `/dashboard/client-accounts/${searchParams.projectId}`
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

      <RevenueForm
        projects={projects}
        defaultProjectId={searchParams.projectId}
      />
    </div>
  );
}
