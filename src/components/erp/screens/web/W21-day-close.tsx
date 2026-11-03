'use client';

import { useState } from 'react';
import { AlertTriangle, History, Landmark, Printer, Save, Smartphone, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/erp/ui/table';
import { Field, InfoRow, KpiCard, Money, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { collectionsByMode, studentName } from '@/lib/erp/derive';
import type { Payment } from '@/lib/erp/types';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

export default function W21DayClose() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const userName = useErp((s) => s.session.userName);
  const schoolDate = useErp((s) => s.schoolDate);
  const setSchoolDate = useErp((s) => s.setSchoolDate);
  const openDialog = useErp((s) => s.openDialog);
  const saveDayClose = useErp((s) => s.saveDayClose);
  const loading = useFakeLoad(350);

  const modes = collectionsByMode(data, schoolDate, schoolDate);
  const cashExpected = modes.find((m) => m.mode === 'Cash')?.net ?? 0;
  const upiExpected = modes.find((m) => m.mode === 'UPI')?.net ?? 0;
  const bankExpected = modes.find((m) => m.mode === 'Bank transfer')?.net ?? 0;

  const [cashCounted, setCashCounted] = useState(cashExpected);
  const [upiVerified, setUpiVerified] = useState(upiExpected);
  const [bankVerified, setBankVerified] = useState(bankExpected);
  const [explanation, setExplanation] = useState('');

  /* Reset entries when the business date changes (render-time reset) */
  const [resetDate, setResetDate] = useState(schoolDate);
  if (resetDate !== schoolDate) {
    setResetDate(schoolDate);
    setCashCounted(cashExpected);
    setUpiVerified(upiExpected);
    setBankVerified(bankExpected);
    setExplanation('');
  }

  if (!can(role, 'fees', 'view')) return <PermissionState module="Fees" />;

  const canApprove = can(role, 'fees', 'approve');
  const variance = cashExpected - cashCounted;
  const existing = data.dayCloses.find((dc) => dc.date === schoolDate);
  const alreadyClosed = existing?.status === 'closed';
  const dayPayments = data.payments.filter((p) => p.date === schoolDate);
  const history = [...data.dayCloses].sort((a, b) => b.date.localeCompare(a.date));

  const paymentColumns: Column<Payment>[] = [
    {
      key: 'receipt',
      header: 'Receipt no',
      render: (p) => <span className="font-medium tabular-nums">{data.receipts.find((r) => r.paymentId === p.id)?.no ?? '—'}</span>,
    },
    { key: 'student', header: 'Student', render: (p) => studentName(data, p.studentId) },
    { key: 'mode', header: 'Mode', render: (p) => p.mode },
    { key: 'reference', header: 'Reference', render: (p) => p.reference ?? '—' },
    { key: 'amount', header: 'Amount', align: 'right', render: (p) => <Money value={p.amount} />, sortValue: (p) => p.amount },
    { key: 'status', header: 'Status', render: (p) => <StatusChip status={p.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Day close"
        description={`Count cash, verify UPI and bank collections for ${fmtDate(schoolDate)}, then close the business day.`}
        status={alreadyClosed ? <StatusChip status="closed" /> : existing ? <StatusChip status="draft" /> : undefined}
      />

      <div className="print-area space-y-4">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Cash expected" value={<Money value={cashExpected} />} sub={`${modes.find((m) => m.mode === 'Cash')?.count ?? 0} cash receipts`} icon={Wallet} />
          <KpiCard label="UPI expected" value={<Money value={upiExpected} />} sub={`${modes.find((m) => m.mode === 'UPI')?.count ?? 0} UPI receipts`} icon={Smartphone} />
          <KpiCard label="Bank expected" value={<Money value={bankExpected} />} sub={`${modes.find((m) => m.mode === 'Bank transfer')?.count ?? 0} bank transfers`} icon={Landmark} />
          <KpiCard
            label="Variance"
            value={<Money value={variance} className={variance === 0 ? 'text-success' : 'text-danger'} />}
            sub={variance === 0 ? 'Cash counted matches' : 'Explanation required'}
            icon={variance === 0 ? History : AlertTriangle}
            tone={variance === 0 ? 'success' : 'danger'}
          />
        </div>

        <Card className="rounded-card border-line bg-card shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-heading text-[15px] font-bold text-ink">Count &amp; verify</h2>
            <p className="text-[12px] text-muted-foreground">Verified inputs are prefilled with today&apos;s expected totals — adjust to match reality.</p>
          </div>
          <div className="grid gap-4 p-4 sm:grid-cols-2">
            <Field label="Business date">
              <input
                type="date"
                value={schoolDate}
                min="2026-06-01"
                onChange={(e) => e.target.value && setSchoolDate(e.target.value)}
                className="h-9 w-full rounded-control border border-line bg-background px-2.5 text-[13px]"
                aria-label="Business date"
              />
            </Field>
            <Field label="Cash counted" hint={`Expected ${fmtDate(schoolDate)}: cash in drawer`}>
              <Input
                type="number"
                value={cashCounted}
                onChange={(e) => setCashCounted(e.target.value === '' ? 0 : Number(e.target.value))}
                className="rounded-control"
                min={0}
                aria-label="Cash counted"
              />
            </Field>
            <Field label="UPI verified">
              <Input
                type="number"
                value={upiVerified}
                onChange={(e) => setUpiVerified(e.target.value === '' ? 0 : Number(e.target.value))}
                className="rounded-control"
                min={0}
                aria-label="UPI verified"
              />
            </Field>
            <Field label="Bank verified">
              <Input
                type="number"
                value={bankVerified}
                onChange={(e) => setBankVerified(e.target.value === '' ? 0 : Number(e.target.value))}
                className="rounded-control"
                min={0}
                aria-label="Bank verified"
              />
            </Field>
            <Field label="Explanation" className="sm:col-span-2" hint="Required when the cash counted does not match the expected total.">
              <Textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="e.g. ₹500 change float left at the desk…"
                rows={2}
                className="rounded-control bg-background"
                aria-label="Explanation"
              />
            </Field>
          </div>
          <div className="border-t border-line px-4 py-3">
            <div className="grid gap-x-8 sm:grid-cols-2">
              <InfoRow label="Cash expected" value={<Money value={cashExpected} />} mono />
              <InfoRow
                label="Variance"
                value={<Money value={variance} className={variance === 0 ? 'text-success' : 'text-danger'} />}
                mono
              />
              <InfoRow label="Reviewer" value={existing?.reviewer ?? `${userName} (on submit)`} />
              <InfoRow label="Close status" value={alreadyClosed ? <StatusChip status="closed" /> : <StatusChip status="draft" />} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                className="rounded-control"
                onClick={() =>
                  saveDayClose({
                    date: schoolDate,
                    cashCounted,
                    upiVerified,
                    bankVerified,
                    explanation: explanation.trim() || undefined,
                  })
                }
              >
                <Save className="h-4 w-4" aria-hidden /> Save count
              </Button>
              <Button
                className="rounded-control"
                disabled={alreadyClosed || !canApprove}
                onClick={() => {
                  if (variance === 0) {
                    openDialog('D25', { date: schoolDate, cashCounted, upiVerified, bankVerified });
                  } else {
                    openDialog('D26', { date: schoolDate, variance, cashCounted, upiVerified, bankVerified });
                  }
                }}
              >
                Submit close
              </Button>
              <Button variant="outline" className="rounded-control" onClick={() => window.print()}>
                <Printer className="h-4 w-4" aria-hidden /> Print close report
              </Button>
              {alreadyClosed && (
                <span className="text-[12px] font-medium text-muted-foreground">
                  Closed by {existing?.reviewer ?? '—'}{existing?.explanation ? ` · ${existing.explanation}` : ''}
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="rounded-card border-line bg-card shadow-sm">
          <div className="border-b border-line px-4 py-3">
            <h2 className="font-heading text-[15px] font-bold text-ink">Payments on {fmtDate(schoolDate)}</h2>
          </div>
          <div className="p-4 pt-0">
            {loading ? (
              <SkeletonTable rows={4} cols={6} />
            ) : (
              <DataTable
                rows={dayPayments}
                columns={paymentColumns}
                rowKey={(p) => p.id}
                searchable={(p) => `${data.receipts.find((r) => r.paymentId === p.id)?.no ?? ''} ${studentName(data, p.studentId)} ${p.mode} ${p.reference ?? ''}`}
                emptyTitle="No payments on this date"
                emptyDescription="Receipts issued on the business date appear here."
                pageSize={5}
              />
            )}
          </div>
        </Card>
      </div>

      <Card className="mt-4 rounded-card border-line bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-line px-4 py-3">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="font-heading text-[15px] font-bold text-ink">Close history</h2>
        </div>
        <div className="p-4 pt-1">
          {history.length === 0 ? (
            <p className="py-4 text-center text-[13px] text-muted-foreground">No business days closed yet.</p>
          ) : (
            history.map((dc) => (
              <div key={dc.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-bold text-ink">{fmtDate(dc.date)}</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Cash counted <span className="tabular-nums">{dc.cashCounted.toLocaleString('en-IN')}</span> of{' '}
                    <span className="tabular-nums">{dc.cashExpected.toLocaleString('en-IN')}</span> · UPI {dc.upiVerified.toLocaleString('en-IN')} · Bank{' '}
                    {dc.bankVerified.toLocaleString('en-IN')}
                    {dc.explanation ? ` · ${dc.explanation}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Money value={dc.variance} className={dc.variance === 0 ? 'text-success' : 'text-danger'} />
                  {dc.reviewer && <span className="text-[11.5px] text-muted-foreground">by {dc.reviewer}</span>}
                  <StatusChip status={dc.status} />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
