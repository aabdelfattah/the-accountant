'use client';

import { useState, ReactNode } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X, Pencil, Loader2 } from 'lucide-react';

export type ColumnType =
  | 'text'
  | 'date'
  | 'select'
  | 'number'
  | 'readonly'
  | 'custom';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  type?: ColumnType;
  editable?: boolean;
  selectOptions?: { value: string; label: string }[];
  render?: (row: T) => ReactNode;
  renderEdit?: (value: any, onChange: (value: any) => void) => ReactNode;
  className?: string;
  headerClassName?: string;
}

interface EditableTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onSave: (id: string, updatedData: Partial<T>) => Promise<void>;
  idKey?: keyof T;
  rowClassName?: (row: T, isEditing: boolean) => string;
  emptyMessage?: string;
}

export function EditableTable<T extends { id: string }>({
  data,
  columns,
  onSave,
  idKey = 'id' as keyof T,
  rowClassName,
  emptyMessage = 'No data available',
}: EditableTableProps<T>) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<T>>({});
  const [saving, setSaving] = useState(false);

  const handleEdit = (row: T) => {
    setEditingId(row[idKey] as string);
    setEditForm({ ...row });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSave = async () => {
    if (!editingId) return;

    setSaving(true);
    try {
      await onSave(editingId, editForm);
      handleCancel();
    } catch (error) {
      console.error('Failed to save:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (key: keyof T | string, value: any) => {
    setEditForm({ ...editForm, [key]: value });
  };

  const renderCell = (row: T, column: Column<T>, isEditing: boolean) => {
    const value = column.key in row ? row[column.key as keyof T] : null;

    // Custom render function takes precedence
    if (!isEditing && column.render) {
      return column.render(row);
    }

    // Editing mode
    if (isEditing && column.editable !== false) {
      // Custom edit render
      if (column.renderEdit) {
        return column.renderEdit(editForm[column.key as keyof T], (newValue) =>
          handleFieldChange(column.key, newValue)
        );
      }

      // Default edit controls based on type
      switch (column.type) {
        case 'select':
          return (
            <Select
              value={String(editForm[column.key as keyof T] || '')}
              onValueChange={(val) => handleFieldChange(column.key, val)}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {column.selectOptions?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );

        case 'date':
          return (
            <Input
              type="date"
              value={
                editForm[column.key as keyof T]
                  ? new Date(editForm[column.key as keyof T] as any)
                      .toISOString()
                      .split('T')[0]
                  : ''
              }
              onChange={(e) => handleFieldChange(column.key, e.target.value)}
              className="h-8"
            />
          );

        case 'number':
          return (
            <Input
              type="number"
              value={editForm[column.key as keyof T] as any}
              onChange={(e) =>
                handleFieldChange(column.key, parseFloat(e.target.value))
              }
              className="h-8"
            />
          );

        case 'text':
        default:
          return (
            <Input
              value={String(editForm[column.key as keyof T] || '')}
              onChange={(e) => handleFieldChange(column.key, e.target.value)}
              className="h-8"
            />
          );
      }
    }

    // Display mode
    if (column.render) {
      return column.render(row);
    }

    // Default display
    if (column.type === 'date' && value) {
      return new Date(value as any).toLocaleDateString();
    }

    return value !== null && value !== undefined ? String(value) : '—';
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columns.map((column, idx) => (
              <TableHead
                key={idx}
                className={`font-semibold ${column.width ? column.width : ''} ${column.headerClassName || ''}`}
              >
                {column.header}
              </TableHead>
            ))}
            <TableHead className="text-right font-semibold w-[140px]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const rowId = row[idKey] as string;
            const isEditing = editingId === rowId;
            const defaultClassName = isEditing
              ? 'bg-blue-50/50'
              : 'hover:bg-muted/50';
            const finalClassName = rowClassName
              ? rowClassName(row, isEditing)
              : defaultClassName;

            return (
              <TableRow key={rowId} className={finalClassName}>
                {columns.map((column, idx) => (
                  <TableCell key={idx} className={column.className || ''}>
                    {renderCell(row, column, isEditing)}
                  </TableCell>
                ))}
                <TableCell className="text-right">
                  {isEditing ? (
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSave}
                        disabled={saving}
                        className="h-8"
                      >
                        {saving ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Save className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleCancel}
                        disabled={saving}
                        className="h-8"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(row)}
                        className="h-8"
                      >
                        <Pencil className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
