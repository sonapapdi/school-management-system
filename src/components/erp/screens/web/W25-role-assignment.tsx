'use client';

import { useState } from 'react';
import { Lock, Plus, Save, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { DataTable, type Column } from '@/components/erp/ui/table';
import { Field, PageHeader, PermissionState, Section, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { getGrade, sectionLabel } from '@/lib/erp/derive';
import type { StaffAssignment, StaffMember, StaffRole } from '@/lib/erp/types';
import { initials } from '@/lib/utils';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

const STAFF_ROLES: StaffRole[] = [
  'Principal', 'Admin Officer', 'Accountant', 'Receptionist', 'Class Teacher', 'Subject Teacher', 'Coordinator',
];
const ASSIGNMENT_TYPES: StaffAssignment['type'][] = ['Class Teacher', 'Subject Teacher', 'Substitute'];

export default function W25RoleAssignment() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const params = useErp((s) => s.route.params);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const endAssignment = useErp((s) => s.endAssignment);
  const addAssignment = useErp((s) => s.addAssignment);
  const upsertStaff = useErp((s) => s.upsertStaff);
  const loading = useFakeLoad(350);
  const selectedId = params.staffId ?? 'stf-farah';
  const member: StaffMember | undefined = data.staff.find((s) => s.id === selectedId);

  /* Add assignment form */
  const [formRole, setFormRole] = useState<StaffRole>(member?.role ?? 'Subject Teacher');
  const [gradeId, setGradeId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [assignType, setAssignType] = useState<StaffAssignment['type']>('Class Teacher');
  const [start, setStart] = useState(schoolDate);
  const [end, setEnd] = useState('');
  const [sectionError, setSectionError] = useState<string | undefined>(undefined);

  /* Change role */
  const [newRole, setNewRole] = useState<StaffRole>(member?.role ?? 'Class Teacher');

  /* Re-seed the form when the selected staff member changes (render-time reset) */
  const [resetFor, setResetFor] = useState(member?.id);
  if (resetFor !== member?.id) {
    setResetFor(member?.id);
    setFormRole(member?.role ?? 'Subject Teacher');
    setNewRole(member?.role ?? 'Class Teacher');
    setGradeId('');
    setSectionId('');
    setSectionError(undefined);
  }

  if (!can(role, 'staff', 'view')) return <PermissionState module="Staff" />;

  const canUpdate = can(role, 'staff', 'update');
  const assigns = data.assignments.filter((a) => a.staffId === selectedId);
  const staffByName = [...data.staff].sort((a, b) => a.name.localeCompare(b.name));

  const sectionOptions = data.sections.filter((s) => s.gradeId === gradeId && s.status === 'active');

  const submitAssignment = () => {
    if (!sectionId) {
      setSectionError('Select a section.');
      return;
    }
    setSectionError(undefined);
    addAssignment({
      staffId: selectedId,
      gradeId: gradeId || undefined,
      sectionId,
      type: assignType,
      start: start || schoolDate,
      end: end || undefined,
    });
    setSectionId('');
    setEnd('');
  };

  const changeRole = () => {
    if (!member) return;
    upsertStaff({
      id: member.id,
      code: member.code,
      name: member.name,
      mobile: member.mobile,
      email: member.email,
      startDate: member.startDate,
      role: newRole,
      status: member.status,
    });
  };

  const columns: Column<StaffAssignment>[] = [
    { key: 'role', header: 'Role', render: () => member?.role ?? '—' },
    { key: 'grade', header: 'Grade', render: (a) => (a.gradeId ? getGrade(data, a.gradeId) : '—') },
    { key: 'section', header: 'Section', render: (a) => (a.sectionId ? sectionLabel(data, a.sectionId) : '—') },
    { key: 'type', header: 'Assignment type', render: (a) => <span className="font-semibold">{a.type}</span> },
    { key: 'start', header: 'Start date', render: (a) => fmtDate(a.start), sortValue: (a) => a.start },
    { key: 'end', header: 'End date', render: (a) => (a.end ? fmtDate(a.end) : '—'), sortValue: (a) => a.end ?? '' },
    {
      key: 'status',
      header: 'Status',
      render: (a) =>
        a.end ? (
          <span className="inline-flex items-center rounded-full border border-line bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            Ended
          </span>
        ) : (
          <StatusChip status="active" />
        ),
      sortValue: (a) => (a.end ? 'ended' : 'active'),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      render: (a) => (
        <Button
          size="sm"
          variant="outline"
          className="rounded-control"
          disabled={!!a.end || !canUpdate}
          onClick={() => endAssignment(a.id, schoolDate)}
        >
          End assignment
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Role & assignment"
        description="Dated class-teacher and subject assignments. End an assignment instead of deleting it — history stays intact."
      />

      {/* Staff picker */}
      <Card className="mb-4 rounded-card border-line bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-[13px] font-bold text-brand-dark">
            {member ? initials(member.name) : '—'}
          </span>
          <div className="min-w-0">
            <p className="truncate font-heading text-[14.5px] font-bold text-ink">{member?.name ?? 'Select a staff member'}</p>
            <p className="truncate text-[12px] text-muted-foreground">{member ? `${member.code} · ${member.role}` : '—'}</p>
          </div>
          <div className="ml-auto w-full sm:w-72">
            <Select value={selectedId} onValueChange={(v) => nav('W25', { staffId: v })}>
              <SelectTrigger className="h-9 rounded-control" aria-label="Pick staff member">
                <SelectValue placeholder="Pick staff member" />
              </SelectTrigger>
              <SelectContent>
                {staffByName.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} — {s.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <Section title={`Assignments — ${member?.name ?? '—'}`} description="Active and ended assignments for the selected staff member" className="mb-4">
        {loading ? (
          <SkeletonTable rows={4} cols={6} />
        ) : (
          <DataTable
            rows={assigns}
            columns={columns}
            rowKey={(a) => a.id}
            searchable={(a) => `${a.type} ${a.start} ${a.end ?? ''}`}
            pageSize={8}
            emptyTitle="No assignments yet"
            emptyDescription="Use the form below to add the first assignment."
          />
        )}
      </Section>

      {canUpdate ? (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <Card className="rounded-card border-line bg-card shadow-sm">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-heading text-[15px] font-bold text-ink">Add assignment</h2>
              <p className="text-[12px] text-muted-foreground">Assignments are dated — set an end date only if it is known.</p>
            </div>
            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <Field label="Role">
                <Select value={formRole} onValueChange={(v) => setFormRole(v as StaffRole)}>
                  <SelectTrigger className="h-9 rounded-control" aria-label="Role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Grade">
                <Select
                  value={gradeId}
                  onValueChange={(v) => { setGradeId(v); setSectionId(''); setSectionError(undefined); }}
                >
                  <SelectTrigger className="h-9 rounded-control" aria-label="Grade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                  <SelectContent>
                    {data.grades.filter((g) => g.status === 'active').map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Section" required error={sectionError}>
                <Select value={sectionId} onValueChange={(v) => { setSectionId(v); setSectionError(undefined); }}>
                  <SelectTrigger className="h-9 rounded-control" aria-label="Section">
                    <SelectValue placeholder={gradeId ? 'Select section' : 'Pick a grade first'} />
                  </SelectTrigger>
                  <SelectContent>
                    {sectionOptions.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{sectionLabel(data, s.id)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Assignment type">
                <Select value={assignType} onValueChange={(v) => setAssignType(v as StaffAssignment['type'])}>
                  <SelectTrigger className="h-9 rounded-control" aria-label="Assignment type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ASSIGNMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Start date">
                <input
                  type="date"
                  value={start}
                  onChange={(e) => setStart(e.target.value)}
                  className="h-9 w-full rounded-control border border-line bg-background px-2.5 text-[13px]"
                  aria-label="Start date"
                />
              </Field>
              <Field label="End date" hint="Optional — leave empty for an ongoing assignment.">
                <input
                  type="date"
                  value={end}
                  onChange={(e) => setEnd(e.target.value)}
                  className="h-9 w-full rounded-control border border-line bg-background px-2.5 text-[13px]"
                  aria-label="End date"
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
              <Button className="rounded-control" onClick={submitAssignment}>
                <Plus className="h-4 w-4" aria-hidden /> Add assignment
              </Button>
              <Button variant="outline" className="rounded-control" onClick={() => pushToast({ title: 'Assignment saved', variant: 'success' })}>
                <Save className="h-4 w-4" aria-hidden /> Save
              </Button>
            </div>
          </Card>

          <Card className="rounded-card border-line bg-card shadow-sm">
            <div className="border-b border-line px-4 py-3">
              <h2 className="font-heading text-[15px] font-bold text-ink">Change role</h2>
              <p className="text-[12px] text-muted-foreground">
                {member ? `Currently ${member.role}. Changing the role updates the directory immediately.` : 'Pick a staff member first.'}
              </p>
            </div>
            <div className="p-4">
              <Field label="New role" hint="Existing assignments are kept; use End assignment to close them.">
                <Select value={newRole} onValueChange={(v) => setNewRole(v as StaffRole)}>
                  <SelectTrigger className="h-9 rounded-control" aria-label="New role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAFF_ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Button className="mt-4 rounded-control" disabled={!member || newRole === member.role} onClick={changeRole}>
                <UserCog className="h-4 w-4" aria-hidden /> Change role
              </Button>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-card border border-line bg-muted/50 px-4 py-3 text-[12.5px] text-muted-foreground">
          <Lock className="h-4 w-4 shrink-0" aria-hidden />
          Your role can view assignments but not change them. Sign in as a role with staff update permission to edit.
        </div>
      )}
    </div>
  );
}
