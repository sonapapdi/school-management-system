'use client';

import { Archive, Copy, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/erp/ui/table';
import { Money, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { gradeLabel } from '@/lib/erp/derive';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { FeePlan } from '@/lib/erp/types';

export default function W14FeePlanList() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const upsertFeePlan = useErp((s) => s.upsertFeePlan);

  const loading = useFakeLoad(350);

  if (!can(role, 'fees', 'view')) return <PermissionState module="Fees" />;

  const canCreate = can(role, 'fees', 'create');
  const canUpdate = can(role, 'fees', 'update');

  const rows = [...data.feePlans].sort((a, b) => a.name.localeCompare(b.name));
  const ayName = (plan: FeePlan) => data.academicYears.find((a) => a.id === plan.ayId)?.name ?? '—';
  const totalOf = (plan: FeePlan) => plan.heads.reduce((t, h) => t + h.amount, 0);
  const instRange = (plan: FeePlan) => {
    const sorted = [...plan.installments].sort((a, b) => a.sequence - b.sequence);
    if (sorted.length === 0) return null;
    return { first: sorted[0].dueDate, last: sorted[sorted.length - 1].dueDate };
  };

  return (
    <div>
      <PageHeader
        description="Plans, installments and status for the school's fee structure."
        actions={
          canCreate && (
            <Button className="rounded-control" onClick={() => nav('W15')}>
              <Plus className="h-4 w-4" aria-hidden /> Create plan
            </Button>
          )
        }
      />

      {loading ? (
        <SkeletonTable rows={4} cols={6} />
      ) : (
        <DataTable<FeePlan>
          rows={rows}
          rowKey={(p) => p.id}
          searchable={(p) => `${p.name} ${ayName(p)}`}
          searchPlaceholder="Search plans…"
          emptyTitle="No fee plans"
          emptyDescription="Create a plan to start assessing students."
          columns={[
            { key: 'name', header: 'Plan name', render: (p) => <span className="font-semibold text-ink">{p.name}</span>, sortValue: (p) => p.name },
            { key: 'ay', header: 'Academic year', render: (p) => ayName(p), sortValue: (p) => ayName(p) },
            { key: 'applies', header: 'Applies to', render: (p) => (p.appliesTo === 'all' ? 'All grades' : gradeLabel(data, p.appliesTo)) },
            {
              key: 'total', header: 'Total amount', align: 'right', render: (p) => <Money value={totalOf(p)} />,
              sortValue: (p) => totalOf(p),
            },
            {
              key: 'installments', header: 'Installments',
              render: (p) => {
                const range = instRange(p);
                return (
                  <div>
                    <p>{p.installments.length} installment{p.installments.length === 1 ? '' : 's'}</p>
                    {range && (
                      <p className="text-[11.5px] text-muted-foreground">
                        First due {fmtDate(range.first)} · Last due {fmtDate(range.last)}
                      </p>
                    )}
                  </div>
                );
              },
              sortValue: (p) => p.installments.length,
            },
            { key: 'status', header: 'Status', render: (p) => <StatusChip status={p.status} />, sortValue: (p) => p.status },
            {
              key: 'actions', header: '', align: 'right',
              render: (p) => (
                <div className="flex justify-end gap-1.5">
                  <Button size="sm" variant="outline" className="rounded-control" onClick={() => nav('W15', { planId: p.id })}>
                    <FolderOpen className="h-3.5 w-3.5" aria-hidden /> Open plan
                  </Button>
                  {canCreate && (
                    <Button
                      size="sm" variant="ghost" className="rounded-control"
                      onClick={() => upsertFeePlan({ ...p, id: undefined, name: `${p.name} (copy)`, status: 'draft' })}
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden /> Duplicate plan
                    </Button>
                  )}
                  {canUpdate && p.status !== 'archived' && (
                    <Button
                      size="sm" variant="ghost" className="rounded-control text-muted-foreground"
                      onClick={() => upsertFeePlan({ ...p, status: 'archived' })}
                    >
                      <Archive className="h-3.5 w-3.5" aria-hidden /> Archive
                    </Button>
                  )}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
