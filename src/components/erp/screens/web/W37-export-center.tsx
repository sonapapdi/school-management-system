'use client';

import { useEffect, useState } from 'react';
import { Download, Info, Loader2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { PageHeader, PermissionState, Section, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { downloadCsv, fmtDate, fmtDateTime, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { ExportJob } from '@/lib/erp/types';

const EXPORT_TYPES = ['Fee dues report', 'Collection report', 'Attendance summary', 'Student directory', 'Full school export'];

export default function W37ExportCenter() {
  const data = useErp((s) => s.data);
  const settings = useErp((s) => s.settings);
  const role = useErp((s) => s.session.role);
  const deleteExport = useErp((s) => s.deleteExport);
  const openDialog = useErp((s) => s.openDialog);
  const loading = useFakeLoad(350);

  const [newType, setNewType] = useState('');
  const [, setTick] = useState(0);

  /* Re-render every second while a job is running/queued so it flips to Ready */
  useEffect(() => {
    if (!data.exports.some((e) => e.status === 'running' || e.status === 'queued')) return;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [data.exports]);

  const rows = [...data.exports].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const canExport = can(role, 'reports', 'export');

  const download = (e: ExportJob) => {
    const cols = e.columns ?? ['Col'];
    const csvRows = e.rows && e.rows.length > 0 ? e.rows : [cols.map((_, i) => (i === 0 ? 'No data captured' : '—'))];
    downloadCsv(`${e.type}.csv`, cols, csvRows);
  };

  const columns: Column<ExportJob>[] = [
    { key: 'type', header: 'Export type', sortValue: (r) => r.type, render: (r) => <span className="font-semibold text-ink">{r.type}</span> },
    { key: 'requestedBy', header: 'Requested by', sortValue: (r) => r.requestedBy },
    { key: 'requestedAt', header: 'Requested at', sortValue: (r) => r.requestedAt, render: (r) => fmtDateTime(r.requestedAt) },
    {
      key: 'status', header: 'Status', sortValue: (r) => r.status,
      render: (r) => r.status === 'running' ? (
        <span className="inline-flex items-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" aria-hidden />
          <StatusChip status="Running" />
        </span>
      ) : (
        <StatusChip status={r.status} />
      ),
    },
    { key: 'expiresAt', header: 'Expires at', sortValue: (r) => r.expiresAt, render: (r) => fmtDate(r.expiresAt) },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status === 'ready' && (
            <Button variant="ghost" size="sm" className="h-7 rounded-control text-brand-dark hover:text-brand-dark" onClick={() => download(r)}>
              <Download className="h-3.5 w-3.5" aria-hidden /> Download
            </Button>
          )}
          {r.status === 'expired' && (
            <Button variant="ghost" size="sm" className="h-7 rounded-control text-danger hover:text-danger hover:bg-danger-soft" onClick={() => deleteExport(r.id)}>
              Delete expired copy
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!can(role, 'reports', 'view')) return <PermissionState module="Reports" />;

  return (
    <div>
      <PageHeader
        title="Export center"
        description="Requested CSV exports with status, expiry and downloads. Files are kept for a limited period."
      />

      <Section
        title="Exports"
        description={`${rows.length} export${rows.length === 1 ? '' : 's'} requested`}
        actions={
          canExport ? (
            <div className="flex items-center gap-2">
              <Select value={newType} onValueChange={setNewType}>
                <SelectTrigger className="h-9 w-52 rounded-control" aria-label="Export type">
                  <SelectValue placeholder="Choose export type…" />
                </SelectTrigger>
                <SelectContent>
                  {EXPORT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button
                className="rounded-control"
                disabled={!newType}
                onClick={() => { openDialog('D28', { type: newType }); setNewType(''); }}
              >
                <Plus className="h-4 w-4" aria-hidden /> Create export
              </Button>
            </div>
          ) : undefined
        }
        padded={false}
      >
        {loading ? (
          <div className="p-4"><SkeletonTable rows={5} cols={6} /></div>
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={8}
            emptyTitle="No exports yet"
            emptyDescription="Create an export and download the CSV file here once it is ready."
          />
        )}
      </Section>

      <div className="mt-4 flex items-start gap-2.5 rounded-card border border-line bg-card p-4 text-[13px] shadow-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" aria-hidden />
        <p className="text-muted-foreground">
          Files expire after <span className="font-semibold text-ink">{settings.exportRetentionDays} days</span>.
          Expired copies are removed from the list; request the export again if you need fresh data.
        </p>
      </div>
    </div>
  );
}
