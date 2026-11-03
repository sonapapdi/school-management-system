'use client';

import { Ban, CheckCircle2, Download, ListFilter, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { EmptyState, InfoRow, KpiCard, PageHeader, PermissionState, Section, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { downloadCsv, fmtDateTime, useFakeLoad } from '@/lib/erp/utils';

const RESULT_STATUS: Record<'accepted' | 'conflict' | 'rejected', string> = {
  accepted: 'Ready to commit',
  conflict: 'Pending review',
  rejected: 'Failed',
};

export default function W09ImportReview() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const importId = params.importId ?? 'imp-002';
  const batch = data.imports.find((i) => i.id === importId);

  if (!can(role, 'students', 'view')) return <PermissionState module="Students" />;

  const canCreate = can(role, 'students', 'create');

  if (!batch) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          title="Import batch not found"
          description="The batch may have been discarded. Open another batch from the upload screen."
          action={<Button className="rounded-control" onClick={() => nav('W08')}>Open import upload</Button>}
        />
      </div>
    );
  }

  const rows = batch.rows;
  const accepted = rows.filter((r) => r.result === 'accepted');
  const conflicts = rows.filter((r) => r.result === 'conflict');
  const rejected = rows.filter((r) => r.result === 'rejected');
  const commitable = batch.status === 'ready' || batch.status === 'partial';

  const sourceCompact = (r: (typeof rows)[number]) => {
    const v = r.values;
    return `${v['First name'] ?? '—'} ${v['Last name'] ?? ''} · ${v['Grade'] ?? '—'}-${v['Section'] ?? '—'} · DOB ${v['Date of birth'] ?? '—'}`;
  };

  const columns: Column<(typeof rows)[number]>[] = [
    { key: 'n', header: 'Row', render: (r) => <span className="font-mono tabular-nums text-muted-foreground">{r.n}</span>, sortValue: (r) => r.n },
    { key: 'src', header: 'Source value', render: (r) => <span className="text-[12.5px] font-medium text-ink">{sourceCompact(r)}</span>, sortValue: (r) => sourceCompact(r) },
    { key: 'match', header: 'Matched record', render: (r) => (r.match ? <span className="text-[12.5px] font-medium text-[#8a5a00]">{r.match}</span> : '—'), sortValue: (r) => r.match ?? '' },
    { key: 'result', header: 'Result', render: (r) => <StatusChip status={RESULT_STATUS[r.result]} />, sortValue: (r) => r.result },
    { key: 'error', header: 'Error reason', render: (r) => (r.error ? <span className="text-[12.5px] text-danger">{r.error}</span> : '—'), sortValue: (r) => r.error ?? '', hideBelow: 'md' },
  ];

  const downloadErrors = () => {
    if (rejected.length === 0) return;
    const keys = Object.keys(rejected[0].values);
    downloadCsv(
      `import_errors_${batch.id}.csv`,
      [...keys, 'Error reason'],
      rejected.map((r) => [...keys.map((k) => r.values[k] ?? ''), r.error ?? '']),
    );
  };

  return (
    <div>
      <PageHeader
        title="Import review & results"
        description={`${batch.fileName} — check accepted, conflicting and rejected rows before committing.`}
        actions={
          <>
            <Button variant="outline" className="rounded-control" onClick={() => pushToast({ title: 'Mapping editor is simplified in this prototype — adjust the CSV and re-upload', variant: 'info' })}>
              <ListFilter className="h-4 w-4" aria-hidden /> Fix mapping
            </Button>
            <Button variant="outline" className="rounded-control" disabled={rejected.length === 0} onClick={downloadErrors}>
              <Download className="h-4 w-4" aria-hidden /> Download errors
            </Button>
            {canCreate && (
              <Button
                className="rounded-control"
                disabled={!commitable}
                onClick={() => openDialog('D12', { importId: batch.id, accepted: accepted.length })}
              >
                Commit accepted rows
              </Button>
            )}
            {canCreate && (
              <Button variant="outline" className="rounded-control bg-danger text-white hover:bg-danger/90" onClick={() => openDialog('D13', { importId: batch.id })}>
                <Trash2 className="h-4 w-4" aria-hidden /> Discard batch
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-3">
            <Section title="Batch" description="Upload details" className="lg:col-span-1">
              <InfoRow label="File" value={<span className="font-mono text-[12.5px]">{batch.fileName}</span>} />
              <InfoRow label="Type" value={batch.type} />
              <InfoRow label="Status" value={<StatusChip status={batch.status} />} />
              <InfoRow label="Duplicate strategy" value={batch.duplicateStrategy === 'skip' ? 'Skip duplicates' : 'Update existing'} />
              <InfoRow label="Uploaded by" value={batch.uploadedBy} />
              <InfoRow label="Uploaded at" value={fmtDateTime(batch.uploadedAt)} />
            </Section>

            <div className="grid grid-cols-2 gap-3 lg:col-span-2">
              <KpiCard label="Accepted" value={accepted.length} sub="Ready to commit" tone="success" icon={CheckCircle2} />
              <KpiCard label="Conflicting" value={conflicts.length} sub="Match an existing record" tone="warning" icon={ListFilter} />
              <KpiCard label="Rejected" value={rejected.length} sub="Fix in the CSV and re-upload" tone="danger" icon={Ban} />
              <KpiCard label="Total rows" value={rows.length} sub={`${batch.headerRow ? 'Header row included' : 'No header row'}`} />
            </div>
          </div>

          {batch.status === 'committed' && (
            <div className="mt-4 flex items-center gap-2 rounded-card border border-success/25 bg-success-soft p-3.5 text-[13px] font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Import committed — {accepted.length} students added.
            </div>
          )}

          {canCreate && !commitable && batch.status !== 'committed' && (
            <p className="mt-4 text-[12px] text-muted-foreground">
              Commit is available once validation marks the batch ready or partially accepted.
            </p>
          )}

          <h2 className="mb-3 mt-6 font-heading text-[15px] font-bold text-ink">Rows</h2>
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => String(r.n)}
            searchable={(r) => `${sourceCompact(r)} ${r.match ?? ''} ${r.error ?? ''}`}
            searchPlaceholder="Search rows…"
            pageSize={10}
            emptyTitle="No rows in this batch"
            emptyDescription="The uploaded file had no data rows."
          />
        </>
      )}
    </div>
  );
}
