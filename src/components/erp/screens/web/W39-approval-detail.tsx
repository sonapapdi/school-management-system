'use client';

import { ArrowLeft, MessageSquareWarning } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MarkChip, PageHeader, PermissionState, Section, StatusChip, Timeline, EmptyState, InfoRow, Money } from '@/components/erp/ui/primitives';
import { sectionLabel, studentName } from '@/lib/erp/derive';
import { fmtDate, fmtDateTime, fmtINR } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

export default function W39ApprovalDetail() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);
  const addAuditEvent = useErp((s) => s.addAuditEvent);

  const kind = params.kind === 'fee' ? 'fee' : 'correction';
  const id = params.id ?? '';
  const correction = kind === 'correction' ? data.corrections.find((c) => c.id === id) : undefined;
  const fee = kind === 'fee' ? data.feeRequests.find((f) => f.id === id) : undefined;

  if (!can(role, 'approvals', 'view')) return <PermissionState module="Approvals" />;

  if (!correction && !fee) {
    return (
      <div>
        <PageHeader title="Approval detail" onBack={() => nav('W38')} />
        <EmptyState
          title="Request not found"
          description="This request may have been removed. Go back to the approval queue."
          action={<Button variant="outline" className="rounded-control" onClick={() => nav('W38')}><ArrowLeft className="h-4 w-4" aria-hidden /> Back to queue</Button>}
        />
      </div>
    );
  }

  const rec = correction ?? fee;
  const status = rec!.status;
  const requestedBy = rec!.requestedBy;
  const title = correction
    ? `Attendance correction ${correction.no}`
    : fee!.type === 'reversal' ? 'Payment reversal' : 'Fee adjustment';
  const ref = correction?.no ?? fee!.id;
  const student = studentName(data, rec!.studentId);
  const canApprove = can(role, 'approvals', 'approve') && status === 'pending';

  const requestClarification = () => {
    pushToast({ title: `Clarification requested from ${requestedBy}`, variant: 'info' });
    addAuditEvent('Requested clarification', 'Approval', id);
  };

  const timeline = [
    { title: 'Requested', description: requestedBy, time: fmtDateTime(rec!.requestedAt), tone: 'info' as const },
    status === 'approved'
      ? { title: 'Approved', description: correction?.resolutionNote, time: fmtDateTime(rec!.resolvedAt), actor: rec!.reviewer, tone: 'success' as const }
      : status === 'rejected'
        ? { title: 'Rejected', description: correction?.resolutionNote, time: fmtDateTime(rec!.resolvedAt), actor: rec!.reviewer, tone: 'danger' as const }
        : { title: 'Pending review', description: 'Awaiting an approver decision.', tone: 'warning' as const },
  ];

  return (
    <div>
      <PageHeader
        title={title}
        status={<StatusChip status={status} />}
        onBack={() => nav('W38')}
        description={correction
          ? `${student} · Register ${sectionLabel(data, correction.sectionId)} · ${fmtDate(correction.date)}`
          : `${student} · ${fee!.originalRef}`}
        actions={
          <>
            <Button variant="outline" className="rounded-control" onClick={requestClarification}>
              <MessageSquareWarning className="h-4 w-4" aria-hidden /> Request clarification
            </Button>
            {canApprove && (
              <>
                <Button
                  variant="outline"
                  className="rounded-control text-danger hover:text-danger hover:bg-danger-soft"
                  onClick={() => openDialog('D24', { kind, id, title, requestedBy })}
                >
                  Reject
                </Button>
                <Button
                  className="rounded-control"
                  onClick={() => openDialog('D23', { kind, id, title, requestedBy })}
                >
                  Approve
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section title="Original vs proposed" description="What changed and why it needs approval">
            {correction ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-card border border-line bg-page p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Original value</p>
                  <div className="mt-2"><MarkChip mark={correction.from} /></div>
                  <p className="mt-3 text-[13px] font-semibold text-ink">{student}</p>
                  <p className="text-[12px] text-muted-foreground">Register {sectionLabel(data, correction.sectionId)}</p>
                  <p className="text-[12px] text-muted-foreground">School date {fmtDate(correction.date)}</p>
                </div>
                <div className="rounded-card border border-line bg-card p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Proposed value</p>
                  <div className="mt-2"><MarkChip mark={correction.to} /></div>
                  <p className="mt-3 text-[13px] font-semibold text-ink">{student}</p>
                  <p className="text-[12px] text-muted-foreground">Register {sectionLabel(data, correction.sectionId)}</p>
                  <p className="text-[12px] text-muted-foreground">Applies immediately after approval</p>
                </div>
              </div>
            ) : fee ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-card border border-line bg-page p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Original transaction</p>
                  <p className="mt-2 font-mono text-[13px] font-semibold text-ink">{fee.originalRef}</p>
                  <p className="mt-1"><Money value={fee.amount} className="text-[15px]" /></p>
                  <p className="mt-3 text-[12px] text-muted-foreground">{student}</p>
                  <p className="text-[12px] text-muted-foreground">{fee.type === 'reversal' ? 'Posted payment' : 'Posted charge'}</p>
                </div>
                <div className="rounded-card border border-line bg-card p-4">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Proposed change</p>
                  <p className="mt-2 text-[13px] font-semibold text-ink">{fee.type === 'reversal' ? 'Reverse this payment' : 'Reduce charge amount'}</p>
                  <p className="mt-1"><Money value={-fee.amount} className="text-[15px]" /></p>
                  <p className="mt-3 text-[12px] text-muted-foreground">{student}</p>
                  <p className="text-[12px] text-muted-foreground">Ledger updates only after approval</p>
                </div>
              </div>
            ) : null}
          </Section>

          <Section title="Request & review">
            <div className="grid gap-x-8 sm:grid-cols-2">
              <div>
                <InfoRow label="Requested by" value={requestedBy} />
                <InfoRow label="Requested at" value={fmtDateTime(rec!.requestedAt)} />
                <InfoRow label="Reference" value={<span className="font-mono text-[12px]">{ref}</span>} mono />
              </div>
              <div>
                <InfoRow label="Reviewer" value={rec!.reviewer ?? 'Pending review'} />
                <InfoRow label="Resolved at" value={rec!.resolvedAt ? fmtDateTime(rec!.resolvedAt) : '—'} />
                <InfoRow label="Student" value={student} />
              </div>
            </div>
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Reason">
            <p className="text-[13px] leading-relaxed text-ink-soft">{rec!.reason}</p>
            {correction?.resolutionNote && status !== 'pending' && (
              <div className="mt-3 rounded-[10px] bg-muted px-3 py-2">
                <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Resolution note</p>
                <p className="mt-0.5 text-[12.5px] text-ink-soft">{correction.resolutionNote}</p>
              </div>
            )}
          </Section>

          <Section title="Evidence">
            <p className="text-[13px] italic leading-relaxed text-muted-foreground">
              {correction?.note ?? 'Supporting note from requester'}
            </p>
            {fee && (
              <p className="mt-2 text-[12px] text-muted-foreground">
                Amount in request: <span className="font-semibold text-ink">{fmtINR(fee.amount)}</span>
              </p>
            )}
          </Section>

          <Section title="Approval timeline">
            <Timeline items={timeline} />
          </Section>
        </div>
      </div>
    </div>
  );
}
