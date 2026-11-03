'use client';

import { useState } from 'react';
import { Check, Minus, Pencil, RotateCcw, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, PermissionState, Section } from '@/components/erp/ui/primitives';
import { can } from '@/lib/erp/permissions';
import { ROLE_LABEL } from '@/lib/erp/tokens';
import { useErp } from '@/lib/erp/store';
import type { ModuleKey, PermAction, Role } from '@/lib/erp/types';
import { cn } from '@/lib/utils';

const ROLES: Role[] = ['platform_operator', 'school_admin', 'principal', 'receptionist', 'accountant', 'teacher', 'parent'];
const MODULES: ModuleKey[] = ['dashboard', 'students', 'attendance', 'fees', 'staff', 'academics', 'notices', 'reports', 'approvals', 'settings'];
const ACTIONS: { key: PermAction; label: string; short: string }[] = [
  { key: 'view', label: 'View', short: 'V' },
  { key: 'create', label: 'Create', short: 'C' },
  { key: 'update', label: 'Update', short: 'U' },
  { key: 'approve', label: 'Approve', short: 'A' },
  { key: 'export', label: 'Export', short: 'E' },
];

export default function W41Permissions() {
  const role = useErp((s) => s.session.role);
  const pushToast = useErp((s) => s.pushToast);
  const addAuditEvent = useErp((s) => s.addAuditEvent);

  const [selectedRole, setSelectedRole] = useState<Role>('school_admin');
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});

  const cellKey = (r: Role, m: ModuleKey, a: PermAction) => `${r}|${m}|${a}`;
  const effective = (r: Role, m: ModuleKey, a: PermAction): boolean => {
    const k = cellKey(r, m, a);
    return k in overrides ? overrides[k] : can(r, m, a);
  };
  const toggle = (r: Role, m: ModuleKey, a: PermAction) => {
    const k = cellKey(r, m, a);
    setOverrides((prev) => ({ ...prev, [k]: !effective(r, m, a) }));
  };

  if (!can(role, 'settings', 'view')) return <PermissionState module="Settings" />;

  const editing = editRole !== null;

  return (
    <div>
      <PageHeader
        title="Role-permission matrix"
        description="Module-level permissions for every role. Click a cell in edit mode to toggle it."
        actions={
          <>
            <Select value={selectedRole} onValueChange={(v) => setSelectedRole(v as Role)}>
              <SelectTrigger className="h-9 w-52 rounded-control" aria-label="Role to edit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_LABEL[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button
              variant={editing ? 'secondary' : 'outline'}
              className="rounded-control"
              onClick={() => {
                setEditRole(selectedRole);
                pushToast({ title: `Edit mode on — click cells for ${ROLE_LABEL[selectedRole]}`, variant: 'info' });
              }}
            >
              <Pencil className="h-4 w-4" aria-hidden /> Edit role
            </Button>
            <Button
              variant="outline" className="rounded-control"
              onClick={() => { setOverrides({}); pushToast({ title: 'Matrix reset to defaults', variant: 'info' }); }}
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Reset to default
            </Button>
            <Button
              className="rounded-control"
              onClick={() => {
                pushToast({ title: 'Permission matrix saved', variant: 'success' });
                addAuditEvent('Updated role permissions', 'Settings', 'matrix');
              }}
            >
              <Save className="h-4 w-4" aria-hidden /> Save
            </Button>
          </>
        }
      />

      <div className="mb-4 flex items-start gap-2.5 rounded-card border border-amber/30 bg-amber-soft px-4 py-3 text-[13px] font-medium text-[#8a5a00]">
        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Changes apply to the prototype UI immediately; the backend enforces the final matrix.
      </div>

      <Section
        title="Permissions by role"
        description={editing && editRole ? `Editing ${ROLE_LABEL[editRole]} — V view · C create · U update · A approve · E export` : 'V view · C create · U update · A approve · E export'}
        padded={false}
      >
        <div className="erp-scroll overflow-x-auto">
          <table className="w-full min-w-[1080px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="border-b border-line bg-[#FAFBFE]">
                <th scope="col" className="sticky left-0 z-10 bg-[#FAFBFE] px-3 py-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Role</th>
                {MODULES.map((m) => (
                  <th key={m} scope="colgroup" colSpan={ACTIONS.length} className="border-l border-line px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                    {m}
                  </th>
                ))}
              </tr>
              <tr className="border-b border-line bg-[#FAFBFE]">
                <th scope="col" className="sticky left-0 z-10 bg-[#FAFBFE] px-3 py-1.5" aria-label="Role name column" />
                {MODULES.map((m) => (
                  ACTIONS.map((a) => (
                    <th key={`${m}-${a.key}`} scope="col" title={`${m} — ${a.label}`} className="border-l border-line/60 px-0 py-1 text-center text-[10px] font-bold text-muted-foreground">
                      {a.short}
                    </th>
                  ))
                ))}
              </tr>
            </thead>
            <tbody>
              {ROLES.map((r) => {
                const rowEditing = editing && editRole === r;
                return (
                  <tr key={r} className={cn('border-b border-line/60 last:border-0', rowEditing && 'bg-brand/5')}>
                    <th scope="row" className="sticky left-0 z-10 bg-card px-3 py-2 text-left">
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <span className="font-semibold text-ink">{ROLE_LABEL[r]}</span>
                        {rowEditing && <span className="rounded-full bg-brand/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-dark">Editing</span>}
                      </span>
                    </th>
                    {MODULES.map((m) =>
                      ACTIONS.map((a) => {
                        const allowed = effective(r, m, a.key);
                        return (
                          <td key={`${r}-${m}-${a.key}`} className="border-l border-line/40 p-0 text-center">
                            <button
                              type="button"
                              disabled={!rowEditing}
                              onClick={() => toggle(r, m, a.key)}
                              aria-label={`${ROLE_LABEL[r]} — ${m} ${a.label} ${allowed ? 'granted' : 'not granted'}${rowEditing ? ' (click to toggle)' : ''}`}
                              className={cn(
                                'flex h-8 w-full items-center justify-center',
                                rowEditing ? 'cursor-pointer hover:bg-brand/10' : 'cursor-default',
                              )}
                            >
                              {allowed
                                ? <Check className="h-3.5 w-3.5 text-success" aria-hidden />
                                : <Minus className="h-3.5 w-3.5 text-line" aria-hidden />}
                            </button>
                          </td>
                        );
                      })
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
