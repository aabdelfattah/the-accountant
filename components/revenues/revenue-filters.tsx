'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Filter, X, Calendar, Briefcase, DollarSign } from 'lucide-react';

type Project = {
  id: string;
  name: string;
};

type RevenueFiltersProps = {
  projects: Project[];
};

export function RevenueFilters({ projects }: RevenueFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  const [filters, setFilters] = useState({
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    status: searchParams.get('status') || '',
    projectId: searchParams.get('projectId') || '',
  });

  const hasActiveFilters =
    filters.startDate || filters.endDate || filters.status || filters.projectId;

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.startDate) params.set('startDate', filters.startDate);
    if (filters.endDate) params.set('endDate', filters.endDate);
    if (filters.status) params.set('status', filters.status);
    if (filters.projectId) params.set('projectId', filters.projectId);

    router.push(`/dashboard/revenues?${params.toString()}`);
    setOpen(false);
  };

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      status: '',
      projectId: '',
    });
    router.push('/dashboard/revenues');
    setOpen(false);
  };

  const removeFilter = (key: keyof typeof filters) => {
    const newFilters = { ...filters, [key]: '' };
    setFilters(newFilters);

    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });

    router.push(`/dashboard/revenues?${params.toString()}`);
  };

  const getFilterLabel = (key: keyof typeof filters, value: string) => {
    if (key === 'startDate')
      return `From: ${new Date(value).toLocaleDateString()}`;
    if (key === 'endDate') return `To: ${new Date(value).toLocaleDateString()}`;
    if (key === 'status') return value;
    if (key === 'projectId') {
      const project = projects.find((p) => p.id === value);
      return project?.name || value;
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
              <h4 className="font-medium text-sm mb-3">Filter revenues</h4>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="h-3 w-3" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) =>
                    setFilters({ ...filters, startDate: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="Start"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) =>
                    setFilters({ ...filters, endDate: e.target.value })
                  }
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  placeholder="End"
                />
              </div>
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
                <option value="DELIVERED">Delivered</option>
                <option value="INVOICED">Invoiced</option>
                <option value="PAID">Paid</option>
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
