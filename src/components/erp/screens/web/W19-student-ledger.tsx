'use client';

import { useState } from 'react';
import {
  AlertTriangle, ArrowDownLeft, ArrowUpRight, ClipboardList, Download, Printer, RotateCcw,
  SlidersHorizontal, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/erp/ui/table';
import {
  EmptyState, InfoRow, KpiCard, Money, PageHeader, PermissionState, SearchInput, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import {
  activeEnrollmentOf, activeStudents, duesFor, getStudent, ledgerFor, sectionLabel, studentName,
} from '@/lib/erp/derive';
import type { LedgerRow } from '@/lib/erp/derive';
import { cn } from '@/lib/utils';
import { downloadCsv, fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

const TYPE_ICON = {
  Charge: ArrowUpRight,
  Payment: ArrowDownLeft,
  Reversal: RotateCcw,
  Adjustment: SlidersHorizontal,
} as const;

const TYPE_CLS: Record<LedgerRow['type'], string> = {
  Charge: 'bg-muted text-ink-soft',
  Payment: 'bg-success-soft text-success',
  Reversal: 'bg-danger-soft text-danger',
  Adjustment: 'bg-amber-soft text-[#8a5a00]',
};

export default function W19StudentLedger() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const params = useErp((s) => s.route.params);
  const schoolDate = useErp((s) => s.schoolDate);
  const ayId = useErp((s) => s.ayId);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const loading = useFakeLoad(350);
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!can(role, 'fees', 'view')) return <PermissionState module="Fees" />;

  const studentId = params.studentId ?? 'stu-ananya';
  const student = getStudent(data, studentId);
  const enrollment = activeEnrollmentOf(data, studentId, ayId);
  const dues = duesFor(data, studentId, schoolDate);
  const rows = ledgerFor(data, studentId);
  const selected: LedgerRow | null = rows.find((r) => r.id === selectedId) ?? null;
  const canCreate = can(role, 'fees', 'create');

  const selectedPayment =
    selected && (selected.type === 'Payment' || selected.type === 'Reversal')
      ? data.payments.find((p) => p.id === selected.id)
      : undefined;
  const selectedReceipt = selectedPayment
    ? data.receipts.find((r) => r.paymentId === selectedPayment.id)
    : undefined;
  const selectedCharge = selected?.type === 'Charge' ? data.charges.find((c) => c.id === selected.id) : undefined;

  const matches = activeStudents(data)
    .filter((s) => `${s.displayName} ${s.admNo}`.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 6);

  const columns: Column<LedgerRow>[] = [
    { key: 'date', header: 'Date', render: (r) => fmtDate(r.date), sortValue: (r) => r.date },
    {
      key: 'type',
      header: 'Entry type',
      render: (r) => {
        const Icon = TYPE_ICON[r.type];
        return (
          <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
            <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', TYPE_CLS[r.type])}>
              <Icon className="h-3.5 w-3.5" aria-hidden />
            </span>
            {r.type}
          </span>
        );
      },
      sortValue: (r) => r.type,
    },
    { key: 'ref', header: 'Reference', render: (r) => <span className="block max-w-[220px] truncate font-medium">{r.ref}</span> },
    {
      key: 'debit', header: 'Debit', align: 'right',
      render: (r) => (r.debit ? <Money value={r.debit} /> : <span className="text-muted-foreground">—</span>),
      sortValue: (r) => r.debit,
    },
    {
      key: 'credit', header: 'Credit', align: 'right',
      render: (r) => (r.credit ? <Money value={r.credit} className="text-success" /> : <span className="text-muted-foreground">—</span>),
      sortValue: (r) => r.credit,
    },
    { key: 'balance', header: 'Balance', align: 'right', render: (r) => <Money value={r.balance} />, sortValue: (r) => r.balance },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.status} /> },
  ];

  const exportLedger = () => {
    downloadCsv(
      `ledger-${student?.admNo ?? studentId}.csv`,
      ['Date', 'Entry type', 'Reference', 'Debit', 'Credit', 'Balance', 'Status'],
      rows.map((r) => [r.date, r.type, r.ref, String(r.debit), String(r.credit), String(r.balance), r.status]),
    );
  };

  return (
    <div>
      <PageHeader
        title={student ? `Ledger — ${student.displayName}` : 'Student ledger'}
        description={student ? `${student.admNo} · Charges, payments, reversals and running balance.` : 'Charges, payments, reversals and running balance.'}
        actions={
          <>
            <Button variant="outline" className="rounded-control" onClick={exportLedger}>
              <Download className="h-4 w-4" aria-hidden /> Export ledger
            </Button>
            <Button variant="outline" className="rounded-control" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden /> Print statement
            </Button>
          </>
        }
      />

      {/* Student picker */}
      <Card className="mb-4 rounded-card border-line bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-[13px] font-bold text-brand-dark">
              {student?.displayName.split(' ').map((p) => p[0]).slice(0, 2).join('') ?? '—'}
            </span>
            <div className="min-w-0">
              <p className="truncate font-heading text-[14.5px] font-bold text-ink">{student?.displayName ?? 'Select a student'}</p>
              <p className="truncate text-[12px] text-muted-foreground">
                {student?.admNo ?? '—'} · {enrollment ? sectionLabel(data, enrollment.sectionId) : '—'}
              </p>
            </div>
          </div>
          <div className="relative w-full sm:w-80">
            <SearchInput value={query} onChange={setQuery} placeholder="Find student by name or admission no…" />
            {query.trim().length > 0 && (
              <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-card border border-line bg-card shadow-lg">
                {matches.length === 0 ? (
                  <p className="px-3 py-3 text-[13px] text-muted-foreground">No active students match “{query.trim()}”.</p>
                ) : (
                  matches.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between gap-2 px-3 py-2 text-left hover:bg-muted',
                        m.id === studentId && 'bg-brand/5',
                      )}
                      onClick={() => { nav('W19', { studentId: m.id }); setQuery(''); setSelectedId(null); }}
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[13px] font-semibold text-ink">{m.displayName}</span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">{m.admNo}</span>
                      </span>
                      <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">{fmtDate(duesFor(data, m.id, schoolDate).nextDueDate)}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="print-area space-y-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <KpiCard label="Total charged" value={<Money value={dues.totalCharges} />} sub="Posted fee charges" icon={ClipboardList} />
              <KpiCard label="Total paid" value={<Money value={dues.paid} className="text-success" />} sub="Receipts minus reversals" icon={Wallet} tone="success" />
              <KpiCard
                label="Outstanding balance"
                value={<Money value={dues.due} className={dues.due > 0 ? 'text-danger' : 'text-success'} />}
                sub={dues.nextDueDate ? `Next due ${fmtDate(dues.nextDueDate)}` : 'Nothing pending'}
                icon={AlertTriangle}
                tone={dues.due > 0 ? 'danger' : 'success'}
              />
            </div>
            {loading ? (
              <SkeletonTable rows={8} cols={7} />
            ) : (
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(r) => r.id}
                searchable={(r) => `${r.date} ${r.type} ${r.ref} ${r.status}`}
                onRowClick={(r) => setSelectedId(r.id === selectedId ? null : r.id)}
                emptyTitle="No ledger entries"
                emptyDescription="Charges and payments for this student will appear here."
                pageSize={10}
              />
            )}
          </div>
        </div>

        {/* Detail side panel */}
        <aside className="space-y-4">
          <Card className="rounded-card border-line bg-card p-4 shadow-sm">
            <h2 className="mb-1 font-heading text-[15px] font-bold text-ink">Entry detail</h2>
            {!selected ? (
              <EmptyState
                title="No entry selected"
                description="Click a ledger row to see its payment or charge detail."
                className="border-0 bg-transparent px-2 py-8"
              />
            ) : selectedPayment ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-heading text-[14px] font-bold text-ink">{selectedReceipt?.no ?? selected.ref}</span>
                  <StatusChip status={selected.status} />
                </div>
                <InfoRow label="Date" value={fmtDate(selectedPayment.date)} />
                <InfoRow label="Amount" value={<Money value={selectedPayment.amount} />} mono />
                <InfoRow label="Mode" value={selectedPayment.mode} />
                <InfoRow label="Reference" value={selectedPayment.reference ?? '—'} mono />
                <InfoRow
                  label="Allocations"
                  value={
                    selectedPayment.allocations.length > 0 ? (
                      <span className="flex flex-col items-end gap-0.5">
                        {selectedPayment.allocations.map((a, i) => (
                          <span key={i} className="text-[12.5px]">
                            {data.charges.find((c) => c.id === a.chargeId)?.head ?? 'Charge'} ·{' '}
                            <span className="tabular-nums">{a.amount.toLocaleString('en-IN')}</span>
                          </span>
                        ))}
                      </span>
                    ) : '—'
                  }
                />
                <InfoRow label="Collected by" value={selectedPayment.collectedBy} />
                <Button
                  className="mt-3 w-full rounded-control"
                  disabled={!canCreate || selected.status !== 'Posted'}
                  onClick={() =>
                    openDialog('D21', {
                      paymentId: selectedPayment.id,
                      receiptNo: selectedReceipt?.no ?? selected.ref,
                      amount: selectedPayment.amount,
                    })
                  }
                >
                  <RotateCcw className="h-4 w-4" aria-hidden /> Request reversal
                </Button>
                {!canCreate && <p className="mt-2 text-[11.5px] text-muted-foreground">Reversal requests need fees create permission.</p>}
              </div>
            ) : selectedCharge ? (
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <span className="font-heading text-[14px] font-bold text-ink">{selectedCharge.head}</span>
                  <StatusChip status={selected.status} />
                </div>
                <InfoRow label="Charge head" value={selectedCharge.head} />
                <InfoRow label="Amount" value={<Money value={selectedCharge.amount} />} mono />
                <InfoRow label="Charge date" value={fmtDate(selectedCharge.date)} />
                <InfoRow label="Due date" value={fmtDate(selectedCharge.dueDate)} />
                <Button
                  className="mt-3 w-full rounded-control"
                  disabled={!canCreate}
                  onClick={() =>
                    openDialog('D22', { chargeId: selectedCharge.id, head: selectedCharge.head, amount: selectedCharge.amount })
                  }
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden /> Request adjustment
                </Button>
                {!canCreate && <p className="mt-2 text-[11.5px] text-muted-foreground">Adjustment requests need fees create permission.</p>}
              </div>
            ) : (
              <EmptyState title="Entry not found" description="This ledger entry is no longer available." className="border-0 bg-transparent px-2 py-8" />
            )}
          </Card>
          <p className="px-1 text-[11.5px] text-muted-foreground">
            Showing {rows.length} entries for {studentName(data, studentId)}, newest first. Reversed payments stay visible with zero credit.
          </p>
        </aside>
      </div>
    </div>
  );
}
