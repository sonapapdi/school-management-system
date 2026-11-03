'use client';

import { useEffect, useMemo, useState } from 'react';
import { Save, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Field, PageHeader, PermissionState } from '@/components/erp/ui/primitives';
import type { StaffRole } from '@/lib/erp/types';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

const STAFF_ROLES: StaffRole[] = [
  'Principal', 'Admin Officer', 'Accountant', 'Receptionist', 'Class Teacher', 'Subject Teacher', 'Coordinator',
];

type FormState = {
  code: string;
  name: string;
  mobile: string;
  email: string;
  startDate: string;
  role: StaffRole;
  status: 'active' | 'inactive';
};

const MOBILE_RE = /^(\+91)?[6-9]\d{9}$/;
const mobileOk = (v: string) => MOBILE_RE.test(v.replace(/[\s-]/g, ''));

export default function W23AddStaff() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const params = useErp((s) => s.route.params);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const upsertStaff = useErp((s) => s.upsertStaff);

  const member = params.staffId ? data.staff.find((s) => s.id === params.staffId) : undefined;
  const permitted = member ? can(role, 'staff', 'update') : can(role, 'staff', 'create');

  const nextNumber = useMemo(() => {
    const nums = data.staff.map((s) => Number(s.code.split('-')[1])).filter((n) => !isNaN(n));
    return Math.max(0, ...nums) + 1;
  }, [data.staff]);

  const initial = useMemo<FormState>(
    () => ({
      code: member?.code ?? `STF-0${nextNumber}`,
      name: member?.name ?? '',
      mobile: member?.mobile ?? '',
      email: member?.email ?? '',
      startDate: member?.startDate ?? schoolDate,
      role: member?.role ?? 'Subject Teacher',
      status: member?.status ?? 'active',
    }),
    [member, nextNumber, schoolDate],
  );

  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<{ name?: string; mobile?: string; email?: string; startDate?: string }>({});

  useEffect(() => {
    setForm(initial);
  }, [initial]);

  if (!permitted) return <PermissionState module="Staff" />;

  const dirty =
    form.code !== initial.code || form.name !== initial.name || form.mobile !== initial.mobile ||
    form.email !== initial.email || form.startDate !== initial.startDate || form.role !== initial.role ||
    form.status !== initial.status;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const errs: typeof errors = {};
    if (!form.name.trim()) errs.name = 'Full name is required.';
    if (!mobileOk(form.mobile)) errs.mobile = 'Enter a valid 10-digit mobile number.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!form.startDate) errs.startDate = 'Start date is required.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const persist = (invite: boolean): string =>
    upsertStaff({
      id: member?.id,
      code: form.code.trim() || initial.code,
      name: form.name.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      startDate: form.startDate,
      role: form.role,
      status: form.status,
      invite,
    });

  const saveStaff = () => {
    if (!validate()) return;
    const id = persist(false);
    nav('W24', { staffId: id });
  };

  const saveAndInvite = () => {
    if (!validate()) return;
    persist(true); // store raises the "invite sent" toast
    nav('W22');
  };

  const cancel = () => {
    if (dirty) openDialog('D02', { discard: () => nav('W22') });
    else nav('W22');
  };

  return (
    <div>
      <PageHeader
        title={member ? `Edit staff — ${member.name}` : 'Add staff'}
        description={member ? `Update the record for ${member.code}. Changes apply immediately.` : 'Create a staff account. An invite can be sent right after saving.'}
        actions={
          <Button variant="ghost" className="rounded-control" onClick={cancel}>
            <X className="h-4 w-4" aria-hidden /> Cancel
          </Button>
        }
      />

      <Card className="mx-auto max-w-3xl rounded-card border-line bg-card shadow-sm">
        <div className="border-b border-line px-4 py-3">
          <h2 className="font-heading text-[15px] font-bold text-ink">{member ? 'Staff record' : 'New staff record'}</h2>
          <p className="text-[12px] text-muted-foreground">Fields marked * are required.</p>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2">
          <Field label="Staff code" hint={member ? 'Existing code — edit with care.' : `Auto-suggested ${initial.code} — you can change it.`}>
            <Input value={form.code} onChange={(e) => set('code', e.target.value)} className="rounded-control" aria-label="Staff code" />
          </Field>
          <Field label="Full name" required error={errors.name}>
            <Input
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="e.g. Anita Deshmukh"
              className="rounded-control"
              aria-label="Full name"
            />
          </Field>
          <Field label="Mobile" required error={errors.mobile} hint="10-digit number, with or without +91 prefix.">
            <Input
              value={form.mobile}
              onChange={(e) => set('mobile', e.target.value)}
              placeholder="+91 98220 12345"
              inputMode="tel"
              className="rounded-control"
              aria-label="Mobile number"
            />
          </Field>
          <Field label="Email" required error={errors.email}>
            <Input
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="name@sunrisepublic.edu.in"
              inputMode="email"
              className="rounded-control"
              aria-label="Email"
            />
          </Field>
          <Field label="Start date" required error={errors.startDate}>
            <input
              type="date"
              value={form.startDate}
              onChange={(e) => set('startDate', e.target.value)}
              className="h-9 w-full rounded-control border border-line bg-background px-2.5 text-[13px]"
              aria-label="Start date"
            />
          </Field>
          <Field label="Role">
            <Select value={form.role} onValueChange={(v) => set('role', v as StaffRole)}>
              <SelectTrigger className="h-9 rounded-control" aria-label="Role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAFF_ROLES.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={form.status} onValueChange={(v) => set('status', v as FormState['status'])}>
              <SelectTrigger className="h-9 rounded-control" aria-label="Status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-line px-4 py-3">
          <Button className="rounded-control" onClick={saveStaff}>
            <Save className="h-4 w-4" aria-hidden /> Save staff
          </Button>
          <Button variant="outline" className="rounded-control" onClick={saveAndInvite}>
            <Send className="h-4 w-4" aria-hidden /> Save and invite
          </Button>
          <Button variant="ghost" className="rounded-control" onClick={cancel}>
            Cancel
          </Button>
          {dirty && <span className="ml-auto text-[12px] font-medium text-[#8a5a00]">Unsaved changes</span>}
        </div>
      </Card>
    </div>
  );
}
