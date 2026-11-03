'use client';

import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import { Field, PageHeader, PermissionState, SkeletonTable } from '@/components/erp/ui/primitives';
import { activeEnrollmentOf, assignmentsOf, getSection, getStudent, sectionLabel } from '@/lib/erp/derive';
import { addDays, downloadCsv, fmtDate, fmtPct, useFakeLoad } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

type Band = 'all' | 'lt75' | 'b7590' | 'gt90';
type MarkFilter = 'all' | 'P' | 'A' | 'L';

interface Filters {
  from: string;
  to: string;
  grade: string;
  section: string;
  student: string;
  status: MarkFilter;
  band: Band;
}

interface ReportRow {
  studentId: string;
  name: string;
  admNo: string;
  gradeSection: string;
  present: number;
  absent: number;
  leave: number;
  marked: number;
  pct: number;
}

const BAND_LABEL: Record<Band, string> = { all: 'All', lt75: '< 75%', b7590: '75–90%', gt90: '> 90%' };

export default function W13AttendanceReport() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);

  const [draft, setDraft] = useState<Filters>(() => ({
    from: addDays(schoolDate, -6), to: schoolDate, grade: 'all', section: 'all', student: '', status: 'all', band: 'all',
  }));
  const [applied, setApplied] = useState<Filters>(draft);

  const loading = useFakeLoad(350);

  if (!can(role, 'attendance', 'view')) return <PermissionState module="Attendance" />;

  const draftSections = data.sections.filter(
    (sec) => sec.status === 'active' && (draft.grade === 'all' || sec.gradeId === draft.grade),
  );

  const from = applied.from <= applied.to ? applied.from : applied.to;
  const to = applied.from <= applied.to ? applied.to : applied.from;
  const taughtSections = role === 'teacher'
    ? new Set(assignmentsOf(data, 'stf-farah').map((a) => a.sectionId).filter((x): x is string => !!x))
    : null;

  const acc = new Map<string, ReportRow>();
  for (const reg of data.registers) {
    if (reg.status !== 'submitted' || reg.date < from || reg.date > to) continue;
    if (taughtSections && !taughtSections.has(reg.sectionId)) continue;
    const sec = getSection(data, reg.sectionId);
    if (!sec) continue;
    if (applied.grade !== 'all' && sec.gradeId !== applied.grade) continue;
    if (applied.section !== 'all' && sec.id !== applied.section) continue;
    for (const [studentId, mark] of Object.entries(reg.marks)) {
      let row = acc.get(studentId);
      if (!row) {
        const student = getStudent(data, studentId);
        if (!student) continue;
        const enrSectionId = activeEnrollmentOf(data, studentId, ayId)?.sectionId ?? reg.sectionId;
        row = {
          studentId, name: student.displayName, admNo: student.admNo,
          gradeSection: sectionLabel(data, enrSectionId),
          present: 0, absent: 0, leave: 0, marked: 0, pct: 0,
        };
        acc.set(studentId, row);
      }
      if (mark === 'P') row.present += 1;
      else if (mark === 'A') row.absent += 1;
      else if (mark === 'L') row.leave += 1;
      row.marked += 1;
    }
  }

  let rows = [...acc.values()];
  for (const row of rows) row.pct = row.marked > 0 ? (row.present / row.marked) * 100 : 0;
  if (applied.status !== 'all') {
    rows = rows.filter((r) => (applied.status === 'P' ? r.present : applied.status === 'A' ? r.absent : r.leave) > 0);
  }
  if (applied.band === 'lt75') rows = rows.filter((r) => r.pct < 75);
  else if (applied.band === 'b7590') rows = rows.filter((r) => r.pct >= 75 && r.pct <= 90);
  else if (applied.band === 'gt90') rows = rows.filter((r) => r.pct > 90);
  if (applied.student.trim()) {
    const q = applied.student.trim().toLowerCase();
    rows = rows.filter((r) => r.name.toLowerCase().includes(q) || r.admNo.toLowerCase().includes(q));
  }
  rows.sort((a, b) => a.name.localeCompare(b.name));

  const exportCsv = () => {
    downloadCsv(
      `attendance-report-${from}-to-${to}.csv`,
      ['Student', 'Admission no', 'Grade-Section', 'Present', 'Absent', 'Leave', 'Marked', 'Attendance %'],
      rows.map((r) => [r.name, r.admNo, r.gradeSection, String(r.present), String(r.absent), String(r.leave), String(r.marked), r.pct.toFixed(1)]),
    );
  };

  return (
    <div>
      <PageHeader
        description={`Attendance percentages across submitted registers, ${fmtDate(from)} – ${fmtDate(to)}${role === 'teacher' ? ' · your sections only' : ''}.`}
      />

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : (
        <>
          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="From">
                <input
                  type="date" value={draft.from} max={draft.to}
                  onChange={(e) => setDraft((d) => ({ ...d, from: e.target.value }))}
                  className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px]"
                  aria-label="From date"
                />
              </Field>
              <Field label="To">
                <input
                  type="date" value={draft.to} min={draft.from} max={schoolDate}
                  onChange={(e) => setDraft((d) => ({ ...d, to: e.target.value }))}
                  className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px]"
                  aria-label="To date"
                />
              </Field>
              <Field label="Grade">
                <Select value={draft.grade} onValueChange={(v) => setDraft((d) => ({ ...d, grade: v, section: 'all' }))}>
                  <SelectTrigger className="rounded-control bg-background" aria-label="Grade"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All grades</SelectItem>
                    {data.grades.filter((g) => g.status === 'active').map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Section">
                <Select value={draft.section} onValueChange={(v) => setDraft((d) => ({ ...d, section: v }))}>
                  <SelectTrigger className="rounded-control bg-background" aria-label="Section"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All sections</SelectItem>
                    {draftSections.map((sec) => (
                      <SelectItem key={sec.id} value={sec.id}>{sectionLabel(data, sec.id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Student">
                <Input
                  value={draft.student} onChange={(e) => setDraft((d) => ({ ...d, student: e.target.value }))}
                  placeholder="Name or admission no" className="rounded-control bg-background" aria-label="Student"
                />
              </Field>
              <Field label="Status">
                <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as MarkFilter }))}>
                  <SelectTrigger className="rounded-control bg-background" aria-label="Status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="P">Present</SelectItem>
                    <SelectItem value="A">Absent</SelectItem>
                    <SelectItem value="L">Leave</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Percentage band">
                <Select value={draft.band} onValueChange={(v) => setDraft((d) => ({ ...d, band: v as Band }))}>
                  <SelectTrigger className="rounded-control bg-background" aria-label="Percentage band"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(BAND_LABEL) as Band[]).map((b) => (
                      <SelectItem key={b} value={b}>{BAND_LABEL[b]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-end gap-2">
                <Button className="rounded-control" onClick={() => setApplied(draft)}>Apply filters</Button>
                <Button
                  variant="ghost" className="rounded-control"
                  onClick={() => {
                    const reset: Filters = { from: addDays(schoolDate, -6), to: schoolDate, grade: 'all', section: 'all', student: '', status: 'all', band: 'all' };
                    setDraft(reset);
                    setApplied(reset);
                  }}
                >
                  Reset
                </Button>
              </div>
            </div>
          </Card>

          <div className="print-area mt-5">
            <DataTable<ReportRow>
              rows={rows}
              rowKey={(r) => r.studentId}
              pageSize={12}
              toolbar={
                <>
                  <Button size="sm" variant="outline" className="rounded-control" onClick={exportCsv}>
                    <Download className="h-3.5 w-3.5" aria-hidden /> Export CSV
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-control" onClick={() => window.print()}>
                    <Printer className="h-3.5 w-3.5" aria-hidden /> Print
                  </Button>
                </>
              }
              emptyTitle="No attendance in this range"
              emptyDescription="Try widening the date range or clearing filters."
              columns={[
                {
                  key: 'student', header: 'Student',
                  render: (r) => (
                    <div>
                      <p className="font-semibold text-ink">{r.name}</p>
                      <p className="text-[11.5px] text-muted-foreground">{r.admNo}</p>
                    </div>
                  ),
                  sortValue: (r) => r.name,
                },
                { key: 'gs', header: 'Grade-Section', render: (r) => r.gradeSection, sortValue: (r) => r.gradeSection },
                { key: 'present', header: 'Present', align: 'right', render: (r) => r.present, sortValue: (r) => r.present },
                { key: 'absent', header: 'Absent', align: 'right', render: (r) => r.absent, sortValue: (r) => r.absent },
                { key: 'leave', header: 'Leave', align: 'right', render: (r) => r.leave, sortValue: (r) => r.leave, hideBelow: 'md' },
                { key: 'marked', header: 'Marked', align: 'right', render: (r) => r.marked, sortValue: (r) => r.marked, hideBelow: 'md' },
                {
                  key: 'pct', header: 'Attendance %', align: 'right',
                  render: (r) => <span className={cn('font-semibold', r.pct < 75 && 'text-danger')}>{fmtPct(r.pct)}</span>,
                  sortValue: (r) => r.pct,
                },
              ]}
            />
          </div>
        </>
      )}
    </div>
  );
}
