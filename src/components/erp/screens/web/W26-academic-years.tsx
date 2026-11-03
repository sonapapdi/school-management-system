'use client';

import { useState } from 'react';
import { Archive, CalendarClock, CalendarRange, Layers, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/erp/ui/table';
import {
  Field, KpiCard, LockedHint, PageHeader, PermissionState, Section, SkeletonCards, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import type { AcademicYear } from '@/lib/erp/types';

export default function W26AcademicYears() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const activateYear = useErp((s) => s.activateYear);
  const closeYear = useErp((s) => s.closeYear);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const [showForm, setShowForm] = useState(false);
  const [yearName, setYearName] = useState('2027-28');
  const [start, setStart] = useState('2027-04-01');
  const [end, setEnd] = useState('2028-03-31');

  if (!can(role, 'academics', 'view')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Academics" />
      </div>
    );
  }

  const canUpdate = can(role, 'academics', 'update');
  const activeYear = data.academicYears.find((a) => a.id === ayId);
  const upcomingCount = data.academicYears.filter((a) => a.status === 'upcoming').length;
  const closedCount = data.academicYears.filter((a) => a.status === 'closed').length;

  const saveForm = () => {
    setShowForm(false);
    pushToast({
      title: 'Year 2027-28 is already provisioned in this prototype.',
      description: 'Year creation is available in the full release.',
      variant: 'info',
    });
  };

  const columns: Column<AcademicYear>[] = [
    { key: 'name', header: 'Year', render: (y) => <span className="font-semibold text-ink">{y.name}</span>, sortValue: (y) => y.name },
    { key: 'start', header: 'Start date', render: (y) => fmtDate(y.start), sortValue: (y) => y.start },
    { key: 'end', header: 'End date', render: (y) => fmtDate(y.end), sortValue: (y) => y.end, hideBelow: 'md' },
    { key: 'status', header: 'Status', render: (y) => <StatusChip status={y.status} /> },
    {
      key: 'workspace', header: 'Workspace', render: (y) => (y.id === ayId ? (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-[12px] font-semibold text-success">
          <span className="h-2 w-2 rounded-full bg-success" aria-hidden /> Current workspace
        </span>
      ) : (
        <span className="text-muted-foreground">—</span>
      )),
    },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (y) => (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-control" disabled={y.status === 'closed' || !canUpdate} onClick={() => activateYear(y.id)}>
            Activate year
          </Button>
          <Button size="sm" variant="outline" className="rounded-control" disabled={y.status === 'closed' || !canUpdate} onClick={() => closeYear(y.id)}>
            Close year
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Academic years"
        actions={!canUpdate ? (
          <LockedHint>Activating or closing years needs update permission</LockedHint>
        ) : (
          <Button className="rounded-control" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden /> Create year
          </Button>
        )}
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCards count={4} />
          <SkeletonTable rows={4} cols={5} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard
              label="Active year"
              value={activeYear?.name ?? '—'}
              sub={`${fmtDate(activeYear?.start)} → ${fmtDate(activeYear?.end)}`}
              icon={CalendarRange}
              tone="primary"
            />
            <KpiCard label="Total years" value={data.academicYears.length} sub="Configured for this school" icon={Layers} />
            <KpiCard label="Upcoming" value={upcomingCount} sub="Ready to activate" icon={CalendarClock} tone="teal" />
            <KpiCard label="Closed" value={closedCount} sub="Archived, read-only" icon={Archive} />
          </div>

          {showForm && canUpdate && (
            <Section title="Create year" description="New years are provisioned by the platform in this prototype." className="mt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Year name" required>
                  <Input value={yearName} onChange={(e) => setYearName(e.target.value)} placeholder="e.g. 2027-28" className="rounded-control bg-background" />
                </Field>
                <Field label="Start date">
                  <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} className="rounded-control bg-background" aria-label="Start date" />
                </Field>
                <Field label="End date">
                  <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} className="rounded-control bg-background" aria-label="End date" />
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="rounded-control" onClick={saveForm}>Create year</Button>
                <Button variant="ghost" className="rounded-control" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Section>
          )}

          <div className="mt-4">
            <DataTable
              rows={data.academicYears}
              columns={columns}
              rowKey={(y) => y.id}
              emptyTitle="No academic years"
              emptyDescription="Academic years will appear here."
            />
          </div>
        </>
      )}
    </div>
  );
}
