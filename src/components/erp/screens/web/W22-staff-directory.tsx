'use client';

import { GraduationCap, UserCheck, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from '@/components/erp/ui/table';
import { KpiCard, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { assignmentsOf, sectionLabel } from '@/lib/erp/derive';
import type { StaffMember, StaffRole } from '@/lib/erp/types';
import { initials } from '@/lib/utils';
import { fmtDateTime, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

const STAFF_ROLES: StaffRole[] = [
  'Principal', 'Admin Officer', 'Accountant', 'Receptionist', 'Class Teacher', 'Subject Teacher', 'Coordinator',
];

export default function W22StaffDirectory() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const loading = useFakeLoad(350);

  if (!can(role, 'staff', 'view')) return <PermissionState module="Staff" />;

  const canCreate = can(role, 'staff', 'create');
  const teachers = data.staff.filter((s) => s.role === 'Class Teacher' || s.role === 'Subject Teacher').length;
  const activeAccounts = data.staff.filter((s) => s.status === 'active').length;

  const columns: Column<StaffMember>[] = [
    { key: 'code', header: 'Staff code', render: (m) => <span className="font-semibold tabular-nums">{m.code}</span>, sortValue: (m) => m.code },
    {
      key: 'name',
      header: 'Name',
      render: (m) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand-dark">
            {initials(m.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{m.name}</p>
            <p className="truncate text-[11px] text-muted-foreground">{m.email}</p>
          </div>
        </div>
      ),
      sortValue: (m) => m.name,
    },
    { key: 'role', header: 'Role', render: (m) => m.role, sortValue: (m) => m.role },
    { key: 'mobile', header: 'Mobile', render: (m) => <span className="tabular-nums">{m.mobile}</span> },
    {
      key: 'section',
      header: 'Assigned section',
      render: (m) => {
        const active = assignmentsOf(data, m.id).find((a) => !a.end);
        return active?.sectionId ? sectionLabel(data, active.sectionId) : '—';
      },
    },
    {
      key: 'lastSignIn',
      header: 'Last sign-in',
      hideBelow: 'md',
      render: (m) => (m.lastSignIn ? fmtDateTime(m.lastSignIn) : '—'),
      sortValue: (m) => m.lastSignIn ?? '',
    },
    { key: 'status', header: 'Status', render: (m) => <StatusChip status={m.status} /> },
  ];

  return (
    <div>
      <PageHeader
        title="Staff directory"
        description="Every staff account with role, assignment and sign-in status."
        actions={
          <Button className="rounded-control" disabled={!canCreate} onClick={() => nav('W23')}>
            <UserPlus className="h-4 w-4" aria-hidden /> Add staff
          </Button>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiCard label="Total staff" value={data.staff.length} sub={`${STAFF_ROLES.length} role types`} icon={Users} />
        <KpiCard label="Teachers" value={teachers} sub="Class & subject teachers" icon={GraduationCap} tone="primary" />
        <KpiCard
          label="Active accounts"
          value={activeAccounts}
          sub={`${data.staff.length - activeAccounts} inactive`}
          icon={UserCheck}
          tone={activeAccounts === data.staff.length ? 'success' : 'warning'}
        />
      </div>

      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : (
        <DataTable
          rows={data.staff}
          columns={columns}
          rowKey={(m) => m.id}
          searchable={(m) => `${m.code} ${m.name} ${m.mobile}`}
          searchPlaceholder="Search code, name or mobile…"
          filters={[
            { key: 'role', label: 'Role', options: STAFF_ROLES.map((r) => ({ value: r, label: r })), match: (m, v) => m.role === v },
            {
              key: 'status',
              label: 'Status',
              options: [
                { value: 'active', label: 'Active' },
                { value: 'inactive', label: 'Inactive' },
              ],
              match: (m, v) => m.status === v,
            },
          ]}
          onRowClick={(m) => nav('W24', { staffId: m.id })}
          emptyTitle="No staff match"
          emptyDescription="Try clearing the search or filters."
        />
      )}
    </div>
  );
}
