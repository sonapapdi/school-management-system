'use client';

import { Clock, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import { KpiCard, MarkChip, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { sectionLabel, studentName } from '@/lib/erp/derive';
import { addDays, fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { CorrectionRequest } from '@/lib/erp/types';

export default function W12CorrectionRequests() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);

  const loading = useFakeLoad(350);

  if (!can(role, 'attendance', 'view')) return <PermissionState module="Attendance" />;

  const rows = [...data.corrections].sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  const weekAgo = addDays(schoolDate, -7);
  const pendingCount = rows.filter((c) => c.status === 'pending').length;
  const approvedRecent = rows.filter((c) => c.status === 'approved' && (c.resolvedAt ?? '') >= weekAgo).length;
  const rejectedCount = rows.filter((c) => c.status === 'rejected').length;
  const canDecide = can(role, 'attendance', 'approve');

  const titleFor = (c: CorrectionRequest) => `Correction ${c.no} — ${studentName(data, c.studentId)}`;

  return (
    <div>
      <PageHeader description="Office review of mark changes requested by class teachers after submission." />

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard label="Pending" value={pendingCount} sub="Awaiting office decision" icon={Clock} tone={pendingCount > 0 ? 'warning' : 'success'} />
            <KpiCard label="Approved (last 7 days)" value={approvedRecent} sub="Marks corrected in registers" icon={CheckCircle2} tone="success" />
            <KpiCard label="Rejected" value={rejectedCount} sub="Requests declined with reason" icon={XCircle} tone="danger" />
          </div>

          <div className="mt-5">
            <DataTable<CorrectionRequest>
              rows={rows}
              rowKey={(c) => c.id}
              searchable={(c) => `${c.no} ${studentName(data, c.studentId)} ${c.requestedBy} ${c.reason}`}
              searchPlaceholder="Search corrections…"
              filters={[
                {
                  key: 'status', label: 'Status',
                  options: [
                    { value: 'pending', label: 'Pending' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'rejected', label: 'Rejected' },
                  ],
                  match: (c, v) => c.status === v,
                },
              ]}
              emptyTitle="No correction requests"
              emptyDescription="Requests raised from a submitted register will appear here."
              columns={[
                { key: 'no', header: 'Request number', render: (c) => <span className="font-semibold text-ink">{c.no}</span>, sortValue: (c) => c.no },
                { key: 'date', header: 'Register date', render: (c) => fmtDate(c.date), sortValue: (c) => c.date },
                {
                  key: 'student', header: 'Student',
                  render: (c) => (
                    <div>
                      <p className="font-semibold text-ink">{studentName(data, c.studentId)}</p>
                      <p className="text-[11.5px] text-muted-foreground">{sectionLabel(data, c.sectionId)}</p>
                    </div>
                  ),
                  sortValue: (c) => studentName(data, c.studentId),
                },
                { key: 'from', header: 'Existing status', render: (c) => <MarkChip mark={c.from} /> },
                { key: 'to', header: 'Requested status', render: (c) => <MarkChip mark={c.to} /> },
                { key: 'reason', header: 'Reason', render: (c) => <span className="block max-w-[16rem] text-[12.5px]">{c.reason}</span>, hideBelow: 'lg' },
                { key: 'requestedBy', header: 'Requested by', render: (c) => c.requestedBy, hideBelow: 'md' },
                {
                  key: 'status', header: 'Status',
                  render: (c) => (
                    <div className="space-y-1">
                      <StatusChip status={c.status} />
                      {c.status !== 'pending' && c.resolutionNote && (
                        <p className="max-w-[11rem] text-[11px] text-muted-foreground">{c.resolutionNote}</p>
                      )}
                    </div>
                  ),
                  sortValue: (c) => c.status,
                },
                {
                  key: 'actions', header: '', align: 'right',
                  render: (c) => (
                    <div className="flex justify-end gap-1.5">
                      {c.status === 'pending' && canDecide && (
                        <>
                          <Button
                            size="sm" className="rounded-control"
                            onClick={() => openDialog('D23', { kind: 'correction', id: c.id, title: titleFor(c), requestedBy: c.requestedBy })}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm" variant="outline" className="rounded-control"
                            onClick={() => openDialog('D24', { kind: 'correction', id: c.id, title: titleFor(c), requestedBy: c.requestedBy })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm" variant="ghost" className="rounded-control"
                        onClick={() => nav('W11', { date: c.date, sectionId: c.sectionId })}
                      >
                        Open register
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
