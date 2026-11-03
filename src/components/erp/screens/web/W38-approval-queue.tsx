'use client';

import { useMemo } from 'react';
import { Clock, FileCheck, Stamp, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { KpiCard, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { approvalQueue } from '@/lib/erp/derive';
import type { ApprovalItem } from '@/lib/erp/derive';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { cn } from '@/lib/utils';

const KIND_META: Record<ApprovalItem['kind'], { label: string; cls: string }> = {
  attendance_correction: { label: 'Attendance correction', cls: 'bg-brand/10 text-brand-dark border-brand/20' },
  fee_reversal: { label: 'Payment reversal', cls: 'bg-amber-soft text-[#8a5a00] border-amber/25' },
  fee_adjustment: { label: 'Fee adjustment', cls: 'bg-teal-soft text-teal border-teal/20' },
};

export default function W38ApprovalQueue() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const addAuditEvent = useErp((s) => s.addAuditEvent);
  const loading = useFakeLoad(350);

  const queue = useMemo(() => approvalQueue(data, schoolDate), [data, schoolDate]);
  const oldest = queue.reduce((m, q) => Math.max(m, q.ageDays), 0);
  const feeAwaiting = data.feeRequests.filter((f) => f.status === 'pending').length;

  const assignReviewer = () => {
    pushToast({ title: 'Reviewer assigned: Meera Kulkarni', variant: 'success' });
    addAuditEvent('Assigned reviewer', 'Approval', queue[0]?.id ?? '—');
  };

  const columns: Column<ApprovalItem>[] = [
    {
      key: 'kind', header: 'Request type', sortValue: (r) => r.kind,
      render: (r) => (
        <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap', KIND_META[r.kind].cls)}>
          {KIND_META[r.kind].label}
        </span>
      ),
    },
    { key: 'requestedBy', header: 'Requested by', sortValue: (r) => r.requestedBy },
    { key: 'date', header: 'School date', sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: 'amountOrStudent', header: 'Amount / student', sortValue: (r) => r.amountOrStudent },
    {
      key: 'ageDays', header: 'Age', align: 'right', sortValue: (r) => r.ageDays,
      render: (r) => (
        <span className={cn('font-semibold tabular-nums', r.ageDays > 3 ? 'text-danger' : 'text-ink-soft')}>
          {r.ageDays} day{r.ageDays === 1 ? '' : 's'}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: () => <StatusChip status="pending" /> },
    {
      key: 'actions', header: '', align: 'right',
      render: (r) => (
        <Button
          variant="ghost" size="sm"
          className="h-7 rounded-control text-brand-dark hover:text-brand-dark"
          onClick={() => nav('W39', { kind: r.kind === 'attendance_correction' ? 'correction' : 'fee', id: r.id })}
        >
          Open request
        </Button>
      ),
    },
  ];

  if (!can(role, 'approvals', 'view')) return <PermissionState module="Approvals" />;

  return (
    <div>
      <PageHeader
        title="Approval queue"
        description="Attendance corrections and fee reversals or adjustments awaiting a decision."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Pending total" value={queue.length} sub="All request types" icon={Stamp} tone={queue.length ? 'warning' : 'success'} />
        <KpiCard label="Oldest request age" value={`${oldest} day${oldest === 1 ? '' : 's'}`} sub={oldest > 3 ? 'Past the 3-day target' : 'Within the 3-day target'} icon={Clock} tone={oldest > 3 ? 'danger' : 'default'} />
        <KpiCard label="Fee approvals awaiting" value={feeAwaiting} sub="Reversals & adjustments" icon={FileCheck} tone={feeAwaiting ? 'warning' : 'success'} />
        <KpiCard label="Corrections awaiting" value={queue.filter((q) => q.kind === 'attendance_correction').length} sub="Attendance register fixes" icon={UserCheck} />
      </div>

      <div className="mt-5">
        {loading ? (
          <SkeletonTable rows={5} cols={7} />
        ) : (
          <DataTable
            rows={queue}
            columns={columns}
            rowKey={(r) => r.id}
            searchable={(r) => `${r.title} ${r.requestedBy} ${r.amountOrStudent} ${r.ref}`}
            searchPlaceholder="Search requests…"
            filters={[
              {
                key: 'kind',
                label: 'request type',
                options: [
                  { value: 'attendance_correction', label: 'Attendance correction' },
                  { value: 'fee_reversal', label: 'Payment reversal' },
                  { value: 'fee_adjustment', label: 'Fee adjustment' },
                ],
                match: (r, v) => r.kind === v,
              },
            ]}
            toolbar={
              <Button variant="outline" className="rounded-control" onClick={assignReviewer} disabled={queue.length === 0}>
                <UserCheck className="h-4 w-4" aria-hidden /> Assign reviewer
              </Button>
            }
            emptyTitle="Nothing to approve"
            emptyDescription="New correction and fee requests will appear here."
          />
        )}
      </div>
    </div>
  );
}
