'use client';

import { ArrowLeft, BookOpen, CheckCircle2, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, InfoRow, Money, PageHeader, PermissionState } from '@/components/erp/ui/primitives';
import { ReceiptView } from '@/components/erp/ui/phone';
import { duesFor, getStudent, paymentForReceipt, sectionLabel } from '@/lib/erp/derive';
import { downloadText, fmtDate, fmtINR } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

export default function W18PaymentReceipt() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const params = useErp((s) => s.route.params);
  const theme = useErp((s) => s.theme);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);

  if (!can(role, 'fees', 'view')) return <PermissionState module="Fees" />;

  const receiptId = params.receiptId ?? data.receipts[data.receipts.length - 1]?.id;
  const receipt = receiptId ? data.receipts.find((r) => r.id === receiptId) : undefined;

  if (!receipt) {
    return (
      <div>
        <PageHeader title="Payment confirmation & receipt" />
        <EmptyState
          title="Receipt not found"
          description="No receipt matches this reference. Record a payment at the collection desk first."
          action={<Button className="rounded-control" onClick={() => nav('W17')}>Go to collection desk</Button>}
        />
      </div>
    );
  }

  const payment = paymentForReceipt(data, receipt.id);
  const student = getStudent(data, receipt.studentId);
  const enrollment = data.enrollments.find((e) => e.studentId === receipt.studentId && e.status === 'active');
  const classLabel = enrollment ? sectionLabel(data, enrollment.sectionId) : '—';
  const allocations = (payment?.allocations ?? []).map((a) => ({
    head: data.charges.find((c) => c.id === a.chargeId)?.head ?? 'Charge',
    amount: a.amount,
  }));
  const remaining = duesFor(data, receipt.studentId, schoolDate).due;

  const downloadPdf = () => {
    const lines = [
      `${theme.schoolName} — Fee receipt`,
      `Receipt no: ${receipt.no}`,
      `Date: ${fmtDate(receipt.date)}`,
      `Student: ${student?.displayName ?? '—'} (${student?.admNo ?? '—'})`,
      `Class: ${classLabel}`,
      `Amount received: ${fmtINR(receipt.amount)}`,
      `Mode: ${receipt.mode}`,
      payment?.reference ? `Reference: ${payment.reference}` : null,
      'Allocation:',
      ...allocations.map((a) => `  - ${a.head}: ${fmtINR(a.amount)}`),
      `Remaining due: ${fmtINR(remaining)}`,
      `Collected by: ${receipt.collectedBy}`,
    ].filter((l): l is string => l !== null);
    downloadText('receipt.txt', lines.join('\n'));
  };

  return (
    <div>
      <PageHeader
        title="Payment confirmed"
        description={`Receipt ${receipt.no} · issued ${fmtDate(receipt.date)}`}
        actions={
          <>
            <Button variant="outline" className="rounded-control" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden /> Print receipt
            </Button>
            <Button className="rounded-control" onClick={downloadPdf}>
              <Download className="h-4 w-4" aria-hidden /> Download PDF
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-card border border-success/30 bg-success-soft px-4 py-3">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden />
        <div>
          <p className="text-[13.5px] font-bold text-success">Payment confirmed</p>
          <p className="text-[12px] text-success/90">
            {fmtINR(receipt.amount)} received from {student?.displayName ?? '—'} and posted to the student ledger.
          </p>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="print-area">
            <ReceiptView
              receiptNo={receipt.no}
              date={receipt.date}
              studentName={student?.displayName ?? '—'}
              classNameLabel={classLabel}
              amount={receipt.amount}
              mode={receipt.mode}
              reference={payment?.reference}
              collectedBy={receipt.collectedBy}
              allocations={allocations}
              remaining={remaining}
              orgName={theme.schoolName}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" className="rounded-control" onClick={() => nav('W17')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Return to collection desk
            </Button>
            <Button variant="outline" className="rounded-control" onClick={() => nav('W19', { studentId: receipt.studentId })}>
              <BookOpen className="h-4 w-4" aria-hidden /> Open student ledger
            </Button>
          </div>
        </div>

        <Card className="rounded-card border-line bg-card p-4 shadow-sm lg:col-span-2">
          <h2 className="mb-1 font-heading text-[15px] font-bold text-ink">Receipt details</h2>
          <InfoRow label="Receipt number" value={receipt.no} mono />
          <InfoRow
            label="Student"
            value={
              <span>
                {student?.displayName ?? '—'}
                <span className="block text-[11px] font-normal text-muted-foreground">{student?.admNo ?? ''} · {classLabel}</span>
              </span>
            }
          />
          <InfoRow label="Amount received" value={<Money value={receipt.amount} className="text-success" />} mono />
          <InfoRow label="Mode" value={receipt.mode} />
          <InfoRow label="Reference" value={payment?.reference ?? '—'} mono />
          <InfoRow
            label="Allocation"
            value={
              allocations.length > 0 ? (
                <span className="flex flex-col items-end gap-0.5">
                  {allocations.map((a, i) => (
                    <span key={i} className="text-[12.5px]">
                      {a.head} · <span className="tabular-nums">{fmtINR(a.amount)}</span>
                    </span>
                  ))}
                </span>
              ) : '—'
            }
          />
          <InfoRow
            label="Remaining due"
            value={<Money value={remaining} className={remaining > 0 ? 'text-danger' : 'text-success'} />}
            mono
          />
          <InfoRow label="Collected by" value={receipt.collectedBy} />
        </Card>
      </div>
    </div>
  );
}
