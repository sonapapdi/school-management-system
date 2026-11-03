'use client';

import {
  AlertTriangle, CheckCircle2, Clock, Info, Loader2, Printer, RefreshCw, Trash2, WifiOff, XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fmtINR } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import type { DialogId } from '@/lib/erp/types';
import { ReceiptView } from './phone';

/* ── Toaster ── */

export function ErpToaster() {
  const toasts = useErp((s) => s.toasts);
  const dismiss = useErp((s) => s.dismissToast);
  return (
    <div className="pointer-events-none fixed bottom-4 left-1/2 z-[100] flex w-full max-w-sm -translate-x-1/2 flex-col gap-2 px-4 print:hidden" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'pointer-events-auto flex items-start gap-2.5 rounded-[12px] border bg-card p-3 shadow-lg',
            t.variant === 'success' && 'border-success/30',
            t.variant === 'error' && 'border-danger/40',
            t.variant === 'warning' && 'border-amber/40',
            t.variant === 'info' && 'border-line',
          )}
        >
          {t.variant === 'success' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" aria-hidden />
            : t.variant === 'error' ? <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-danger" aria-hidden />
            : t.variant === 'warning' ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
            : <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />}
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-ink">{t.title}</p>
            {t.description && <p className="text-[12px] text-muted-foreground">{t.description}</p>}
          </div>
          <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="text-muted-foreground hover:text-ink">
            <XCircle className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ── Reason field used by several dialogs ── */

function ReasonField({ value, onChange, error, placeholder, label = 'Reason' }: {
  value: string; onChange: (v: string) => void; error?: boolean; placeholder?: string; label?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-ink-soft">
        {label} <span className="text-danger">*</span>
      </label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Explain briefly…'}
        rows={3}
        className={cn('rounded-control bg-background', error && 'border-danger')}
        aria-label={label}
      />
      {error && <p className="text-[12px] font-medium text-danger">A short reason is required.</p>}
    </div>
  );
}

const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
const str = (v: unknown): string => (typeof v === 'string' ? v : '');

/* ── Dialog host: all 28 prototype dialogs ── */

