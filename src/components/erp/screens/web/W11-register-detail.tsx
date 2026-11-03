'use client';

import { useState } from 'react';
import { ClipboardCheck, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import {
  EmptyState, Field, MarkChip, PageHeader, PermissionState, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { getSection, getStaff, registerFor, rosterOf, sectionLabel, studentName } from '@/lib/erp/derive';
import { downloadCsv, fmtDate, fmtDateTime, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { MarkCode } from '@/lib/erp/types';

const MARK_LABEL: Record<MarkCode, string> = { P: 'Present', A: 'Absent', L: 'Leave' };

export default function W11RegisterDetail() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const userName = useErp((s) => s.session.userName);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerStudent, setPickerStudent] = useState('');
  const [pickerTo, setPickerTo] = useState<MarkCode>('P');

  const loading = useFakeLoad(350);

  if (!can(role, 'attendance', 'view')) return <PermissionState module="Attendance" />;

  const date = params.date ?? schoolDate;
  const sectionId = params.sectionId ?? 's-7a';

  const reg = registerFor(data, date, sectionId);
  const roster = rosterOf(data, sectionId, ayId);
  const teacher = getStaff(data, getSection(data, sectionId)?.classTeacherId)?.name ?? 'Unassigned';
  const submitted = reg?.status === 'submitted';
  const canCorrect = can(role, 'attendance', 'update');

  const requestCorrection = () => {
    const from = reg?.marks[pickerStudent];
    if (!from || !reg) return;
    openDialog('D16', {
      date, sectionId, studentId: pickerStudent,
      studentName: studentName(data, pickerStudent),
      from, fromLabel: MARK_LABEL[from],
      to: pickerTo, toLabel: MARK_LABEL[pickerTo],
      dateLabel: fmtDate(date), requestedBy: userName,
    });
  };

  const exportCsv = () => {
    if (!reg) return;
    downloadCsv(
      `register-${date}-${sectionId}.csv`,
      ['Roll number', 'Student', 'Status', 'Reason', 'Submitted by'],
      roster.map(({ enrollment, student }) => {
        const mark = reg.marks[student.id];
        return [
          String(enrollment.rollNo), student.displayName,
          mark ? MARK_LABEL[mark] : 'Unmarked',
          reg.reasons[student.id] ?? '', reg.submittedBy ?? '',
        ];
      }),
    );
  };

  return (
    <div>
      <PageHeader
        title={`Register — ${sectionLabel(data, sectionId)}`}
        description={`${fmtDate(date)} · Class teacher ${teacher}`}
        status={submitted ? <StatusChip status="Submitted" /> : <StatusChip status="Unmarked" />}
        onBack={() => nav('W10', { date: schoolDate })}
        actions={
          submitted ? (
            <>
              <Button
                variant="outline" className="rounded-control"
                onClick={() => window.print()}
              >
                <Printer className="h-4 w-4" aria-hidden /> Print register
              </Button>
              <Button variant="outline" className="rounded-control" onClick={exportCsv}>
                <Download className="h-4 w-4" aria-hidden /> Export
              </Button>
              {canCorrect && (
                <Button className="rounded-control" onClick={() => setPickerOpen((o) => !o)}>
                  Request correction
                </Button>
              )}
              <Button
                variant="ghost" size="sm" className="rounded-control text-muted-foreground"
                onClick={() => openDialog('D17', { date, sectionId })}
              >
                Simulate change elsewhere
              </Button>
            </>
          ) : undefined
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={5} />
      ) : !reg || !submitted ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Register not submitted yet"
          description={`${sectionLabel(data, sectionId)} has not submitted the register for ${fmtDate(date)}. Marks appear here once the class teacher submits.`}
          action={
            <Button variant="outline" className="rounded-control" onClick={() => nav('W10', { date: schoolDate })}>
              Back to submission monitor
            </Button>
          }
        />
      ) : (
        <>
          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                { label: 'Submitted by', value: reg.submittedBy ?? '—' },
                { label: 'Submitted at', value: reg.submittedAt ? fmtDateTime(reg.submittedAt) : '—' },
                { label: 'Revision', value: `v${reg.revision}` },
                { label: 'Students', value: String(roster.length) },
              ].map((m) => (
                <div key={m.label}>
                  <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{m.label}</p>
                  <p className="mt-0.5 text-[14px] font-semibold text-ink">{m.value}</p>
                </div>
              ))}
            </div>
          </Card>

          {pickerOpen && canCorrect && (
            <Card className="mt-4 rounded-card border border-brand/30 bg-brand/5 p-4 shadow-sm">
              <p className="mb-3 text-[13px] font-bold text-ink">Request a mark correction</p>
              <div className="grid items-start gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Student">
                  <Select value={pickerStudent} onValueChange={setPickerStudent}>
                    <SelectTrigger className="rounded-control bg-background" aria-label="Student">
                      <SelectValue placeholder="Choose student" />
                    </SelectTrigger>
                    <SelectContent>
                      {roster.map(({ enrollment, student }) => (
                        <SelectItem key={student.id} value={student.id}>
                          Roll {enrollment.rollNo} — {student.displayName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Existing status">
                  <div className="flex h-9 items-center rounded-control border border-line bg-background px-3">
                    {pickerStudent && reg.marks[pickerStudent]
                      ? <MarkChip mark={reg.marks[pickerStudent]} />
                      : <span className="text-[13px] text-muted-foreground">Pick a student first</span>}
                  </div>
                </Field>
                <Field label="Requested status">
                  <Select value={pickerTo} onValueChange={(v) => setPickerTo(v as MarkCode)}>
                    <SelectTrigger className="rounded-control bg-background" aria-label="Requested status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(Object.keys(MARK_LABEL) as MarkCode[]).map((m) => (
                        <SelectItem key={m} value={m}>{MARK_LABEL[m]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <div className="flex items-end pt-1">
                  <Button
                    className="w-full rounded-control"
                    disabled={!pickerStudent || !reg.marks[pickerStudent] || reg.marks[pickerStudent] === pickerTo}
                    onClick={requestCorrection}
                  >
                    Submit request
                  </Button>
                </div>
              </div>
              <p className="mt-2 text-[12px] text-muted-foreground">
                The reason is asked in the next step. The office approves or rejects the change.
              </p>
            </Card>
          )}

          <div className="print-area mt-4">
            <DataTable
              rows={roster}
              rowKey={(r) => r.student.id}
              searchable={(r) => `${r.enrollment.rollNo} ${r.student.displayName}`}
              searchPlaceholder="Search roster…"
              pageSize={30}
              columns={[
                { key: 'roll', header: 'Roll number', render: (r) => r.enrollment.rollNo, sortValue: (r) => r.enrollment.rollNo },
                { key: 'name', header: 'Student name', render: (r) => <span className="font-semibold text-ink">{r.student.displayName}</span>, sortValue: (r) => r.student.displayName },
                { key: 'status', header: 'Status', render: (r) => <MarkChip mark={reg.marks[r.student.id] ?? 'unmarked'} /> },
                { key: 'reason', header: 'Reason', render: (r) => reg.reasons[r.student.id] ?? '—' },
                { key: 'by', header: 'Submitted by', render: () => reg.submittedBy ?? '—' },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
