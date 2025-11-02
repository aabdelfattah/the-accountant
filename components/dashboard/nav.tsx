'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FolderKanban,
  BookOpen,
  FileText,
  Settings,
  Users,
  DollarSign,
  Wallet,
  type LucideIcon,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'Projects',
    href: '/dashboard/projects',
    icon: FolderKanban,
    roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'Revenue',
    href: '/dashboard/revenues',
    icon: DollarSign,
    roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'Expenses',
    href: '/dashboard/expenses',
    icon: Wallet,
    roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'Journal Entries',
    href: '/dashboard/journal',
    icon: BookOpen,
    roles: ['ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'Chart of Accounts',
    href: '/dashboard/accounts',
    icon: FileText,
    roles: ['ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'Reports',
    href: '/dashboard/reports',
    icon: FileText,
    roles: ['ACCOUNTANT', 'ADMIN'],
  },
  {
    title: 'User Management',
    href: '/dashboard/admin/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    title: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['USER', 'ACCOUNTANT', 'ADMIN'],
  },
];

interface DashboardNavProps {
  user: {
    role: string;
  };
}

export function DashboardNav({ user }: DashboardNavProps) {
  const pathname = usePathname();

  const filteredItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  return (
    <nav className="space-y-1 p-4">
      {filteredItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
}
