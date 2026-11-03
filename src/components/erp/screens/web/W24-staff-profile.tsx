'use client';

import { KeyRound, Pencil, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EmptyState, InfoRow, PageHeader, PermissionState, Section, StatusChip, Timeline } from '@/components/erp/ui/primitives';
import { assignmentsOf, sectionLabel } from '@/lib/erp/derive';
import { cn, initials } from '@/lib/utils';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

export default function W24StaffProfile() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const resetStaffAccess = useErp((s) => s.resetStaffAccess);
  const deactivateStaff = useErp((s) => s.deactivateStaff);

  if (!can(role, 'staff', 'view')) return <PermissionState module="Staff" />;

  const member = data.staff.find((s) => s.id === (params.staffId ?? 'stf-farah'));
  const canUpdate = can(role, 'staff', 'update');

  if (!member) {
    return (
      <div>
        <PageHeader title="Staff profile" />
        <EmptyState
          title="Staff member not found"
          description="This staff record does not exist or was removed."
          action={<Button className="rounded-control" onClick={() => nav('W22')}>Back to staff directory</Button>}
        />
      </div>
    );
  }

  const assigns = assignmentsOf(data, member.id);
  const activity = data.audit.filter((a) => a.actor === member.name).slice(0, 8);

  return (
    <div>
      <PageHeader
        title={member.name}
        description={`${member.role} · ${member.code} · Joined ${fmtDate(member.startDate)}`}
        status={<StatusChip status={member.status} />}
        actions={
          <>
            <Button variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => nav('W23', { staffId: member.id })}>
              <Pencil className="h-4 w-4" aria-hidden /> Edit profile
            </Button>
            <Button variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => resetStaffAccess(member.id)}>
              <KeyRound className="h-4 w-4" aria-hidden /> Reset access
            </Button>
            {member.status === 'active' && (
              <Button
                className="bg-danger text-white hover:bg-danger/90"
                disabled={!canUpdate}
                onClick={() => deactivateStaff(member.id)}
              >
                <UserX className="h-4 w-4" aria-hidden /> Deactivate
              </Button>
            )}
          </>
        }
      />

      {/* Identity header card */}
      <Card className="mb-4 rounded-card border-line bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-[16px] font-bold text-brand-dark">
            {initials(member.name)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-heading text-[16px] font-bold text-ink">{member.name}</p>
            <p className="truncate text-[12.5px] text-muted-foreground">{member.email} · {member.mobile}</p>
          </div>
          <StatusChip status={member.status} />
        </div>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Section title="Account" description="Login and identity details">
            <InfoRow label="Role" value={member.role} />
            <InfoRow label="Staff code" value={member.code} mono />
            <InfoRow label="Account status" value={<StatusChip status={member.status} />} />
            <InfoRow label="Start date" value={fmtDate(member.startDate)} />
            <InfoRow label="Last sign-in" value={member.lastSignIn ? fmtDateTime(member.lastSignIn) : 'Never signed in'} />
            <InfoRow label="Email" value={member.email} />
            <InfoRow label="Mobile" value={<span className="tabular-nums">{member.mobile}</span>} />
          </Section>

          <Section title="Assigned sections" description="Dated class-teacher and subject assignments">
            {assigns.length === 0 ? (
              <EmptyState
                title="No section assignments"
                description="This staff member has no dated section assignments yet."
                action={
                  canUpdate ? (
                    <Button size="sm" variant="outline" className="rounded-control" onClick={() => nav('W25', { staffId: member.id })}>
                      Open role &amp; assignment
                    </Button>
                  ) : undefined
                }
              />
            ) : (
              assigns.map((a) => (
                <div key={a.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-line/60 py-2.5 last:border-0">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink">{a.sectionId ? sectionLabel(data, a.sectionId) : '—'}</p>
                    <p className="text-[11.5px] text-muted-foreground">
                      {fmtDate(a.start)} – {a.end ? fmtDate(a.end) : 'Present'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">{a.type}</span>
                    {a.end ? (
                      <span className="inline-flex items-center rounded-full border border-line bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                        Ended
                      </span>
                    ) : (
                      <StatusChip status="active" />
                    )}
                  </div>
                </div>
              ))
            )}
          </Section>
        </div>

        <aside className="space-y-4">
          <Section title="Recent activity" description={`Audit trail for ${member.name}`}>
            <Timeline
              items={activity.map((a) => ({
                title: a.action,
                description: `${a.resource} · ${a.resourceId}`,
                time: fmtDateTime(a.at),
                actor: a.actor,
                tone: a.result === 'success' ? ('success' as const) : a.result === 'denied' ? ('warning' as const) : ('danger' as const),
              }))}
            />
          </Section>
          <div className={cn('rounded-card border border-line bg-muted/50 px-4 py-3 text-[12px] text-muted-foreground')}>
            Deactivation keeps the record and history but removes app access. Use it only when a staff member leaves.
          </div>
        </aside>
      </div>
    </div>
  );
}
