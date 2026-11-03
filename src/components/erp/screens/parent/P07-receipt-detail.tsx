'use client';

import { Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneHeader, PhoneStickyBar, ReceiptView } from '@/components/erp/ui/phone';
import { EmptyState } from '@/components/erp/ui/primitives';
import { duesFor, getStudent, paymentForReceipt, receiptsFor, sectionLabel } from '@/lib/erp/derive';
import { fmtINR } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

export default function P07ReceiptDetail() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const orgName = useErp((s) => s.theme.schoolName);

  const receipt = data.receipts.find((r) => r.id === params.receiptId) ?? receiptsFor(data, CHILD_ID)[0];

  if (!receipt) {
    return (
      <div className="flex min-h-full flex-col">
        <PhoneHeader title="Receipt" accent="#5B5FEF" onBack={() => nav('P06')} />
        <div className="p-4">
          <EmptyState
            title="No receipts yet"
            description="Receipts issued by the school office will appear here."
          />
        </div>
      </div>
    );
  }

  const pay = paymentForReceipt(data, receipt.id);
  const sectionId =
    data.enrollments.find((e) => e.studentId === CHILD_ID && e.status === 'active')?.sectionId ?? 's-7a';
  const allocations = (pay?.allocations ?? []).map((a) => ({
    head: data.charges.find((c) => c.id === a.chargeId)?.head ?? 'Fee charge',
    amount: a.amount,
  }));

  const shareReceipt = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Receipt ${receipt.no}`,
          text: `Fee receipt ${receipt.no} — ${fmtINR(receipt.amount)}`,
        });
      } else {
        pushToast({ title: 'Share sheet opened on device', variant: 'info' });
      }
    } catch {
      pushToast({ title: 'Share sheet opened on device', variant: 'info' });
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Receipt" subtitle={receipt.no} accent="#5B5FEF" onBack={() => nav('P06')} />

      <div className="flex-1 space-y-3 p-4 pb-6">
        <ReceiptView
          receiptNo={receipt.no}
          date={receipt.date}
          studentName={getStudent(data, receipt.studentId)?.displayName ?? '—'}
          classNameLabel={sectionLabel(data, sectionId)}
          amount={receipt.amount}
          mode={receipt.mode}
          reference={pay?.reference}
          collectedBy={receipt.collectedBy}
          allocations={allocations}
          remaining={duesFor(data, CHILD_ID, schoolDate).due}
          orgName={orgName}
        />
        <p className="text-center text-[11.5px] text-muted-foreground">
          Download the PDF or share it from this device. Payments are collected at the school office. This app is
          read-only.
        </p>
      </div>

      <PhoneStickyBar>
        <Button className="h-12 flex-1 rounded-control font-bold" onClick={() => window.print()}>
          <Download className="h-4 w-4" aria-hidden /> Download PDF
        </Button>
        <Button
          variant="outline"
          className="h-12 flex-1 rounded-control font-bold"
          onClick={shareReceipt}
          aria-label="Share using phone"
        >
          <Share2 className="h-4 w-4" aria-hidden /> Share
        </Button>
      </PhoneStickyBar>
    </div>
  );
}
