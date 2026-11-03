'use client';

import { useState } from 'react';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DataTable, type Column } from '@/components/erp/ui/table';
import { Money, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { chargePaid, getStudent, studentName } from '@/lib/erp/derive';
import type { FeeRequest } from '@/lib/erp/types';
import { cn } from '@/lib/utils';
import { fmtDateTime, fmtINR, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

export default function W20Adjustments() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const loading = useFakeLoad(350);
  const [revOpen, setRevOpen] = useState(false);
  const [adjOpen, setAdjOpen] = useState(false);

  if (!can(role, 'fees', 'view')) return <PermissionState module="Fees" />;

  const canApprove = can(role, 'fees', 'approve');
  const canCreate = can(role, 'fees', 'create');

  const recentPayments = [...data.payments]
    .filter((p) => p.status === 'posted')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 12);
  const unpaidCharges = data.charges
    .filter((c) => c.status === 'posted' && c.amount - chargePaid(data, c.id) > 0)
    .slice(0, 12);

  const columns: Column<FeeRequest>[] = [
    {
      key: 'type',
      header: 'Request type',
      render: (r) => (
        <span
          className={cn(
            'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
            r.type === 'reversal' ? 'border-danger/20 bg-danger-soft text-danger' : 'border-amber/25 bg-amber-soft text-[#8a5a00]',
          )}
        >
          {r.type === 'reversal' ? <RotateCcw className="h-3 w-3" aria-hidden /> : <SlidersHorizontal className="h-3 w-3" aria-hidden />}
          {r.type === 'reversal' ? 'Reversal' : 'Adjustment'}
        </span>
      ),
      sortValue: (r) => r.type,
    },
    { key: 'originalRef', header: 'Original transaction', render: (r) => <span className="font-medium">{r.originalRef}</span> },
    {
      key: 'student',
      header: 'Student',
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{studentName(data, r.studentId)}</p>
          <p className="text-[11px] text-muted-foreground">{getStudent(data, r.studentId)?.admNo ?? '—'}</p>
        </div>
      ),
      sortValue: (r) => studentName(data, r.studentId),
    },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => <Money value={r.amount} />, sortValue: (r) => r.amount },
    {
      key: 'reason',
      header: 'Reason',
      hideBelow: 'md',
      render: (r) => <span className="line-clamp-2 block max-w-[240px] text-[12.5px] text-muted-foreground">{r.reason}</span>,
    },
    { key: 'requestedBy', header: 'Requested by', hideBelow: 'lg', render: (r) => r.requestedBy },
    { key: 'requestedAt', header: 'Requested at', render: (r) => fmtDateTime(r.requestedAt), sortValue: (r) => r.requestedAt },
    {
      key: 'status',
      header: 'Approval status',
      render: (r) => (
        <div className="flex flex-col items-start gap-1">
          <StatusChip status={r.status} />
          {r.reviewer && <span className="text-[11px] text-muted-foreground">by {r.reviewer}</span>}
        </div>
      ),
      sortValue: (r) => r.status,
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-control"
          disabled={!canApprove || r.status !== 'pending'}
          onClick={() => nav('W39', { kind: 'fee', id: r.id })}
        >
          Open approval
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Adjustments & reversals"
        description="Corrections to posted transactions. Posted records are never edited directly — every change needs an approver."
        actions={
          <>
            <Popover open={revOpen} onOpenChange={setRevOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-control" disabled={!canCreate}>
                  <RotateCcw className="h-4 w-4" aria-hidden /> Request reversal
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 rounded-card p-2">
                <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Pick a posted payment</p>
                <div className="erp-scroll max-h-72 overflow-y-auto">
                  {recentPayments.length === 0 && <p className="px-2 py-3 text-[13px] text-muted-foreground">No posted payments yet.</p>}
                  {recentPayments.map((p) => {
                    const rc = data.receipts.find((r) => r.paymentId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-muted"
                        onClick={() => {
                          setRevOpen(false);
                          openDialog('D21', { paymentId: p.id, receiptNo: rc?.no ?? p.id, amount: p.amount });
                        }}
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] font-semibold text-ink">{rc?.no ?? p.id}</span>
                          <span className="block truncate text-[11.5px] text-muted-foreground">
                            {studentName(data, p.studentId)} · {p.mode}
                          </span>
                        </span>
                        <Money value={p.amount} className="shrink-0 text-[12.5px]" />
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            <Popover open={adjOpen} onOpenChange={setAdjOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-control" disabled={!canCreate}>
                  <SlidersHorizontal className="h-4 w-4" aria-hidden /> Request adjustment
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 rounded-card p-2">
                <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Pick an unpaid charge</p>
                <div className="erp-scroll max-h-72 overflow-y-auto">
                  {unpaidCharges.length === 0 && <p className="px-2 py-3 text-[13px] text-muted-foreground">No unpaid charges found.</p>}
                  {unpaidCharges.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-muted"
                      onClick={() => {
                        setAdjOpen(false);
                        openDialog('D22', { chargeId: c.id, head: c.head, amount: c.amount });
                      }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink">{c.head}</span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">
                          {studentName(data, c.studentId)} · due {c.dueDate}
                        </span>
                      </span>
                      <Money value={c.amount} className="shrink-0 text-[12.5px]" />
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </>
        }
      />

      {!canCreate && (
        <p className="mb-3 rounded-card border border-line bg-muted/50 px-4 py-2.5 text-[12.5px] text-muted-foreground">
          Your role can review this queue but not raise new reversal or adjustment requests.
        </p>
      )}

      {loading ? (
        <SkeletonTable rows={6} cols={8} />
      ) : (
        <DataTable
          rows={data.feeRequests}
          columns={columns}
          rowKey={(r) => r.id}
          searchable={(r) => `${r.type} ${r.originalRef} ${studentName(data, r.studentId)} ${r.requestedBy} ${r.reason}`}
          filters={[
            {
              key: 'type',
              label: 'Type',
              options: [
                { value: 'reversal', label: 'Reversal' },
                { value: 'adjustment', label: 'Adjustment' },
              ],
              match: (r, v) => r.type === v,
            },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'pending', label: 'Pending review' },
                { value: 'approved', label: 'Approved' },
                { value: 'rejected', label: 'Rejected' },
              ],
              match: (r, v) => r.status === v,
            },
          ]}
          emptyTitle="No fee requests"
          emptyDescription={`Reversal and adjustment requests will appear here. Outstanding requests total ${fmtINR(data.feeRequests.filter((f) => f.status === 'pending').reduce((t, f) => t + f.amount, 0))}.`}
        />
      )}
    </div>
  );
}
