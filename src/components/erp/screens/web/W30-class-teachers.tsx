'use client';

import { useState } from 'react';
import { UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column, type TableFilter } from '@/components/erp/ui/table';
import {
  Field, LockedHint, PageHeader, PermissionState, Section, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { gradeLabel } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import type { Section as SectionRow, StaffAssignment } from '@/lib/erp/types';

type JoinedRow = {
  a: StaffAssignment;
  staffName: string;
  staffCode: string;
  sec?: SectionRow;
};

function TypeChip({ type }: { type: string }) {
  return type === 'Class Teacher' ? (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">Class Teacher</span>
  ) : (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-amber/25 bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-[#8a5a00]">Substitute</span>
  );
}

export default function W30ClassTeachers() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const addAssignment = useErp((s) => s.addAssignment);
  const endAssignment = useErp((s) => s.endAssignment);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<'Class Teacher' | 'Substitute'>('Class Teacher');
  const [staffId, setStaffId] = useState('');
  const [gradeId, setGradeId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');

  if (!can(role, 'academics', 'view')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Academics" />
      </div>
    );
  }

  const canUpdate = can(role, 'academics', 'update');

  const rows: JoinedRow[] = data.assignments
    .filter((a) => a.type === 'Class Teacher' || a.type === 'Substitute')
    .map((a) => {
      const staff = data.staff.find((st) => st.id === a.staffId);
      const sec = a.sectionId ? data.sections.find((sc) => sc.id === a.sectionId) : undefined;
      return { a, staffName: staff?.name ?? '—', staffCode: staff?.code ?? '', sec };
    });

  const sectionsOfGrade = data.sections.filter((sc) => sc.gradeId === gradeId && sc.status === 'active');

  const openForm = (type: 'Class Teacher' | 'Substitute') => {
    setFormType(type);
    setFormOpen(true);
  };

  const submitForm = () => {
    if (!staffId || !gradeId || !sectionId || !start) {
      pushToast({ title: 'Teacher, grade, section and start date are required.', variant: 'error' });
      return;
    }
    addAssignment({ staffId, gradeId, sectionId, type: formType, start, end: end || undefined });
    setFormOpen(false);
    setStaffId('');
    setGradeId('');
    setSectionId('');
    setStart('');
    setEnd('');
  };

  const filters: TableFilter<JoinedRow>[] = [
    {
      key: 'grade',
      label: 'Grade',
      options: data.grades.map((g) => ({ value: g.id, label: g.name })),
      match: (row, value) => (row.a.gradeId ?? row.sec?.gradeId) === value,
    },
    {
      key: 'type',
      label: 'Type',
      options: [
        { value: 'Class Teacher', label: 'Class Teacher' },
        { value: 'Substitute', label: 'Substitute' },
      ],
      match: (row, value) => row.a.type === value,
    },
  ];

  const columns: Column<JoinedRow>[] = [
    {
      key: 'teacher', header: 'Teacher', render: (r) => (
        <div>
          <p className="font-semibold text-ink">{r.staffName}</p>
          {r.staffCode && <p className="text-[11px] text-muted-foreground">{r.staffCode}</p>}
        </div>
      ), sortValue: (r) => r.staffName,
    },
    { key: 'grade', header: 'Grade', render: (r) => (r.a.gradeId ? gradeLabel(data, r.a.gradeId) : r.sec ? gradeLabel(data, r.sec.gradeId) : '—') },
    { key: 'section', header: 'Section', render: (r) => (r.sec ? <span className="font-semibold text-ink">{r.sec.name}</span> : '—') },
    { key: 'type', header: 'Assignment type', render: (r) => <TypeChip type={r.a.type} /> },
    { key: 'start', header: 'Start date', render: (r) => fmtDate(r.a.start), sortValue: (r) => r.a.start, hideBelow: 'sm' },
    { key: 'end', header: 'End date', render: (r) => (r.a.end ? fmtDate(r.a.end) : 'Ongoing') },
    { key: 'status', header: 'Status', render: (r) => <StatusChip status={r.a.end && r.a.end < schoolDate ? 'Closed' : 'Active'} /> },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (r) => (!r.a.end ? (
        <Button size="sm" variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => endAssignment(r.a.id, schoolDate)}>
          End assignment
        </Button>
      ) : (
        <span className="text-muted-foreground">—</span>
      )),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Class-teacher assignments"
        actions={!canUpdate ? (
          <LockedHint>Assignments need update permission</LockedHint>
        ) : (
          <>
            <Button variant="outline" className="rounded-control" onClick={() => openForm('Class Teacher')}>
              <UserPlus className="h-4 w-4" aria-hidden /> Assign teacher
            </Button>
            <Button variant="outline" className="rounded-control" onClick={() => openForm('Substitute')}>
              <Users className="h-4 w-4" aria-hidden /> Add substitute
            </Button>
          </>
        )}
      />

      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <>
          {formOpen && canUpdate && (
            <Section
              title={formType === 'Substitute' ? 'Add substitute' : 'Assign teacher'}
              description="Dated assignment — an end date keeps the history intact."
            >
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Assignment type">
                  <Select value={formType} onValueChange={(v) => setFormType(v as 'Class Teacher' | 'Substitute')}>
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Assignment type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Class Teacher">Class Teacher</SelectItem>
                      <SelectItem value="Substitute">Substitute</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Teacher" required>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Teacher">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.staff.filter((st) => st.status === 'active').map((st) => (
                        <SelectItem key={st.id} value={st.id}>{st.name} · {st.code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Grade" required>
                  <Select
                    value={gradeId}
                    onValueChange={(v) => { setGradeId(v); setSectionId(''); }}
                  >
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.grades.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Section" required>
                  <Select value={sectionId} onValueChange={setSectionId} disabled={!gradeId}>
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Section">
                      <SelectValue placeholder={gradeId ? 'Select section' : 'Choose grade first'} />
                    </SelectTrigger>
                    <SelectContent>
                      {sectionsOfGrade.map((sc) => (
                        <SelectItem key={sc.id} value={sc.id}>{gradeLabel(data, sc.gradeId)}-{sc.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Start date" required>
                  <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-control bg-background" aria-label="Start date" />
                </Field>
                <Field label="End date" hint="Leave empty for an ongoing assignment.">
                  <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-control bg-background" aria-label="End date" />
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="rounded-control" onClick={submitForm}>Save assignment</Button>
                <Button variant="ghost" className="rounded-control" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </Section>
          )}

          <div className="mt-4">
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(r) => r.a.id}
              filters={filters}
              emptyTitle="No assignments"
              emptyDescription="Assign a class teacher to get started."
            />
          </div>
        </>
      )}
    </div>
  );
}
