'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  EmptyState, Field, InfoRow, Money, PageHeader, PermissionState, SearchInput, SkeletonCards, StatusChip,
} from '@/components/erp/ui/primitives';
import { activeEnrollmentOf, activeStudents, duesFor, getStudent, sectionLabel, studentInstallments } from '@/lib/erp/derive';
import { fmtDate, fmtINR, useFakeLoad } from '@/lib/erp/utils';
import { allocateCharges } from '@/lib/erp/seed';
import { cn } from '@/lib/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { PaymentMode } from '@/lib/erp/types';

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Bank transfer', 'Cheque'];

export default function W17CollectionDesk() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const setSchoolDate = useErp((s) => s.setSchoolDate);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);

  const [query, setQuery] = useState('');
  const [studentId, setStudentId] = useState(() => params.studentId ?? 'stu-ananya');
  const [amount, setAmount] = useState('');
  const [mode, setMode] = useState<PaymentMode>('Cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [reviewed, setReviewed] = useState(false);

  const loading = useFakeLoad(350);

  if (!can(role, 'fees', 'create')) return <PermissionState module="Fees" />;

  const student = getStudent(data, studentId);

  const results = activeStudents(data)
    .filter((s) => `${s.displayName} ${s.admNo}`.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
    .slice(0, 6);

  if (loading) {
    return (
      <div>
        <PageHeader description="Record verified payments against student dues." />
        <SkeletonCards count={4} />
      </div>
    );
  }

  if (!student) {
    return (
      <div>
        <PageHeader description="Record verified payments against student dues." />
        <EmptyState
          title="Student not found"
          description="Pick a student from the search panel to start a payment."
          action={<Button variant="outline" className="rounded-control" onClick={() => setStudentId('stu-ananya')}>Load sample student</Button>}
        />
      </div>
    );
  }

  const dues = duesFor(data, studentId, schoolDate);
  const insts = studentInstallments(data, studentId);
  const sectionOf = (id: string) => sectionLabel(data, activeEnrollmentOf(data, id, ayId)?.sectionId ?? '');

  const amountNum = Number(amount);
  const refRequired = mode !== 'Cash';
  const amountError = !amount.trim() || Number.isNaN(amountNum) || amountNum <= 0
    ? 'Amount must be greater than ₹0.00.'
    : amountNum > dues.due
      ? `Amount exceeds outstanding dues ${fmtINR(dues.due)}.`
      : undefined;
  const referenceError = refRequired && reference.trim() === ''
    ? 'Reference number is required for UPI, bank transfer and cheque.'
    : undefined;
  const valid = !amountError && !referenceError && dues.due > 0;

  const openItems = insts
    .filter((i) => i.remaining > 0)
    .map((i) => ({ id: i.chargeId, amount: i.remaining, dueDate: i.dueDate, head: i.head, remaining: i.remaining }));
  const allocation = amountNum > 0 ? allocateCharges(openItems, amountNum) : [];
  const allocatedTotal = allocation.reduce((t, a) => t + a.amount, 0);

  const reviewPayment = () => {
    if (!valid) {
      pushToast({ title: 'Check the payment details', description: amountError ?? referenceError ?? 'No outstanding dues for this student.', variant: 'error' });
      return;
    }
    setReviewed(true);
    pushToast({ title: 'Allocation looks correct', variant: 'info' });
  };

  const confirmPayment = () => {
    if (!valid) return;
    openDialog('D19', {
      studentId, amount: amountNum, mode,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const clearForm = () => {
    setAmount('');
    setMode('Cash');
    setReference('');
    setNotes('');
    setReviewed(false);
  };

  return (
    <div>
      <PageHeader
        description={`Record verified payments against student dues · business date ${fmtDate(schoolDate)}.`}
      />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {/* ── Left: picker + selected student ── */}
        <div className="space-y-5">
          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <h2 className="mb-2 font-heading text-[15px] font-bold text-ink">Student search</h2>
            <SearchInput
              value={query} onChange={setQuery}
              placeholder="Search by name or admission no…"
            />
            <div className="mt-2 space-y-1">
              {results.map((s) => {
                const due = duesFor(data, s.id, schoolDate).due;
                const isSel = s.id === studentId;
                return (
                  <button
                    key={s.id} type="button"
                    onClick={() => { setStudentId(s.id); setReviewed(false); }}
                    className={cn(
                      'flex w-full items-center justify-between gap-2 rounded-[10px] border px-3 py-2 text-left transition-colors',
                      isSel ? 'border-brand/40 bg-brand/10' : 'border-line hover:bg-muted',
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-semibold text-ink">{s.displayName}</span>
                      <span className="block truncate text-[11.5px] text-muted-foreground">{s.admNo} · {sectionOf(s.id)}</span>
                    </span>
                    {due > 0 && <span className="shrink-0 text-[12px] font-semibold text-danger">{fmtINR(due)} due</span>}
                  </button>
                );
              })}
              {results.length === 0 && (
                <p className="py-3 text-center text-[13px] text-muted-foreground">No students match “{query}”.</p>
              )}
            </div>
          </Card>

          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-heading text-[15px] font-bold text-ink">{student.displayName}</p>
                <p className="text-[12px] text-muted-foreground">{sectionOf(studentId)}</p>
              </div>
              {dues.overdue > 0 && (
                <span className="rounded-full border border-danger/20 bg-danger-soft px-2 py-0.5 text-[11px] font-semibold text-danger">
                  Overdue {fmtINR(dues.overdue)}
                </span>
              )}
            </div>
            <div className="mt-2">
              <InfoRow label="Admission number" value={student.admNo} mono />
              <InfoRow label="Grade-Section" value={sectionOf(studentId)} />
              <InfoRow label="Total charges" value={<Money value={dues.totalCharges} />} mono />
              <InfoRow label="Paid" value={<Money value={dues.paid} />} mono />
              <InfoRow label="Due" value={<Money value={dues.due} className={dues.due > 0 ? 'text-danger' : 'text-success'} />} mono />
              <InfoRow label="Overdue" value={<Money value={dues.overdue} className={dues.overdue > 0 ? 'text-danger' : undefined} />} mono />
            </div>
            <div className="mt-3 space-y-1.5">
              {insts.map((i) => (
                <div key={i.chargeId} className="flex items-center justify-between gap-2 rounded-[10px] border border-line px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-semibold text-ink">{i.head}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      Due {fmtDate(i.dueDate)} · Paid {fmtINR(i.paid)} of {fmtINR(i.original)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <StatusChip status={i.status === 'paid' ? 'Paid' : i.status === 'partial' ? 'Partially paid' : 'Unpaid'} />
                    <Money value={i.remaining} className={i.remaining > 0 ? 'text-danger' : undefined} />
                  </div>
                </div>
              ))}
              {insts.length === 0 && (
                <p className="rounded-[10px] bg-success-soft/60 px-3 py-2 text-[13px] font-medium text-success">
                  No charges posted for this student.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* ── Right: payment form + allocation preview ── */}
        <div className="space-y-5">
          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <h2 className="mb-3 font-heading text-[15px] font-bold text-ink">Record payment</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Student search" className="sm:col-span-2" hint="Use the search panel on the left to change the student.">
                <Input value={student.displayName} readOnly className="rounded-control bg-muted" aria-label="Selected student" />
              </Field>
              <Field label="Admission number">
                <Input value={student.admNo} readOnly className="rounded-control bg-muted" aria-label="Admission number" />
              </Field>
              <Field label="Dues">
                <div className="flex h-9 items-center rounded-control border border-line bg-muted px-3">
                  <Money value={dues.due} className={dues.due > 0 ? 'text-danger' : 'text-success'} />
                </div>
              </Field>
              <Field label="Amount received" required error={amountError}>
                <Input
                  type="number" min={0} step="0.01" value={amount}
                  onChange={(e) => { setAmount(e.target.value); setReviewed(false); }}
                  placeholder="0.00" className="rounded-control bg-background" aria-label="Amount received"
                />
              </Field>
              <Field label="Payment mode">
                <Select value={mode} onValueChange={(v) => { setMode(v as PaymentMode); setReviewed(false); }}>
                  <SelectTrigger className="rounded-control bg-background" aria-label="Payment mode"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field
                label="Reference number" required={refRequired} error={referenceError}
                hint={refRequired ? undefined : 'Not required for cash payments.'}
              >
                <Input
                  value={reference}
                  onChange={(e) => { setReference(e.target.value); setReviewed(false); }}
                  placeholder={refRequired ? 'UPI / NEFT / cheque no' : '—'}
                  className="rounded-control bg-background" aria-label="Reference number"
                />
              </Field>
              <Field label="Business date" hint="Receipts are posted on this date.">
                <input
                  type="date" value={schoolDate} min="2026-06-01" max="2026-07-21"
                  onChange={(e) => e.target.value && setSchoolDate(e.target.value)}
                  className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px]"
                  aria-label="Business date"
                />
              </Field>
              <Field label="Notes" className="sm:col-span-2">
                <Textarea
                  rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional note for the receipt or audit trail…"
                  className="rounded-control bg-background" aria-label="Notes"
                />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button variant="outline" className="rounded-control" onClick={reviewPayment}>Review payment</Button>
              <Button className="rounded-control" disabled={!valid} onClick={confirmPayment}>Confirm payment</Button>
              <Button variant="ghost" className="rounded-control" onClick={clearForm}>Clear</Button>
              {dues.due === 0 && <span className="text-[12px] font-medium text-success">No outstanding dues for this student.</span>}
            </div>
          </Card>

          <div
            className={cn(
              'rounded-card border bg-card p-4 shadow-sm transition-shadow',
              reviewed && valid ? 'border-brand/50 ring-2 ring-brand/15' : 'border-line',
            )}
          >
            <h2 className="font-heading text-[15px] font-bold text-ink">Allocation preview</h2>
            <p className="text-[12px] text-muted-foreground">Oldest unpaid installment is settled first, matching how the payment will be posted.</p>
            <div className="mt-3 space-y-1.5">
              {amountNum > 0 && allocation.map((a) => {
                const item = openItems.find((o) => o.id === a.chargeId);
                return (
                  <div key={a.chargeId} className="flex items-center justify-between gap-2 rounded-[10px] bg-page px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{item?.head ?? 'Charge'}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        Due {fmtDate(item?.dueDate)} · balance after {fmtINR(Math.max(0, (item?.remaining ?? 0) - a.amount))}
                      </p>
                    </div>
                    <Money value={a.amount} />
                  </div>
                );
              })}
              {amountNum > 0 && allocatedTotal < amountNum && (
                <div className="flex items-center justify-between gap-2 rounded-[10px] border border-danger/30 bg-danger-soft/50 px-3 py-2">
                  <p className="text-[13px] font-semibold text-danger">Unallocated</p>
                  <Money value={amountNum - allocatedTotal} className="text-danger" />
                </div>
              )}
              {amountNum <= 0 && (
                <p className="rounded-[10px] border border-dashed border-line px-3 py-4 text-center text-[13px] text-muted-foreground">
                  Enter an amount to see how it lands on each charge.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
