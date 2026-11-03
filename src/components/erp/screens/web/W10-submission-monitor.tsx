'use client';

import { CalendarDays, ClipboardCheck, Download, Percent, Send, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import {
  KpiCard, PageHeader, PermissionState, SkeletonCards, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { attendanceSummary, getStaff, gradeLabel, registerFor, rosterOf } from '@/lib/erp/derive';
import { downloadCsv, fmtDate, fmtDateTime, fmtPct, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { Section } from '@/lib/erp/types';

interface Row {
  section: Section;
  grade: string;
  teacher: string;
  students: number;
  status: string;
  submittedAt?: string;
}

export default function W10SubmissionMonitor() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const setSchoolDate = useErp((s) => s.setSchoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const addAuditEvent = useErp((s) => s.addAuditEvent);

  const loading = useFakeLoad(350);

  if (!can(role, 'attendance', 'view')) return <PermissionState module="Attendance" />;

  const rows: Row[] = data.sections
    .filter((sec) => sec.status === 'active')
    .map((section) => {
      const reg = registerFor(data, schoolDate, section.id);
      return {
        section,
        grade: gradeLabel(data, section.gradeId),
        teacher: getStaff(data, section.classTeacherId)?.name ?? 'Unassigned',
        students: rosterOf(data, section.id, ayId).length,
        status: reg?.status ?? 'Unmarked',
        submittedAt: reg?.submittedAt,
      };
    });

  const sum = attendanceSummary(data, schoolDate);
  const pending = Math.max(0, sum.totalSections - sum.submitted);

  const sendReminder = () => {
    const n = rows.filter((r) => r.status !== 'submitted').length;
    if (n === 0) {
      pushToast({ title: 'No reminders needed', description: 'Every section has submitted today.', variant: 'info' });
      return;
    }
    addAuditEvent('Sent reminder', 'Register', schoolDate);
    pushToast({ title: `Reminder sent to ${n} class teachers`, variant: 'success' });
  };

  const exportStatus = () => {
    downloadCsv(
      `submission-status-${schoolDate}.csv`,
      ['Grade', 'Section', 'Class teacher', 'Students', 'Status', 'Submitted at'],
      rows.map((r) => [
        r.grade, r.section.name, r.teacher, String(r.students),
        r.status === 'submitted' ? 'Submitted' : 'Pending', r.submittedAt ?? '',
      ]),
    );
    pushToast({ title: 'Export downloaded', description: 'Submission status CSV saved.', variant: 'info' });
  };

  return (
    <div>
      <PageHeader
        description={`Which sections have submitted the attendance register for ${fmtDate(schoolDate)}.`}
        actions={
          <>
            <label className="flex h-9 items-center gap-1.5 rounded-control border border-line bg-card px-2.5 text-[13px]">
              <CalendarDays className="h-4 w-4 text-muted-foreground" aria-hidden />
              <input
                type="date" value={schoolDate} min="2026-06-01" max="2026-07-21"
                onChange={(e) => e.target.value && setSchoolDate(e.target.value)}
                className="bg-transparent text-[13px] outline-none" aria-label="School date"
              />
            </label>
            <Button variant="outline" className="rounded-control" onClick={exportStatus}>
              <Download className="h-4 w-4" aria-hidden /> Export status
            </Button>
          </>
        }
      />

      {loading ? (
        <>
          <SkeletonCards count={3} />
          <div className="mt-5"><SkeletonTable rows={8} cols={6} /></div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <KpiCard
              label="Submitted" value={`${sum.submitted} of ${sum.totalSections}`}
              sub="Sections that filed the register today" icon={ClipboardCheck}
              tone={pending === 0 ? 'success' : 'warning'}
            />
            <KpiCard
              label="Attendance completion" value={fmtPct(sum.presentPct)}
              sub={`${sum.present} present of ${sum.marked} marked`} icon={Percent} tone="primary"
            />
            <KpiCard
              label="Pending sections" value={pending} sub="Registers not yet submitted"
              icon={Timer} tone={pending > 0 ? 'danger' : 'success'}
            />
          </div>

          <div className="mt-5">
            <DataTable<Row>
              rows={rows}
              rowKey={(r) => r.section.id}
              searchable={(r) => `${r.grade} ${r.section.name} ${r.teacher}`}
              searchPlaceholder="Search section or teacher…"
              filters={[
                {
                  key: 'grade', label: 'Grade',
                  options: data.grades.filter((g) => g.status === 'active').map((g) => ({ value: g.id, label: g.name })),
                  match: (r, v) => r.section.gradeId === v,
                },
                {
                  key: 'status', label: 'Status',
                  options: [{ value: 'submitted', label: 'Submitted' }, { value: 'pending', label: 'Pending' }],
                  match: (r, v) => (v === 'submitted' ? r.status === 'submitted' : r.status !== 'submitted'),
                },
              ]}
              toolbar={
                <Button size="sm" variant="outline" className="rounded-control" onClick={sendReminder}>
                  <Send className="h-3.5 w-3.5" aria-hidden /> Send reminder
                </Button>
              }
              emptyTitle="No sections match"
              columns={[
                { key: 'grade', header: 'Grade', render: (r) => r.grade, sortValue: (r) => r.grade },
                { key: 'section', header: 'Section', render: (r) => r.section.name, sortValue: (r) => r.section.name },
                { key: 'teacher', header: 'Class teacher', render: (r) => r.teacher, sortValue: (r) => r.teacher, hideBelow: 'md' },
                { key: 'students', header: 'Students', align: 'right', render: (r) => r.students, sortValue: (r) => r.students },
                {
                  key: 'status', header: 'Submission status',
                  render: (r) => <StatusChip status={r.status} />,
                  sortValue: (r) => (r.status === 'submitted' ? 0 : 1),
                },
                {
                  key: 'submittedAt', header: 'Submitted at', hideBelow: 'lg',
                  render: (r) => (r.submittedAt ? fmtDateTime(r.submittedAt) : '—'),
                  sortValue: (r) => r.submittedAt ?? '',
                },
                {
                  key: 'actions', header: '', align: 'right',
                  render: (r) => (
                    <Button
                      size="sm" variant="outline" className="rounded-control"
                      onClick={() => nav('W11', { date: schoolDate, sectionId: r.section.id })}
                    >
                      Open register
                    </Button>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
