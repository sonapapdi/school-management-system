'use client';

import { useState } from 'react';
import { Check, Minus, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { EmptyState, Field, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { sectionLabel } from '@/lib/erp/derive';
import type { Guardian } from '@/lib/erp/types';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';

type Relationship = Guardian['relationship'];

export default function W06Guardians() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const verifyGuardian = useErp((s) => s.verifyGuardian);
  const revokeParentAccess = useErp((s) => s.revokeParentAccess);
  const addGuardian = useErp((s) => s.addGuardian);
  const loading = useFakeLoad(350);

  const studentId = params.studentId ?? 'stu-ananya';
  const student = data.students.find((s) => s.id === studentId);

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<{ name: string; relationship: Relationship; mobile: string; email: string; communicationAllowed: boolean; appAccess: boolean }>({
    name: '',
    relationship: 'Father',
    mobile: '',
    email: '',
    communicationAllowed: true,
    appAccess: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});

  if (!can(role, 'students', 'view')) return <PermissionState module="Students" />;

  const canUpdate = can(role, 'students', 'update');

  if (!student) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          title="Student not found"
          description="Open a student profile first to manage guardians."
          action={<Button className="rounded-control" onClick={() => nav('W03')}>Open directory</Button>}
        />
      </div>
    );
  }

  const guardians = data.guardians.filter((g) => g.studentId === student.id);

  const saveGuardian = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Guardian name is required.';
    if (!/^\d{10}$/.test(form.mobile.trim())) e.mobile = 'Mobile must be 10 digits.';
    setFormErrors(e);
    if (Object.keys(e).length > 0) return;
    addGuardian({
      studentId: student.id,
      name: form.name.trim(),
      relationship: form.relationship,
      mobile: form.mobile.trim(),
      email: form.email.trim() || undefined,
      communicationAllowed: form.communicationAllowed,
      appAccess: form.appAccess,
    });
    setForm({ name: '', relationship: 'Father', mobile: '', email: '', communicationAllowed: true, appAccess: true });
    setShowAdd(false);
  };

  const columns: Column<Guardian>[] = [
    { key: 'name', header: 'Guardian name', render: (g) => <span className="font-semibold text-ink">{g.name}</span>, sortValue: (g) => g.name },
    { key: 'relationship', header: 'Relationship', render: (g) => g.relationship, sortValue: (g) => g.relationship },
    { key: 'mobile', header: 'Mobile', render: (g) => <span className="tabular-nums">{g.mobile}</span>, sortValue: (g) => g.mobile },
    { key: 'email', header: 'Email', render: (g) => g.email ?? '—', sortValue: (g) => g.email ?? '', hideBelow: 'md' },
    {
      key: 'comm',
      header: 'Communication allowed',
      render: (g) => (
        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold ${g.communicationAllowed ? 'border-success/20 bg-success-soft text-success' : 'border-line bg-muted text-muted-foreground'}`}>
          {g.communicationAllowed ? 'Yes' : 'No'}
        </span>
      ),
      sortValue: (g) => (g.communicationAllowed ? 1 : 0),
    },
    { key: 'app', header: 'App access', render: (g) => <StatusChip status={g.appAccess ? 'Active' : 'Inactive'} />, sortValue: (g) => (g.appAccess ? 1 : 0) },
    { key: 'end', header: 'Access end date', render: (g) => (g.appAccessEnd ? fmtDate(g.appAccessEnd) : '—'), sortValue: (g) => g.appAccessEnd ?? '', hideBelow: 'lg' },
    {
      key: 'verified',
      header: 'Verified',
      align: 'center',
      render: (g) => (g.verified ? <Check className="mx-auto h-4 w-4 text-success" aria-label="Verified" /> : <Minus className="mx-auto h-4 w-4 text-muted-foreground" aria-label="Not verified" />),
      sortValue: (g) => (g.verified ? 1 : 0),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (g) => (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-control" disabled={g.verified} onClick={() => verifyGuardian(g.id)}>
            Verify contact
          </Button>
          {canUpdate && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-control"
              disabled={g.appAccess}
              onClick={() => openDialog('D11', { guardianId: g.id, name: g.name })}
            >
              Invite parent
            </Button>
          )}
          {canUpdate && g.appAccess && (
            <Button size="sm" variant="outline" className="rounded-control text-danger" onClick={() => revokeParentAccess(g.id)}>
              Revoke access
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={student.displayName}
        description={`${sectionLabel(data, data.enrollments.find((e) => e.studentId === student.id && e.status === 'active')?.sectionId ?? '')} · ${student.admNo} · ${guardians.length} guardian${guardians.length === 1 ? '' : 's'}`}
        actions={
          canUpdate ? (
            <Button className="rounded-control" onClick={() => { setShowAdd((v) => !v); setFormErrors({}); }}>
              <UserPlus className="h-4 w-4" aria-hidden /> Add guardian
            </Button>
          ) : undefined
        }
      />

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : (
        <>
          {showAdd && canUpdate && (
            <div className="mb-5 rounded-card border border-brand/25 bg-brand/5 p-4">
              <p className="font-heading text-[15px] font-bold text-ink">Add guardian</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">The first verified guardian with app access receives the parent invitation.</p>
              <div className="mt-3.5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Guardian name" required error={formErrors.name}>
                  <Input value={form.name} onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormErrors((x) => ({ ...x, name: undefined })); }} placeholder="e.g. Sneha Patil" className="rounded-control bg-background" aria-label="Guardian name" />
                </Field>
                <Field label="Relationship" required>
                  <Select value={form.relationship} onValueChange={(v) => setForm({ ...form, relationship: v as Relationship })}>
                    <SelectTrigger className="rounded-control" aria-label="Relationship"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Father">Father</SelectItem>
                      <SelectItem value="Mother">Mother</SelectItem>
                      <SelectItem value="Guardian">Guardian</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Mobile" required error={formErrors.mobile} hint="10 digits, no country code">
                  <Input
                    value={form.mobile}
                    onChange={(e) => { setForm({ ...form, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) }); setFormErrors((x) => ({ ...x, mobile: undefined })); }}
                    inputMode="numeric"
                    placeholder="e.g. 9822044321"
                    className="rounded-control bg-background"
                    aria-label="Mobile"
                  />
                </Field>
                <Field label="Email">
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-control bg-background" aria-label="Email" />
                </Field>
                <div className="flex items-center justify-between rounded-control border border-line bg-background px-3 py-2.5">
                  <span className="text-[13px] font-semibold text-ink-soft">Communication allowed</span>
                  <Switch checked={form.communicationAllowed} onCheckedChange={(v) => setForm({ ...form, communicationAllowed: v })} aria-label="Communication allowed" />
                </div>
                <div className="flex items-center justify-between rounded-control border border-line bg-background px-3 py-2.5">
                  <span className="text-[13px] font-semibold text-ink-soft">App access</span>
                  <Switch checked={form.appAccess} onCheckedChange={(v) => setForm({ ...form, appAccess: v })} aria-label="App access" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button className="rounded-control" onClick={saveGuardian}>Save guardian</Button>
                <Button variant="ghost" className="rounded-control" onClick={() => { setShowAdd(false); setFormErrors({}); }}>Cancel</Button>
              </div>
            </div>
          )}

          <DataTable
            rows={guardians}
            columns={columns}
            rowKey={(g) => g.id}
            searchable={(g) => `${g.name} ${g.mobile} ${g.email ?? ''}`}
            searchPlaceholder="Search guardian…"
            pageSize={5}
            emptyTitle="No guardians linked"
            emptyDescription="Add at least one guardian so the school can communicate and invite parents to the app."
          />
        </>
      )}
    </div>
  );
}
