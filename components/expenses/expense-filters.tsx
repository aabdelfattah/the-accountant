'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Filter, X, Briefcase, Receipt, DollarSign, User } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { format } from 'date-fns';

type Project = {
  id: string;
  name: string;
};

type Freelancer = {
  id: string;
  name: string;
};

type ExpenseFiltersProps = {
  projects: Project[];
  freelancers: Freelancer[];
};

export function ExpenseFilters({ projects, freelancers }: ExpenseFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  // Initialize date range from URL params
  const initDateRange = (): DateRange | undefined => {
    const start = searchParams.get('startDate');
    const end = searchParams.get('endDate');
    if (start && end) {
      return {
        from: new Date(start),
        to: new Date(end),
      };
    }
    return undefined;
  };

  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initDateRange()
  );
  const [filters, setFilters] = useState({
    status: searchParams.get('status') || '',
    category: searchParams.get('category') || '',
    projectId: searchParams.get('projectId') || '',
    freelancerId: searchParams.get('freelancerId') || '',
  });

  const hasActiveFilters =
    dateRange ||
    filters.status ||
    filters.category ||
    filters.projectId ||
    filters.freelancerId;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
    }
    if (dateRange?.to) {
      params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
    }
    if (filters.status) params.set('status', filters.status);
    if (filters.category) params.set('category', filters.category);
    if (filters.projectId) params.set('projectId', filters.projectId);
    if (filters.freelancerId) params.set('freelancerId', filters.freelancerId);

    router.push(`/dashboard/expenses?${params.toString()}`);
    setOpen(false);
  };

  const clearFilters = () => {
    setDateRange(undefined);
    setFilters({
      status: '',
      category: '',
      projectId: '',
      freelancerId: '',
    });
    router.push('/dashboard/expenses');
    setOpen(false);
  };

  const removeFilter = (key: keyof typeof filters | 'dateRange') => {
    if (key === 'dateRange') {
      setDateRange(undefined);
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.projectId) params.set('projectId', filters.projectId);
      if (filters.freelancerId)
        params.set('freelancerId', filters.freelancerId);
      router.push(`/dashboard/expenses?${params.toString()}`);
      return;
    }

    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);

    const params = new URLSearchParams();
    if (dateRange?.from) {
      params.set('startDate', format(dateRange.from, 'yyyy-MM-dd'));
    }
    if (dateRange?.to) {
      params.set('endDate', format(dateRange.to, 'yyyy-MM-dd'));
    }
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    router.push(`/dashboard/expenses?${params.toString()}`);
  };

  const getFilterLabel = (key: keyof typeof filters, value: string) => {
    if (key === 'status') return value;
    if (key === 'category') return value;
    if (key === 'projectId') {
      const project = projects.find((p) => p.id === value);
      return project?.name || value;
    }
    if (key === 'freelancerId') {
      const freelancer = freelancers.find((f) => f.id === value);
      return freelancer?.name || value;
    }
    return value;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-8 border-dashed gap-1"
          >
            <Filter className="h-3.5 w-3.5" />
            Filter
            {hasActiveFilters && (
              <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-primary-foreground">
                {Object.values(filters).filter(Boolean).length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="start">
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-sm mb-3">Filter expenses</h4>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Date Range
              </label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={setDateRange}
                placeholder="Select date range"
                className="w-full"
              />
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" />
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Receipt className="h-3 w-3" />
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) =>
                  setFilters({ ...filters, category: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                <option value="COGS">COGS</option>
                <option value="SOFTWARE">Software</option>
                <option value="MARKETING">Marketing</option>
                <option value="OPERATIONS">Operations</option>
                <option value="PAYROLL">Payroll</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Project */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Briefcase className="h-3 w-3" />
                Project
              </label>
              <select
                value={filters.projectId}
                onChange={(e) =>
                  setFilters({ ...filters, projectId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Freelancer */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="h-3 w-3" />
                Freelancer
              </label>
              <select
                value={filters.freelancerId}
                onChange={(e) =>
                  setFilters({ ...filters, freelancerId: e.target.value })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="">All</option>
                {freelancers.map((freelancer) => (
                  <option key={freelancer.id} value={freelancer.id}>
                    {freelancer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex justify-between pt-2 border-t">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 text-xs"
              >
                Clear
              </Button>
              <Button size="sm" onClick={applyFilters} className="h-8 text-xs">
                Apply
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Active Filter Chips */}
      {dateRange && (
        <div className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium">
          {dateRange.from && format(dateRange.from, 'MMM d, yyyy')}
          {dateRange.to && ` - ${format(dateRange.to, 'MMM d, yyyy')}`}
          <button
            onClick={() => removeFilter('dateRange')}
            className="ml-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {Object.entries(filters).map(
        ([key, value]) =>
          value && (
            <div
              key={key}
              className="inline-flex items-center gap-1 h-8 px-2.5 rounded-md bg-secondary text-secondary-foreground text-xs font-medium"
            >
              {getFilterLabel(key as keyof typeof filters, value)}
              <button
                onClick={() => removeFilter(key as keyof typeof filters)}
                className="ml-1 rounded-sm opacity-70 hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )
      )}

      {/* Clear All */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 text-xs text-muted-foreground"
        >
          Clear all
        </Button>
      )}
    </div>
  );
}
