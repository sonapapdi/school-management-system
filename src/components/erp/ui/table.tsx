'use client';

import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { SearchInput, EmptyState } from './primitives';

export interface Column<T> {
  key: string;
  header: ReactNode;
  render?: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  align?: 'left' | 'right' | 'center';
  className?: string;
  hideBelow?: 'sm' | 'md' | 'lg';
}

export interface TableFilter<T> {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
}

export function DataTable<T>({
  rows, columns, rowKey, searchable, searchPlaceholder = 'Search…',
  filters, pageSize = 10, onRowClick, toolbar, emptyTitle = 'No records found',
  emptyDescription, emptyAction, dense, footer,
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  searchable?: (row: T) => string;
  searchPlaceholder?: string;
  filters?: TableFilter<T>[];
  pageSize?: number;
  onRowClick?: (row: T) => void;
  toolbar?: ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  dense?: boolean;
  footer?: ReactNode;
}) {
  const [query, setQuery] = useState('');
  const [filterVals, setFilterVals] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [page, setPage] = useState(1);

  const processed = useMemo(() => {
    let out = [...rows];
    if (query.trim() && searchable) {
      const q = query.trim().toLowerCase();
      out = out.filter((r) => searchable(r).toLowerCase().includes(q));
    }
    for (const f of filters ?? []) {
      const v = filterVals[f.key];
      if (v && v !== 'all') out = out.filter((r) => f.match(r, v));
    }
    if (sort) {
      const col = columns.find((c) => c.key === sort.key);
      if (col?.sortValue) {
        out.sort((a, b) => {
          const va = col.sortValue!(a);
          const vb = col.sortValue!(b);
          const cmp = typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb));
          return sort.dir === 'asc' ? cmp : -cmp;
        });
      }
    }
    return out;
  }, [rows, query, filterVals, sort, columns, filters, searchable]);

  const totalPages = Math.max(1, Math.ceil(processed.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = processed.slice((safePage - 1) * pageSize, safePage * pageSize);

  const toggleSort = (col: Column<T>) => {
    if (!col.sortValue) return;
    setSort((s) => (s?.key === col.key ? { key: col.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: col.key, dir: 'asc' }));
  };

  const hasToolbar = searchable || (filters && filters.length > 0) || toolbar;

  return (
    <div className="overflow-hidden rounded-card border border-line bg-card shadow-sm">
      {hasToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-3">
          {searchable && (
            <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder={searchPlaceholder} className="w-full sm:w-64" />
          )}
          {(filters ?? []).map((f) => (
            <Select
              key={f.key}
              value={filterVals[f.key] ?? 'all'}
              onValueChange={(v) => { setFilterVals((prev) => ({ ...prev, [f.key]: v })); setPage(1); }}
            >
              <SelectTrigger className="h-9 w-full rounded-control sm:w-40" aria-label={f.label}>
                <SelectValue placeholder={f.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All {f.label.toLowerCase()}</SelectItem>
                {f.options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ))}
          <div className="ml-auto flex items-center gap-2">{toolbar}</div>
        </div>
      )}

      {pageRows.length === 0 ? (
        <div className="p-4">
          <EmptyState title={emptyTitle} description={emptyDescription ?? 'Try changing search or filters.'} action={emptyAction} />
        </div>
      ) : (
        <div className="erp-scroll overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-[#FAFBFE]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    scope="col"
                    className={cn(
                      'sticky top-0 z-10 whitespace-nowrap bg-[#FAFBFE] px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground',
                      col.align === 'right' && 'text-right',
                      col.align === 'center' && 'text-center',
                      col.sortValue && 'cursor-pointer select-none hover:text-ink',
                      col.hideBelow === 'sm' && 'hidden sm:table-cell',
                      col.hideBelow === 'md' && 'hidden md:table-cell',
                      col.hideBelow === 'lg' && 'hidden lg:table-cell',
                      col.className,
                    )}
                    onClick={() => toggleSort(col)}
                    aria-sort={sort?.key === col.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.header}
                      {col.sortValue && (sort?.key === col.key
                        ? (sort.dir === 'asc' ? <ChevronUp className="h-3 w-3" aria-hidden /> : <ChevronDown className="h-3 w-3" aria-hidden />)
                        : <ChevronsUpDown className="h-3 w-3 opacity-40" aria-hidden />)}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, i) => (
                <tr
                  key={rowKey(row)}
                  className={cn(
                    'border-b border-line/60 last:border-0 transition-colors hover:bg-[#F5F6FC]',
                    onRowClick && 'cursor-pointer',
                  )}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-3 text-ink-soft',
                        dense ? 'py-2' : 'py-2.5',
                        col.align === 'right' && 'text-right',
                        col.align === 'center' && 'text-center',
                        col.hideBelow === 'sm' && 'hidden sm:table-cell',
                        col.hideBelow === 'md' && 'hidden md:table-cell',
                        col.hideBelow === 'lg' && 'hidden lg:table-cell',
                        col.className,
                      )}
                    >
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-3 py-2.5 text-[12px] text-muted-foreground">
        <span>
          {processed.length} record{processed.length === 1 ? '' : 's'}
          {processed.length > 0 && ` · showing ${(safePage - 1) * pageSize + 1}–${Math.min(safePage * pageSize, processed.length)}`}
        </span>
        <div className="flex items-center gap-1.5">
          {footer}
          <Button
            variant="outline" size="sm" className="h-7 rounded-control px-2"
            disabled={safePage <= 1}
            onClick={() => setPage(safePage - 1)}
            aria-label="Previous page"
          >
            Prev
          </Button>
          <span className="min-w-14 text-center font-semibold text-ink-soft">{safePage} / {totalPages}</span>
          <Button
            variant="outline" size="sm" className="h-7 rounded-control px-2"
            disabled={safePage >= totalPages}
            onClick={() => setPage(safePage + 1)}
            aria-label="Next page"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
