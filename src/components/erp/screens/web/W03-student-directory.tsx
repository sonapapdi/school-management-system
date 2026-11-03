'use client';

import { Download, LayoutGrid, UserMinus, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { KpiCard, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { activeStudents, gradeLabel, sectionLabel } from '@/lib/erp/derive';
import type { Enrollment, Student } from '@/lib/erp/types';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { downloadCsv, initials, useFakeLoad } from '@/lib/erp/utils';

interface DirRow {
  s: Student;
  enr?: Enrollment;
  gradeId: string;
  gradeName: string;
  secLabel: string;
}

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'withdrawn', label: 'Withdrawn' },
  { value: 'archived', label: 'Archived' },
];

const cap = (v: string) => v.charAt(0).toUpperCase() + v.slice(1);

export default function W03StudentDirectory() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const loading = useFakeLoad(350);

  if (!can(role, 'students', 'view')) return <PermissionState module="Students" />;

  const canCreate = can(role, 'students', 'create');
  const canExport = can(role, 'students', 'export');

  const rows: DirRow[] = data.students.map((s) => {
    const active = data.enrollments.find((e) => e.studentId === s.id && e.ayId === ayId && e.status === 'active');
    const enr = active ?? [...data.enrollments.filter((e) => e.studentId === s.id)].sort((a, b) => b.start.localeCompare(a.start))[0];
    const gradeId = enr ? data.sections.find((sec) => sec.id === enr.sectionId)?.gradeId ?? '' : '';
    return {
      s,
      enr,
      gradeId,
      gradeName: gradeId ? gradeLabel(data, gradeId) : '—',
      secLabel: enr ? sectionLabel(data, enr.sectionId) : '—',
    };
  });

  const columns: Column<DirRow>[] = [
    {
      key: 'admNo',
      header: 'Admission number',
      render: (r) => <span className="font-mono text-[12.5px] font-semibold text-ink">{r.s.admNo}</span>,
      sortValue: (r) => r.s.admNo,
    },
    {
      key: 'name',
      header: 'Student name',
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand-dark">
            {initials(r.s.displayName)}
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{r.s.displayName}</span>
            <span className="block text-[11.5px] text-muted-foreground">GR {r.s.grNo}</span>
          </span>
        </div>
      ),
      sortValue: (r) => r.s.displayName,
    },
    { key: 'grade', header: 'Grade', render: (r) => r.gradeName, sortValue: (r) => r.gradeName, hideBelow: 'md' },
    { key: 'section', header: 'Section', render: (r) => r.secLabel, sortValue: (r) => r.secLabel },
    { key: 'roll', header: 'Roll', align: 'right', render: (r) => (r.enr ? <span className="tabular-nums">{r.enr.rollNo}</span> : '—'), sortValue: (r) => r.enr?.rollNo ?? 0, hideBelow: 'sm' },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.s.status} />, sortValue: (r) => r.s.status },
    {
      key: 'open',
      header: 'Actions',
      align: 'right',
      render: (r) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-control"
          onClick={(e) => { e.stopPropagation(); nav('W05', { studentId: r.s.id }); }}
        >
          Open profile
        </Button>
      ),
    },
  ];

  const exportList = () => {
    downloadCsv(
      'students.csv',
      ['Admission number', 'Student name', 'Grade', 'Section', 'Roll', 'Status'],
      rows.map((r) => [r.s.admNo, r.s.displayName, r.gradeName, r.secLabel, String(r.enr?.rollNo ?? ''), cap(r.s.status)]),
    );
  };

  return (
    <div>
      <PageHeader
        actions={
          <>
            {canExport && (
              <Button variant="outline" className="rounded-control" onClick={exportList}>
                <Download className="h-4 w-4" aria-hidden /> Export list
              </Button>
            )}
            {canCreate && (
              <Button variant="outline" className="rounded-control" onClick={() => nav('W08')}>
                <UserPlus className="h-4 w-4" aria-hidden /> Import students
              </Button>
            )}
            {canCreate && (
              <Button className="rounded-control" onClick={() => nav('W04')}>
                <UserPlus className="h-4 w-4" aria-hidden /> Add student
              </Button>
            )}
          </>
        }
      />

      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Active students" value={activeStudents(data).length.toLocaleString('en-IN')} sub="Enrolled in the current year" icon={Users} tone="primary" />
            <KpiCard label="Withdrawn" value={data.students.filter((s) => s.status === 'withdrawn').length} sub="Records kept, seats released" icon={UserMinus} tone="danger" />
            <KpiCard label="New admissions this AY" value={data.students.filter((s) => s.admissionDate >= '2026-04-01').length} sub="Admitted on or after 01 Apr 2026" icon={UserPlus} tone="success" />
            <KpiCard label="Sections" value={data.sections.filter((sec) => sec.status === 'active').length} sub="Active across all grades" icon={LayoutGrid} />
          </div>

          <div className="mt-5">
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(r) => r.s.id}
              searchable={(r) => `${r.s.admNo} ${r.s.displayName}`}
              searchPlaceholder="Search admission no or name…"
              filters={[
                { key: 'grade', label: 'Grades', options: data.grades.map((g) => ({ value: g.id, label: g.name })), match: (r, v) => r.gradeId === v },
                { key: 'section', label: 'Sections', options: data.sections.map((sec) => ({ value: sec.id, label: sectionLabel(data, sec.id) })), match: (r, v) => r.enr?.sectionId === v },
                { key: 'status', label: 'Statuses', options: STATUS_OPTIONS, match: (r, v) => r.s.status === v },
              ]}
              onRowClick={(r) => nav('W05', { studentId: r.s.id })}
              pageSize={10}
              emptyTitle="No students match"
              emptyDescription="Try clearing the search or filters to see the full directory."
            />
          </div>
        </>
      )}
    </div>
  );
}
