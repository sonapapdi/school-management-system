'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCard, EmptyState, KpiCard, PageHeader, PermissionState, SkeletonCards } from '@/components/erp/ui/primitives';
import { operationalAlerts } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { useFakeLoad } from '@/lib/erp/utils';

export default function W02OperationalAlerts() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const reviewedAlerts = useErp((s) => s.reviewedAlerts);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const markAlertReviewed = useErp((s) => s.markAlertReviewed);
  const addAuditEvent = useErp((s) => s.addAuditEvent);

  const [severity, setSeverity] = useState('all');
  const [reviewedFilter, setReviewedFilter] = useState('all');
  const [assignedOwners, setAssignedOwners] = useState<Record<string, string>>({});
  const loading = useFakeLoad(350);

  if (!can(role, 'dashboard', 'view')) return <PermissionState module="Dashboard" />;

  const all = operationalAlerts(data, schoolDate);
  const alerts = all
    .filter((a) => (severity === 'all' ? true : a.severity === severity))
    .filter((a) => {
      const reviewed = reviewedAlerts.includes(a.id);
      if (reviewedFilter === 'open') return !reviewed;
      if (reviewedFilter === 'reviewed') return reviewed;
      return true;
    });
  const highCount = all.filter((a) => a.severity === 'high').length;
  const openCount = all.filter((a) => !reviewedAlerts.includes(a.id)).length;
  const canApprove = can(role, 'approvals', 'approve');
  const staffNames = data.staff.filter((st) => st.status === 'active').map((st) => st.name);

  const assignOwner = (alertId: string, name: string) => {
    setAssignedOwners((m) => ({ ...m, [alertId]: name }));
    addAuditEvent('Assigned owner', 'Alert', alertId);
    pushToast({ title: `Assigned to ${name}`, description: 'The owner will follow up on this alert.', variant: 'success' });
  };

  return (
    <div>
      <PageHeader
        description={`Missing attendance registers, failed imports, fee variances and pending approvals as of ${schoolDate}.`}
      />

      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="High severity" value={highCount} sub="Needs attention today" tone={highCount > 0 ? 'danger' : 'success'} />
          <KpiCard label="Open items" value={openCount} sub="Not yet marked reviewed" tone={openCount > 0 ? 'warning' : 'success'} />
          <KpiCard label="Reviewed" value={all.length - openCount} sub="Cleared by the office" tone="success" />
          <KpiCard label="Total alerts" value={all.length} sub="Across all modules" />
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="h-9 w-44 rounded-control" aria-label="Severity filter">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All severities</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reviewedFilter} onValueChange={setReviewedFilter}>
          <SelectTrigger className="h-9 w-44 rounded-control" aria-label="Reviewed filter">
            <SelectValue placeholder="Review state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All items</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
          </SelectContent>
        </Select>
        <p className="ml-auto text-[12px] text-muted-foreground">{alerts.length} alert{alerts.length === 1 ? '' : 's'} shown</p>
      </div>

      <div className="mt-3 space-y-3">
        {loading ? (
          [0, 1, 2].map((i) => (
            <div key={i} className="rounded-card border border-line bg-card p-4">
              <Skeleton className="h-4 w-56" />
              <Skeleton className="mt-2 h-3 w-full max-w-md" />
              <Skeleton className="mt-2 h-3 w-44" />
            </div>
          ))
        ) : alerts.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? 'All clear' : 'No alerts match these filters'}
            description={all.length === 0 ? 'Registers are in, imports are clean and no approvals are pending.' : 'Try widening the severity or review filters.'}
          />
        ) : (
          alerts.map((a) => {
            const reviewed = reviewedAlerts.includes(a.id);
            return (
              <AlertCard
                key={a.id}
                severity={a.severity}
                title={a.title}
                detail={a.detail}
                owner={assignedOwners[a.id] ?? a.owner}
                age={a.age}
                status={a.status}
                action={
                  <>
                    {a.action && (
                      <Button size="sm" variant="outline" className="rounded-control" onClick={() => nav(a.action!.screen, a.action!.params)}>
                        Open item
                      </Button>
                    )}
                    {canApprove && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button size="sm" variant="ghost" className="rounded-control">Assign owner</Button>
                        </PopoverTrigger>
                        <PopoverContent align="end" className="w-56 rounded-card p-2">
                          <p className="px-2 pb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Assign to staff</p>
                          <div className="max-h-56 overflow-y-auto erp-scroll">
                            {staffNames.map((name) => (
                              <button
                                key={name}
                                type="button"
                                onClick={() => assignOwner(a.id, name)}
                                className="block w-full rounded px-2 py-1.5 text-left text-[13px] font-medium text-ink-soft hover:bg-brand/5 hover:text-ink"
                              >
                                {name}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </>
                }
                onReview={reviewed ? undefined : () => markAlertReviewed(a.id)}
                reviewed={reviewed}
              />
            );
          })
        )}
      </div>
    </div>
  );
}
