'use client';

import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, Money, StatusChip } from '@/components/erp/ui/primitives';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { getStudent, paymentForReceipt, receiptsFor } from '@/lib/erp/derive';
import { downloadCsv, fmtDate } from '@/lib/erp/utils';
import { statusMeta } from '@/lib/erp/tokens';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

export default function P06Receipts() {
  const data = useErp((s) => s.data);
  const nav = useErp((s) => s.nav);

  const child = getStudent(data, CHILD_ID);
  const receipts = receiptsFor(data, CHILD_ID);

  const downloadAll = () => {
    downloadCsv(
      'receipts.csv',
      ['Receipt number', 'Date', 'Amount', 'Mode', 'Status'],
      receipts.map((r) => {
        const pay = paymentForReceipt(data, r.id);
        return [r.no, fmtDate(r.date), String(r.amount), r.mode, statusMeta(pay?.status ?? 'posted').label];
      }),
    );
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Receipts" subtitle={child?.displayName ?? '—'} accent="#5B5FEF" />

      <div className="space-y-3 p-4 pb-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-control"
            onClick={downloadAll}
            disabled={receipts.length === 0}
          >
            <Download className="h-4 w-4" aria-hidden /> Download all
          </Button>
        </div>

        {receipts.length === 0 ? (
          <EmptyState
            title="No receipts yet"
            description="Receipts issued by the school office will appear here."
          />
        ) : (
          <div className="space-y-2">
            {receipts.map((r) => {
              const pay = paymentForReceipt(data, r.id);
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => nav('P07', { receiptId: r.id })}
                  className="flex min-h-[64px] w-full flex-col gap-1.5 rounded-[12px] border border-line bg-card px-3.5 py-3 text-left transition-colors hover:bg-[#FAFBFF]"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13.5px] font-bold text-ink">{r.no}</span>
                    <Money value={r.amount} />
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-muted-foreground">
                      {fmtDate(r.date)} · {r.mode}
                    </span>
                    <StatusChip status={pay?.status ?? 'posted'} />
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <PhoneCard className="border-brand/20 bg-[#FAFBFF]">
          <p className="text-center text-[12px] font-medium text-muted-foreground">
            Payments are collected at the school office. This app is read-only.
          </p>
        </PhoneCard>
      </div>
    </div>
  );
}