export function ErpDialogHost() {
  const dialog = useErp((s) => s.dialog);
  const data = useErp((s) => s.data);
  const [reason, setReason] = useState('');
  const [reasonError, setReasonError] = useState(false);

  if (!dialog) return null;
  const p = dialog.payload ?? {};
  const st = useErp.getState;
  const close = () => st().closeDialog();
  const reset = () => { setReason(''); setReasonError(false); };

  const needsReason: DialogId[] = ['D16', 'D21', 'D22', 'D24'];
  const reasonValid = !needsReason.includes(dialog.id) || reason.trim().length >= 3;

  const commit = () => {
    if (!reasonValid) { setReasonError(true); return; }
    switch (dialog.id) {
      case 'D01': close(); st().nav('A01'); break;
      case 'D02': (p.discard as (() => void) | undefined)?.(); close(); break;
      case 'D03': close(); break;
      case 'D04': close(); st().pushToast({ title: 'Result confirmed', description: 'Latest status shows the action completed.', variant: 'success' }); break;
      case 'D05': st().setAy(str(p.ayId)); close(); st().pushToast({ title: 'Academic year switched', variant: 'success' }); break;
      case 'D06': close(); st().signOut(); break;
      case 'D07': (p.onContinue as (() => void) | undefined)?.(); close(); break;
      case 'D08': (p.onConfirm as (() => void) | undefined)?.(); close(); break;
      case 'D09':
        st().transferStudent({ studentId: str(p.studentId), toSectionId: str(p.toSectionId), effectiveDate: str(p.effectiveDate), rollNo: num(p.rollNo), reason: reason || 'Section transfer' });
        close(); break;
      case 'D10':
        st().withdrawStudent({ studentId: str(p.studentId), reason: reason || str(p.reason), date: str(p.date) || st().schoolDate });
        close(); break;
      case 'D11': st().inviteParent(str(p.guardianId)); close(); break;
      case 'D12': st().commitImport(str(p.importId)); close(); break;
      case 'D13': st().discardImport(str(p.importId)); close(); break;
      case 'D14': st().markRemainingPresent({ date: str(p.date), sectionId: str(p.sectionId) }); close(); break;
      case 'D15':
        st().submitRegister({ date: str(p.date), sectionId: str(p.sectionId), actorRole: st().session.role });
        close(); break;
      case 'D16':
        st().requestCorrection({
          date: str(p.date), sectionId: str(p.sectionId), studentId: str(p.studentId),
          from: (p.from as 'P' | 'A' | 'L') ?? 'P', to: (p.to as 'P' | 'A' | 'L') ?? 'A',
          reason, note: str(p.note), requestedBy: str(p.requestedBy) || st().session.userName,
        });
        close(); break;
      case 'D17':
        st().bumpRegisterRevision(str(p.date), str(p.sectionId));
        close(); st().pushToast({ title: 'Register reloaded', description: 'You are viewing the latest version.', variant: 'info' }); break;
      case 'D18': {
        const ids = (p.studentIds as string[] | undefined) ?? [];
        st().postCharges({ planId: str(p.planId), studentIds: ids, actorName: st().session.userName });
        close(); break;
      }
      case 'D19': {
        const res = st().recordPayment({
          studentId: str(p.studentId), amount: num(p.amount), mode: (p.mode as 'Cash' | 'UPI' | 'Bank transfer' | 'Cheque') ?? 'Cash',
          reference: str(p.reference) || undefined, notes: str(p.notes) || undefined, collectedBy: st().session.userName,
        });
        close();
        if (res) st().nav('W18', { receiptId: res.receiptId });
        break;
      }
      case 'D20': close(); setTimeout(() => window.print(), 120); break;
      case 'D21':
        st().requestReversal({ paymentId: str(p.paymentId), reason, requestedBy: st().session.userName });
        close(); break;
      case 'D22':
        st().requestAdjustment({ chargeId: str(p.chargeId), amount: num(p.amount), reason, requestedBy: st().session.userName });
        close(); break;
      case 'D23': {
        const kind = str(p.kind);
        if (kind === 'correction') st().resolveCorrection(str(p.id), true);
        else if (kind === 'fee') st().resolveFeeRequest(str(p.id), true, st().session.userName);
        close(); break;
      }
      case 'D24': {
        const kind = str(p.kind);
        if (kind === 'correction') st().resolveCorrection(str(p.id), false, reason);
        else if (kind === 'fee') st().resolveFeeRequest(str(p.id), false, st().session.userName, reason);
        close(); break;
      }
      case 'D25':
        st().saveDayClose({ date: str(p.date), cashCounted: num(p.cashCounted), upiVerified: num(p.upiVerified), bankVerified: num(p.bankVerified) });
        st().submitDayClose({ date: str(p.date), reviewer: st().session.userName });
        close(); break;
      case 'D26':
        st().saveDayClose({ date: str(p.date), cashCounted: num(p.cashCounted), upiVerified: num(p.upiVerified), bankVerified: num(p.bankVerified), explanation: reason });
        st().submitDayClose({ date: str(p.date), reviewer: st().session.userName });
        close(); break;
      case 'D27': st().publishNotice(str(p.noticeId)); close(); break;
      case 'D28': st().createExport(str(p.type), st().session.userName); close(); break;
      default: close();
    }
    reset();
  };

  /* Per-dialog content */
  let title = '';
  let description: React.ReactNode = null;
  let safeLabel = 'Cancel';
  let commitLabel = 'Confirm';
  let danger = false;
  let extra: React.ReactNode = null;
  let icon: React.ReactNode = null;

  const money = (v: unknown) => fmtINR(num(v));

  switch (dialog.id) {
    case 'D01':
      title = 'Session expired';
      description = 'For security you were signed out after inactivity. Sign in again to continue.';
      safeLabel = 'Sign in again';
      commitLabel = 'Dismiss';
      icon = <Clock className="h-5 w-5" aria-hidden />;
      break;
    case 'D02':
      title = 'Discard unsaved changes?';
      description = 'This form has unsaved changes. Leaving now will lose them.';
      safeLabel = 'Keep editing';
      commitLabel = 'Discard changes';
      danger = true;
      icon = <AlertTriangle className="h-5 w-5" aria-hidden />;
      break;
    case 'D03':
      title = 'Permission denied';
      description = str(p.message) || 'Your current role does not allow this action. Ask a school administrator if you need access.';
      safeLabel = 'Go back';
      commitLabel = 'OK';
      icon = <XCircle className="h-5 w-5" aria-hidden />;
      break;
    case 'D04':
      title = 'Result unknown';
      description = 'We could not confirm the result. Check the latest status before trying again.';
      safeLabel = 'Check status';
      commitLabel = 'Retry action';
      icon = <WifiOff className="h-5 w-5" aria-hidden />;
      break;
    case 'D05':
      title = 'Switch academic year';
      description = `Switch to ${str(p.ayName)}? Screens will show data for the selected year. Open drafts stay safe.`;
      safeLabel = 'Cancel';
      commitLabel = 'Switch year';
      icon = <Info className="h-5 w-5" aria-hidden />;
      break;
    case 'D06':
      title = 'Sign out?';
      description = 'Unsaved drafts on this device are kept. You will return to the sign-in screen.';
      safeLabel = 'Cancel';
      commitLabel = 'Sign out';
      danger = true;
      icon = <Info className="h-5 w-5" aria-hidden />;
      break;
    case 'D07':
      title = 'Possible duplicate detected';
      description = <>A possible student match already exists. Review it before creating a new record.<br /><span className="font-semibold text-ink">{str(p.existing)}</span></>;
      safeLabel = 'Review existing record';
      commitLabel = 'Create new record';
      danger = true;
      icon = <AlertTriangle className="h-5 w-5" aria-hidden />;
      break;
    case 'D08':
      title = 'Confirm admission';
      description = <>Admit <span className="font-semibold text-ink">{str(p.studentName)}</span> to {str(p.classNameLabel)}? An admission number will be generated and the guardian invited.</>;
      safeLabel = 'Back to review';
      commitLabel = 'Admit student';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D09':
      title = 'Transfer student';
      description = <>Move <span className="font-semibold text-ink">{str(p.studentName)}</span> to {str(p.toLabel)} effective {str(p.effectiveDate)}? The old enrollment closes on that date and a new roll number is assigned.</>;
      extra = <ReasonField label="Reason for transfer" value={reason} onChange={setReason} placeholder="e.g. Sibling alignment, section balance…" />;
      safeLabel = 'Cancel';
      commitLabel = 'Transfer student';
      icon = <Info className="h-5 w-5" aria-hidden />;
      break;
    case 'D10':
      title = 'Withdraw student';
      description = <>Withdraw <span className="font-semibold text-ink">{str(p.studentName)}</span>? Their records are kept, the seat is released and ledger stays read-only.</>;
      extra = <ReasonField value={reason} onChange={setReason} placeholder="e.g. Family relocation" />;
      safeLabel = 'Cancel';
      commitLabel = 'Withdraw student';
      danger = true;
      icon = <AlertTriangle className="h-5 w-5" aria-hidden />;
      break;
    case 'D11':
      title = 'Invite parent';
      description = <>Send an activation invitation to <span className="font-semibold text-ink">{str(p.name)}</span> on their verified mobile? Access is read-only and linked to this student only.</>;
      safeLabel = 'Cancel';
      commitLabel = 'Invite parent';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D12':
      title = 'Commit import';
      description = <>Commit <span className="font-semibold text-ink">{num(p.accepted)} accepted row{num(p.accepted) === 1 ? '' : 's'}</span>? Conflicting and rejected rows are skipped and can be fixed later.</>;
      safeLabel = 'Back to review';
      commitLabel = 'Commit accepted rows';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D13':
      title = 'Discard import batch?';
      description = 'The uploaded file and all validation results will be removed. This cannot be undone.';
      safeLabel = 'Keep batch';
      commitLabel = 'Discard batch';
      danger = true;
      icon = <Trash2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D14':
      title = 'Mark remaining students present?';
      description = <>{num(p.count)} unmarked student{num(p.count) === 1 ? '' : 's'} will be marked <span className="font-semibold text-success">Present</span>. You can still change marks before submitting.</>;
      safeLabel = 'Cancel';
      commitLabel = 'Mark remaining present';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D15':
      title = 'Submit and lock register?';
      description = num(p.unmarked) > 0
        ? <>{num(p.unmarked)} student{num(p.unmarked) === 1 ? ' is' : 's are'} still unmarked. You cannot submit until none remain unmarked.</>
        : <>Totals: {num(p.present)} present · {num(p.absent)} absent · {num(p.leave)} leave. After submission the register is locked and corrections need office approval.</>;
      safeLabel = 'Back to edit';
      commitLabel = num(p.unmarked) > 0 ? 'Complete marking first' : 'Submit register';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D16':
      title = 'Submit attendance correction';
      description = <>Requesting change for <span className="font-semibold text-ink">{str(p.studentName)}</span>: {str(p.fromLabel)} → {str(p.toLabel)} on {str(p.dateLabel)}.</>;
      extra = <ReasonField value={reason} onChange={setReason} placeholder="Why should the office change this mark?" />;
      safeLabel = 'Cancel';
      commitLabel = 'Submit request';
      icon = <Info className="h-5 w-5" aria-hidden />;
      break;
    case 'D17':
      title = 'Register changed elsewhere';
      description = 'This register changed after you opened it. Reload the latest version to avoid overwriting office corrections.';
      safeLabel = 'Keep my version';
      commitLabel = 'Reload latest version';
      icon = <RefreshCw className="h-5 w-5" aria-hidden />;
      break;
    case 'D18':
      title = 'Post fee charges';
      description = <>Post <span className="font-semibold text-ink">{str(p.planName)}</span> charges for {num(p.count)} student{num(p.count) === 1 ? '' : 's'}? Students who already have these charges are skipped.</>;
      safeLabel = 'Cancel';
      commitLabel = 'Post charges';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D19':
      title = 'Confirm payment & issue receipt';
      description = <>Record <span className="font-semibold">{money(p.amount)}</span> received as <span className="font-semibold">{str(p.mode)}</span>{str(p.reference) ? ` (Ref ${str(p.reference)})` : ''}? A receipt is issued immediately and posted to the student ledger.</>;
      safeLabel = 'Review payment';
      commitLabel = 'Confirm payment';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D20': {
      const rc = data.receipts.find((r) => r.id === str(p.receiptId));
      const pay = rc ? data.payments.find((x) => x.id === rc.paymentId) : undefined;
      const student = data.students.find((s) => s.id === rc?.studentId);
      const enr = data.enrollments.find((e) => e.studentId === rc?.studentId && e.status === 'active');
      const sec = data.sections.find((s) => s.id === enr?.sectionId);
      const grade = data.grades.find((g) => g.id === sec?.gradeId);
      title = 'Receipt';
      description = null;
      safeLabel = 'Close';
      commitLabel = 'Print receipt';
      extra = rc ? (
        <div className="max-h-[50vh] overflow-y-auto erp-scroll rounded-card border border-line bg-[#F7F8FC] p-2">
          <ReceiptView
            receiptNo={rc.no} date={rc.date} studentName={student?.displayName ?? '—'}
            classNameLabel={`${grade?.name ?? ''}-${sec?.name ?? ''}`} amount={rc.amount} mode={rc.mode}
            reference={pay?.reference} collectedBy={rc.collectedBy}
            allocations={(pay?.allocations ?? []).map((a) => ({ head: data.charges.find((c) => c.id === a.chargeId)?.head ?? 'Charge', amount: a.amount }))}
            remaining={0} orgName={useErp.getState().theme.schoolName}
          />
        </div>
      ) : null;
      icon = <Printer className="h-5 w-5" aria-hidden />;
      break;
    }
    case 'D21':
      title = 'Request payment reversal';
      description = <>Reverse receipt <span className="font-semibold">{str(p.receiptNo)}</span> of {money(p.amount)}? The payment must then be approved by an approver before the ledger changes.</>;
      extra = <ReasonField value={reason} onChange={setReason} />;
      safeLabel = 'Cancel';
      commitLabel = 'Request reversal';
      icon = <RefreshCw className="h-5 w-5" aria-hidden />;
      break;
    case 'D22':
      title = 'Request fee adjustment';
      description = <>Adjust charge <span className="font-semibold">{str(p.head)}</span> by {money(p.amount)}? Posted charges are never edited directly — an approver confirms this.</>;
      extra = <ReasonField value={reason} onChange={setReason} />;
      safeLabel = 'Cancel';
      commitLabel = 'Request adjustment';
      icon = <Info className="h-5 w-5" aria-hidden />;
      break;
    case 'D23':
      title = 'Approve request';
      description = <>Approve <span className="font-semibold text-ink">{str(p.title)}</span> from {str(p.requestedBy)}? The change applies immediately and appears in the audit log.</>;
      safeLabel = 'Cancel';
      commitLabel = 'Approve';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D24':
      title = 'Reject request';
      description = <>Reject <span className="font-semibold text-ink">{str(p.title)}</span> from {str(p.requestedBy)}? The requester will see your reason.</>;
      extra = <ReasonField value={reason} onChange={setReason} />;
      safeLabel = 'Cancel';
      commitLabel = 'Reject request';
      danger = true;
      icon = <XCircle className="h-5 w-5" aria-hidden />;
      break;
    case 'D25':
      title = 'Close business day?';
      description = <>Close {str(p.date)} with no variance? After close, today’s receipts can no longer be edited — corrections use reversal requests.</>;
      safeLabel = 'Save count';
      commitLabel = 'Submit close';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D26':
      title = 'Close with variance?';
      description = <>Cash variance of <span className="font-semibold text-danger">{money(p.variance)}</span> on {str(p.date)}. An explanation and reviewer name are required for audit.</>;
      extra = <ReasonField label="Explanation" value={reason} onChange={setReason} placeholder="Explain the variance…" />;
      safeLabel = 'Save count';
      commitLabel = 'Submit close with variance';
      danger = true;
      icon = <AlertTriangle className="h-5 w-5" aria-hidden />;
      break;
    case 'D27':
      title = 'Publish notice?';
      description = <>“{str(p.title)}” will be visible to <span className="font-semibold">{str(p.audience)}</span> in the parent and teacher apps from {str(p.publishDate)}.</>;
      safeLabel = 'Save draft';
      commitLabel = 'Publish notice';
      icon = <CheckCircle2 className="h-5 w-5" aria-hidden />;
      break;
    case 'D28':
      title = 'Create export';
      description = <>Generate <span className="font-semibold">{str(p.type)}</span>? You can download the file from the Export center for {useErp.getState().settings.exportRetentionDays} days.</>;
      safeLabel = 'Cancel';
      commitLabel = 'Create export';
      icon = <Loader2 className="h-5 w-5 animate-none" aria-hidden />;
      break;
    default:
      title = 'Confirm';
      description = null;
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) { close(); reset(); } }}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md gap-0 rounded-card p-5 sm:w-full" dir="ltr">
        <DialogHeader className="flex-row items-start gap-3 space-y-0 text-left">
          {icon && (
            <span className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              danger ? 'bg-danger-soft text-danger' : 'bg-brand/10 text-brand-dark',
            )}>
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <DialogTitle className="font-heading text-[16px] font-bold text-ink">{title}</DialogTitle>
            {description && <DialogDescription className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</DialogDescription>}
          </div>
        </DialogHeader>
        {extra && <div className="mt-4">{extra}</div>}
        <DialogFooter className="mt-5 flex-row gap-2 sm:justify-end">
          <Button variant="outline" className="flex-1 rounded-control sm:flex-none" onClick={() => { const s = st(); s.closeDialog(); reset(); }}>
            {safeLabel}
          </Button>
          <Button
            className={cn('flex-1 rounded-control sm:flex-none', danger && 'bg-danger text-white hover:bg-danger/90')}
            onClick={commit}
            disabled={dialog.id === 'D15' && num(p.unmarked) > 0}
          >
            {dialog.id === 'D15' && num(p.unmarked) > 0 ? 'Complete marking first' : commitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ErpCodeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <Input
      value={value}
      onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
      className="h-12 rounded-control text-center font-heading text-xl font-bold tracking-[0.5em]"
      inputMode="numeric"
      aria-label="Six-digit code"
      placeholder="••••••"
    />
  );
}
