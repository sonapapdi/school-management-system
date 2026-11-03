'use client';

import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { KpiCard, PageHeader, PermissionState, Section, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { downloadCsv, fmtDateTime, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { AuditEvent } from '@/lib/erp/types';

export default function W44AuditLog() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const loading = useFakeLoad(350);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [applied, setApplied] = useState({ from: '', to: '' });

  const rows = useMemo(() => data.audit.filter((a) => {
    const d = a.at.slice(0, 10);
    if (applied.from && d < applied.from) return false;
    if (applied.to && d > applied.to) return false;
    return true;
  }), [data.audit, applied]);

  const eventsToday = data.audit.filter((a) => a.at.slice(0, 10) === schoolDate).length;
  const denied = data.audit.filter((a) => a.result === 'denied').length;
  const failed = data.audit.filter((a) => a.result === 'failed').length;

  const actors = [...new Set(data.audit.map((a) => a.actor))].sort();
  const actions = [...new Set(data.audit.map((a) => a.action))].sort();

  const columns: Column<AuditEvent>[] = [
    { key: 'at', header: 'Timestamp', sortValue: (r) => r.at, render: (r) => fmtDateTime(r.at) },
    { key: 'actor', header: 'Actor', sortValue: (r) => r.actor, render: (r) => <span className="font-semibold text-ink">{r.actor}</span> },
    { key: 'action', header: 'Action', sortValue: (r) => r.action },
    { key: 'resource', header: 'Resource type', sortValue: (r) => r.resource },
    { key: 'resourceId', header: 'Resource ID', sortValue: (r) => r.resourceId, render: (r) => <span className="font-mono text-[11.5px] text-muted-foreground">{r.resourceId}</span> },
    { key: 'result', header: 'Result', render: (r) => <StatusChip status={r.result} /> },
  ];

  if (!can(role, 'settings', 'view')) return <PermissionState module="Settings" />;

  return (
    <div>
      <PageHeader
        title="Audit log"
        description="Every important action with actor, resource and result. Newest first."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Events today" value={eventsToday} sub={`School date ${schoolDate}`} tone="primary" />
        <KpiCard label="Denied attempts" value={denied} sub="Blocked by permissions" tone={denied ? 'warning' : 'success'} />
        <KpiCard label="Failed actions" value={failed} sub="Errors to investigate" tone={failed ? 'danger' : 'success'} />
        <KpiCard label="Total events" value={data.audit.length} sub="Newest 400 kept" />
      </div>

      <Section title="Filter" description="Actor, action and result filters apply instantly; the date range applies on Apply filters." className="mt-5">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w44-from">From date</label>
            <input
              id="w44-from" type="date" value={from} max="2026-07-21" min="2026-06-01"
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w44-to">To date</label>
            <input
              id="w44-to" type="date" value={to} max="2026-07-21" min="2026-06-01"
              onChange={(e) => setTo(e.target.value)}
              className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px] text-ink"
            />
          </div>
          <div className="flex items-end gap-2 lg:col-span-2">
            <Button className="rounded-control" onClick={() => setApplied({ from, to })}>Apply filters</Button>
            {can(role, 'settings', 'export') && (
              <Button
                variant="outline" className="rounded-control"
                onClick={() => downloadCsv(
                  'audit-log.csv',
                  ['Timestamp', 'Actor', 'Role', 'Action', 'Resource type', 'Resource ID', 'Result'],
                  rows.map((a) => [a.at, a.actor, a.role, a.action, a.resource, a.resourceId, a.result]),
                )}
              >
                <Download className="h-4 w-4" aria-hidden /> Export authorized events
              </Button>
            )}
          </div>
        </div>
      </Section>

      <div className="mt-5">
        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <DataTable
            rows={rows}
            columns={columns}
            rowKey={(r) => r.id}
            searchable={(r) => `${r.at} ${r.actor} ${r.role} ${r.action} ${r.resource} ${r.resourceId} ${r.result}`}
            searchPlaceholder="Search audit events…"
            filters={[
              { key: 'actor', label: 'actor', options: actors.map((a) => ({ value: a, label: a })), match: (r, v) => r.actor === v },
              { key: 'action', label: 'action', options: actions.map((a) => ({ value: a, label: a })), match: (r, v) => r.action === v },
              {
                key: 'result', label: 'result',
                options: [
                  { value: 'success', label: 'Success' },
                  { value: 'denied', label: 'Denied' },
                  { value: 'failed', label: 'Failed' },
                ],
                match: (r, v) => r.result === v,
              },
            ]}
            pageSize={12}
            emptyTitle="No events match"
            emptyDescription="Clear the search or widen the date range."
          />
        )}
      </div>
    </div>
  );
}
