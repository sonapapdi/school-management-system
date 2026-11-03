'use client';

import { useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { Money, PageHeader, PermissionState, Section, SkeletonTable } from '@/components/erp/ui/primitives';
import { activeStudents, chargePaid, getGrade, getSection } from '@/lib/erp/derive';
import { daysBetween, downloadCsv, fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

interface DuesRow {
  id: string;
  name: string;
  admNo: string;
  gradeSection: string;
  gradeId: string;
  sectionId: string;
  dueDate: string;
  overdue: number;
  days: number;
}

export default function W35FeeDues() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const setSchoolDate = useErp((s) => s.setSchoolDate);
  const role = useErp((s) => s.session.role);
  const loading = useFakeLoad(350);

  const [grade, setGrade] = useState('all');
  const [section, setSection] = useState('all');
  const [student, setStudent] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [applied, setApplied] = useState({ grade: 'all', section: 'all', student: '', minAmount: '' });

  const baseRows = useMemo<DuesRow[]>(() => {
    const out: DuesRow[] = [];
    for (const st of activeStudents(data)) {
      const unpaid = data.charges
        .filter((c) => c.studentId === st.id && c.status === 'posted' && c.dueDate <= schoolDate)
        .map((c) => ({ dueDate: c.dueDate, rem: Math.max(0, c.amount - chargePaid(data, c.id)) }))
        .filter((x) => x.rem > 0);
      const overdue = unpaid.reduce((t, x) => t + x.rem, 0);
      if (overdue <= 0) continue;
      const dueDate = unpaid.map((x) => x.dueDate).sort()[0] ?? '';
      const enr = data.enrollments.find((e) => e.studentId === st.id && e.status === 'active');
      const sec = getSection(data, enr?.sectionId ?? '');
      out.push({
        id: st.id,
        name: st.displayName,
        admNo: st.admNo,
        gradeSection: sec ? `${getGrade(data, sec.gradeId)}-${sec.name}` : '—',
        gradeId: sec?.gradeId ?? '',
        sectionId: sec?.id ?? '',
        dueDate,
        overdue,
        days: dueDate ? Math.max(0, daysBetween(dueDate, schoolDate)) : 0,
      });
    }
    return out.sort((a, b) => b.overdue - a.overdue);
  }, [data, schoolDate]);

  const rows = useMemo(() => {
    const min = Number(minAmount) > 0 ? Number(minAmount) : 0;
    const q = applied.student.trim().toLowerCase();
    return baseRows.filter((r) =>
      (applied.grade === 'all' || r.gradeId === applied.grade)
      && (applied.section === 'all' || r.sectionId === applied.section)
      && (!q || r.name.toLowerCase().includes(q) || r.admNo.toLowerCase().includes(q))
      && r.overdue >= min);
  }, [baseRows, applied]);

  const totalOverdue = rows.reduce((t, r) => t + r.overdue, 0);
  const activeGrades = data.grades.filter((g) => g.status === 'active');
  const activeSections = data.sections.filter((s) => s.status === 'active' && (grade === 'all' || s.gradeId === grade));

  const columns: Column<DuesRow>[] = [
    {
      key: 'student', header: 'Student', sortValue: (r) => r.name,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.name}</p>
          <p className="text-[11.5px] text-muted-foreground">{r.admNo}</p>
        </div>
      ),
    },
    { key: 'gradeSection', header: 'Grade-Section', sortValue: (r) => r.gradeSection },
    { key: 'dueDate', header: 'Due date', sortValue: (r) => r.dueDate, render: (r) => fmtDate(r.dueDate) },
    { key: 'overdue', header: 'Amount due', align: 'right', sortValue: (r) => r.overdue, render: (r) => <Money value={r.overdue} /> },
    {
      key: 'days', header: 'Days overdue', align: 'right', sortValue: (r) => r.days,
      render: (r) => <span className={r.days > 30 ? 'font-bold text-danger' : 'font-semibold text-[#8a5a00]'}>{r.days}</span>,
    },
  ];

  if (!can(role, 'reports', 'view')) return <PermissionState module="Reports" />;

  return (
    <div>
      <PageHeader
        title="Fee dues report"
        description="Overdue installments per student as of the selected date, with days overdue."
      />

      <Section title="Filters" description="Applied when you press Apply filters. The as-of date applies immediately.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w35-asof">As-of date</label>
            <input
              id="w35-asof" type="date" value={schoolDate} max="2026-07-21" min="2026-06-01"
              onChange={(e) => e.target.value && setSchoolDate(e.target.value)}
              className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft">Grade</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="h-9 rounded-control"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All grades</SelectItem>
                {activeGrades.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft">Section</label>
            <Select value={section} onValueChange={setSection}>
              <SelectTrigger className="h-9 rounded-control"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sections</SelectItem>
                {activeSections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{`${getGrade(data, s.gradeId)}-${s.name}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w35-student">Student</label>
            <Input id="w35-student" value={student} onChange={(e) => setStudent(e.target.value)} placeholder="Name or admission no" className="h-9 rounded-control" />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w35-min">Min amount (₹)</label>
            <Input id="w35-min" type="number" min={0} value={minAmount} onChange={(e) => setMinAmount(e.target.value)} placeholder="0" className="h-9 rounded-control" />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button className="rounded-control" onClick={() => setApplied({ grade, section, student, minAmount })}>Apply filters</Button>
          <Button
            variant="outline" className="rounded-control"
            onClick={() => downloadCsv(
              'fee-dues-report.csv',
              ['Admission number', 'Student', 'Grade-Section', 'Due date', 'Amount due', 'Days overdue'],
              rows.map((r) => [r.admNo, r.name, r.gradeSection, fmtDate(r.dueDate), String(r.overdue), String(r.days)]),
            )}
          >
            Export CSV
          </Button>
          <Button variant="outline" className="rounded-control" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden /> Print
          </Button>
        </div>
      </Section>

      <div className="print-area mt-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-card px-4 py-3 shadow-sm">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">Total overdue</p>
            <p className="text-[12px] text-muted-foreground">{rows.length} student{rows.length === 1 ? '' : 's'} with overdue dues · as of {fmtDate(schoolDate)}</p>
          </div>
          <Money value={totalOverdue} className="font-heading text-xl text-danger" />
        </div>
        {loading ? (
          <SkeletonTable rows={8} cols={5} />
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            pageSize={12}
            emptyTitle="No overdue dues"
            emptyDescription="No student has unpaid installments past the due date for these filters."
          />
        )}
      </div>
    </div>
  );
}
