'use client';

import {
  AlertTriangle, BarChart3, CalendarDays, CheckCircle2, ClipboardCheck, FileWarning,
  RefreshCw, Stamp, Users, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { PageHeader, KpiCard, Section, Timeline, StatusChip, AlertCard } from '@/components/erp/ui/primitives';
import { attendanceSummary, approvalQueue, collectionsOn, duesFor, overdueTotal, operationalAlerts, rosterOf, sectionLabel, studentName } from '@/lib/erp/derive';
import { fmtDate, fmtINR, fmtPct } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

export default function W01TodayDashboard() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const setSchoolDate = useErp((s) => s.setSchoolDate);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const ay = data.academicYears.find((a) => a.id === useErp.getState().ayId);

  const sum = attendanceSummary(data, schoolDate);
  const collections = collectionsOn(data, schoolDate);
  const overdue = overdueTotal(data, schoolDate);
  const approvals = approvalQueue(data, schoolDate);
  const alerts = operationalAlerts(data, schoolDate).filter((a) => !useErp.getState().reviewedAlerts.includes(a.id));
  const failedImports = data.imports.filter((i) => i.status === 'failed' || i.status === 'partial').length;
  const exceptions = data.payments.filter((p) => p.status === 'reversal_requested').length + data.students.filter((s) => s.status === 'active').length * 0;
  const ananyaDue = duesFor(data, 'stu-ananya', schoolDate);

  const timeline = data.audit.slice(0, 6).map((a) => ({
    title: a.action,
    description: `${a.resource} · ${a.resourceId}`,
    time: a.at.replace('T', ', '),
    actor: a.actor,
    tone: a.result === 'success' ? 'success' as const : a.result === 'denied' ? 'warning' as const : 'danger' as const,
  }));

  return (
    <div>
      <PageHeader
        title="Today"
        description={`${ay?.name ?? ''} · School date ${fmtDate(schoolDate)}`}
        status={<StatusChip status={sum.submitted === sum.totalSections ? 'submitted' : 'pending'} />}
        actions={
          <>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="rounded-control"><CalendarDays className="h-4 w-4" aria-hidden /> Change date</Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 rounded-card">
                <p className="mb-2 text-[12px] font-bold uppercase text-muted-foreground">School date</p>
                <input
                  type="date" value={schoolDate} min="2026-06-01" max="2026-07-21"
                  onChange={(e) => e.target.value && setSchoolDate(e.target.value)}
                  className="h-9 w-full rounded-control border border-line bg-background px-2.5 text-[13px]"
                  aria-label="Choose school date"
                />
                <p className="mt-2 text-[11.5px] text-muted-foreground">Dashboards, monitors and the collection desk follow this date.</p>
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="rounded-control" onClick={() => nav('W13')}><BarChart3 className="h-4 w-4" aria-hidden /> Open report</Button>
            <Button className="rounded-control" onClick={() => pushToast({ title: 'Refreshed', description: 'Dashboard data is up to date.', variant: 'success' })}>
              <RefreshCw className="h-4 w-4" aria-hidden /> Refresh
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Sections submitted" value={`${sum.submitted} of ${sum.totalSections}`} sub={`${sum.totalSections - sum.submitted} still pending today`} icon={ClipboardCheck} tone={sum.submitted === sum.totalSections ? 'success' : 'warning'} onClick={() => nav('W10')} />
        <KpiCard label="Total students" value={data.students.filter((s) => s.status === 'active').length.toLocaleString('en-IN')} sub={`${data.sections.length} sections · ${data.staff.length} staff`} icon={Users} onClick={() => nav('W03')} />
        <KpiCard label="Attendance completion" value={fmtPct(sum.presentPct)} sub={`${sum.present} present of ${sum.marked} marked`} icon={CheckCircle2} tone="primary" onClick={() => nav('W13')} />
        <KpiCard label="Collections today" value={fmtINR(collections)} sub="Verified payments posted" icon={Wallet} tone="success" onClick={() => nav('W36')} />
        <KpiCard label="Overdue fees" value={fmtINR(overdue)} sub="Past-due installments" icon={AlertTriangle} tone="danger" onClick={() => nav('W35')} />
        <KpiCard label="Fee exceptions" value={exceptions} sub="Reversals awaiting approval" icon={Stamp} tone={exceptions > 0 ? 'warning' : 'default'} onClick={() => nav('W20')} />
        <KpiCard label="Import problems" value={failedImports} sub={failedImports ? 'Batches need review' : 'No failed batches'} icon={FileWarning} tone={failedImports ? 'danger' : 'success'} onClick={() => nav('W09')} />
        <KpiCard label="Open approvals" value={approvals.length} sub="Corrections & fee requests" icon={Stamp} tone={approvals.length ? 'warning' : 'success'} onClick={() => nav('W38')} />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          <h2 className="font-heading text-[15px] font-bold text-ink">Operational alerts</h2>
          {alerts.length === 0 && (
            <div className="rounded-card border border-success/25 bg-success-soft/50 p-4 text-[13px] font-medium text-success">All clear — registers in, imports clean, approvals closed.</div>
          )}
          {alerts.slice(0, 4).map((a) => (
            <AlertCard
              key={a.id}
              severity={a.severity}
              title={a.title}
              detail={a.detail}
              owner={a.owner}
              age={a.age}
              status={a.status}
              action={a.action ? <Button size="sm" variant="outline" className="rounded-control" onClick={() => nav(a.action!.screen, a.action!.params)}>{a.action.label}</Button> : undefined}
              onReview={() => useErp.getState().markAlertReviewed(a.id)}
              reviewed={useErp.getState().reviewedAlerts.includes(a.id)}
            />
          ))}
          <div className="flex justify-end">
            <Button variant="ghost" size="sm" onClick={() => nav('W02')}>All alerts →</Button>
          </div>
        </div>

        <div className="space-y-5">
          <Section title="Recent activity" description="From the audit log">
            <Timeline items={timeline} />
          </Section>
          <Section title="Follow-up" description="Connected sample student">
            <div className="space-y-2 text-[13px]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink">{studentName(data, 'stu-ananya')}</span>
                <span className="text-muted-foreground">{sectionLabel(data, 's-7a')} · ADM-2026-0142</span>
              </div>
              {ananyaDue.due > 0 ? (
                <div className="flex items-center justify-between rounded-[10px] bg-danger-soft/60 px-3 py-2">
                  <span className="font-medium text-ink">Fee due {fmtINR(ananyaDue.due)}</span>
                  <Button size="sm" variant="outline" className="rounded-control" onClick={() => nav('W17', { studentId: 'stu-ananya' })}>Collect</Button>
                </div>
              ) : (
                <div className="rounded-[10px] bg-success-soft/60 px-3 py-2 font-medium text-success">No dues</div>
              )}
              {rosterOf(data, 's-7a', 'ay-2026-27').length > 0 && (
                <p className="text-[12px] text-muted-foreground">
                  Register {sectionLabel(data, 's-7a')} today: {useErp.getState().data.registers.find((r) => r.date === schoolDate && r.sectionId === 's-7a')?.status === 'submitted' ? 'Submitted' : 'Attendance pending'}
                </p>
              )}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}