'use client';

import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { StatusChip } from '@/components/erp/ui/primitives';
import { duesFor, getStudent, sectionLabel, studentInstallments } from '@/lib/erp/derive';
import { fmtDate, fmtINR } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'success' | 'danger' }) {
  return (
    <div className="rounded-[12px] border border-line bg-card px-3 py-2.5">
      <p className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          'mt-0.5 font-heading text-[16px] font-bold tabular-nums',
          tone === 'success' ? 'text-success' : tone === 'danger' ? 'text-danger' : 'text-ink',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function FeeRow({ label, children, bold }: { label: string; children: ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line/60 py-1.5 last:border-0">
      <span className="text-[12px] text-muted-foreground">{label}</span>
      <span className={cn('text-[13px] tabular-nums', bold ? 'font-bold text-ink' : 'font-semibold text-ink-soft')}>
        {children}
      </span>
    </div>
  );
}

export default function P04Fees() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);

  const child = getStudent(data, CHILD_ID);
  const enr = data.enrollments.find((e) => e.studentId === CHILD_ID && e.status === 'active');
  const classLabel = enr ? sectionLabel(data, enr.sectionId) : '—';

  const dues = duesFor(data, CHILD_ID, schoolDate);
  const installments = studentInstallments(data, CHILD_ID);
  const chipFor = (status: 'paid' | 'partial' | 'unpaid') =>
    status === 'paid' ? 'Posted' : status === 'partial' ? 'Pending review' : 'Unmarked';

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Fees"
        subtitle={`${child?.displayName ?? '—'} · ${classLabel}`}
        accent="#5B5FEF"
        right={
          <Button variant="outline" size="sm" className="h-11 rounded-control" onClick={() => nav('P06')}>
            View receipts
          </Button>
        }
      />

      <div className="space-y-3 p-4 pb-6">
        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-2">
          <Tile label="Total charges" value={fmtINR(dues.totalCharges)} />
          <Tile label="Paid" value={fmtINR(dues.paid)} tone="success" />
          <Tile label="Remaining" value={fmtINR(dues.due)} tone="danger" />
          <Tile label="Next due date" value={fmtDate(dues.nextDueDate)} />
        </div>

        {/* Installments, oldest due first */}
        {installments.map((i) => (
          <PhoneCard key={i.chargeId}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-[14px] font-bold text-ink">{i.head}</p>
              <StatusChip status={chipFor(i.status)} />
            </div>
            <div className="mt-1">
              <FeeRow label="Original amount">{fmtINR(i.original)}</FeeRow>
              <FeeRow label="Concession">{fmtINR(i.concession)}</FeeRow>
              <FeeRow label="Paid">{fmtINR(i.paid)}</FeeRow>
              <FeeRow label="Remaining" bold>{fmtINR(i.remaining)}</FeeRow>
              <FeeRow label="Due date">{fmtDate(i.dueDate)}</FeeRow>
            </div>
            <Button
              variant="outline"
              className="mt-2 h-11 w-full rounded-control font-bold"
              onClick={() => nav('P05', { chargeId: i.chargeId })}
            >
              Open installment
            </Button>
          </PhoneCard>
        ))}

        {/* Read-only note — no Pay Now anywhere */}
        <PhoneCard className="border-brand/20 bg-[#FAFBFF]">
          <p className="text-center text-[12px] font-medium text-muted-foreground">
            Payments are collected at the school office. This app is read-only.
          </p>
        </PhoneCard>
      </div>
    </div>
  );
}
