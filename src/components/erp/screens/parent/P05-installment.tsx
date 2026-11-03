'use client';

import { ArrowRight, ReceiptText } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { EmptyState, Money, StatusChip } from '@/components/erp/ui/primitives';
import { PhoneCard, PhoneHeader, PhoneRow } from '@/components/erp/ui/phone';
import { chargePaid } from '@/lib/erp/derive';
import { fmtDate, fmtINR } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

function InfoRow({ label, children, bold }: { label: string; children: ReactNode; bold?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-1.5 last:border-0">
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className={cn('text-right text-[13px] tabular-nums', bold ? 'font-bold text-ink' : 'font-semibold text-ink')}>
        {children}
      </span>
    </div>
  );
}

export default function P05Installment() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);

  const chargeId = params.chargeId ?? 'chg-stu-ananya-inst-t2';
  const charge = data.charges.find((c) => c.id === chargeId && c.studentId === CHILD_ID);

  if (!charge) {
    return (
      <div className="flex min-h-full flex-col">
        <PhoneHeader title="Installment" accent="#5B5FEF" onBack={() => nav('P04')} />
        <div className="p-4">
          <EmptyState
            title="Installment not found"
            description="Open Fees and pick an installment to view its detail."
          />
        </div>
      </div>
    );
  }

  const paid = chargePaid(data, charge.id);
  const concession = 0;
  const remaining = Math.max(0, charge.amount - concession - paid);
  const status = remaining === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid';
  const chipLabel = status === 'paid' ? 'Posted' : status === 'partial' ? 'Pending review' : 'Unmarked';

  /* Receipts whose payment allocated money to this charge */
  const relatedReceipts = data.payments
    .filter((p) => p.allocations.some((a) => a.chargeId === charge.id))
    .flatMap((p) => data.receipts.filter((r) => r.paymentId === p.id));

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Installment" subtitle={charge.head} accent="#5B5FEF" onBack={() => nav('P04')} />

      <div className="space-y-3 p-4 pb-6">
        {/* Installment info */}
        <PhoneCard>
          <div className="mb-1.5 flex items-start justify-between gap-2">
            <p className="text-[14px] font-bold text-ink">{charge.head}</p>
            <StatusChip status={chipLabel} />
          </div>
          <InfoRow label="Fee head">{charge.head}</InfoRow>
          <InfoRow label="Original amount">{fmtINR(charge.amount)}</InfoRow>
          <InfoRow label="Concession">{fmtINR(concession)}</InfoRow>
          <InfoRow label="Paid">{fmtINR(paid)}</InfoRow>
          <InfoRow label="Remaining" bold>{fmtINR(remaining)}</InfoRow>
          <InfoRow label="Due date">{fmtDate(charge.dueDate)}</InfoRow>
        </PhoneCard>

        {/* Related receipts */}
        <PhoneCard>
          <p className="flex items-center gap-1.5 text-[13px] font-bold text-ink">
            <ReceiptText className="h-4 w-4 text-brand" aria-hidden /> Related receipts
          </p>
          {relatedReceipts.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-muted-foreground">No receipt yet for this installment.</p>
          ) : (
            <div className="mt-2 space-y-2">
              {relatedReceipts.map((r) => (
                <PhoneRow
                  key={r.id}
                  icon={ReceiptText}
                  title={r.no}
                  subtitle={`${fmtDate(r.date)} · ${r.mode}`}
                  onClick={() => nav('P07', { receiptId: r.id })}
                  right={<Money value={r.amount} className="pr-1" />}
                />
              ))}
              <Button
                variant="outline"
                className="h-11 w-full rounded-control font-bold"
                onClick={() => nav('P07', { receiptId: relatedReceipts[0].id })}
              >
                View related receipt
                <ArrowRight className="ml-1 h-4 w-4" aria-hidden />
              </Button>
            </div>
          )}
        </PhoneCard>

        {/* Read-only note */}
        <PhoneCard className="border-brand/20 bg-[#FAFBFF]">
          <p className="text-center text-[12px] font-medium text-muted-foreground">
            Payments are collected at the school office. This app is read-only.
          </p>
        </PhoneCard>
      </div>
    </div>
  );
}
