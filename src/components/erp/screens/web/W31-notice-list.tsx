'use client';

import { Archive, Clock, Paperclip, PencilLine, Plus, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTable, type Column, type TableFilter } from '@/components/erp/ui/table';
import {
  KpiCard, LockedHint, PageHeader, PermissionState, SkeletonCards, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { gradeLabel, sectionLabel } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import type { Notice } from '@/lib/erp/types';

export default function W31NoticeList() {
  const data = useErp((s) => s.data);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const loading = useFakeLoad(350);

  if (!can(role, 'notices', 'view')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Notices" />
      </div>
    );
  }

  const canCreate = can(role, 'notices', 'create');

  const rows: Notice[] = [...data.notices].sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  const count = (status: Notice['status']) => data.notices.filter((n) => n.status === status).length;

  const audienceSub = (n: Notice): string | undefined => {
    if (n.audience === 'Grade') return gradeLabel(data, n.gradeId ?? '');
    if (n.audience === 'Section') return sectionLabel(data, n.sectionId ?? '');
    return undefined;
  };

  const filters: TableFilter<Notice>[] = [
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'published', label: 'Published' },
        { value: 'expired', label: 'Expired' },
      ],
      match: (row, value) => row.status === value,
    },
    {
      key: 'audience',
      label: 'Audience',
      options: [
        { value: 'Everyone', label: 'Everyone' },
        { value: 'All parents', label: 'All parents' },
        { value: 'All staff', label: 'All staff' },
        { value: 'Grade', label: 'Grade' },
        { value: 'Section', label: 'Section' },
      ],
      match: (row, value) => row.audience === value,
    },
  ];

  const columns: Column<Notice>[] = [
    {
      key: 'title', header: 'Title', render: (n) => (
        <span className="inline-flex items-center gap-1.5 font-semibold text-ink">
          {n.title}
          {n.attachment && <Paperclip className="h-3 w-3 text-muted-foreground" aria-label={`Attachment: ${n.attachment}`} />}
        </span>
      ), sortValue: (n) => n.title,
    },
    {
      key: 'audience', header: 'Audience', render: (n) => (
        <div>
          <p className="font-semibold text-ink">{n.audience}</p>
          {audienceSub(n) && <p className="text-[11px] text-muted-foreground">{audienceSub(n)}</p>}
        </div>
      ), sortValue: (n) => n.audience,
    },
    { key: 'publishDate', header: 'Publish date', render: (n) => fmtDate(n.publishDate), sortValue: (n) => n.publishDate },
    { key: 'expiryDate', header: 'Expiry date', render: (n) => fmtDate(n.expiryDate), sortValue: (n) => n.expiryDate, hideBelow: 'md' },
    { key: 'status', header: 'Status', render: (n) => <StatusChip status={n.status} /> },
    { key: 'author', header: 'Author', render: (n) => n.author, hideBelow: 'sm' },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (n) => (
        <Button size="sm" variant="outline" className="rounded-control" onClick={() => nav('W33', { noticeId: n.id })}>
          Open
        </Button>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Notices"
        actions={!canCreate ? (
          <LockedHint>Creating notices needs create permission</LockedHint>
        ) : (
          <Button className="rounded-control" onClick={() => nav('W32')}>
            <Plus className="h-4 w-4" aria-hidden /> Create notice
          </Button>
        )}
      />

      {loading ? (
        <div className="space-y-4">
          <SkeletonCards count={4} />
          <SkeletonTable rows={6} cols={6} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <KpiCard label="Published" value={count('published')} sub="Visible to recipients" icon={Send} tone="success" />
            <KpiCard label="Scheduled" value={count('scheduled')} sub="Will publish on their date" icon={Clock} tone="primary" />
            <KpiCard label="Drafts" value={count('draft')} sub="Not sent yet" icon={PencilLine} tone="teal" />
            <KpiCard label="Expired" value={count('expired')} sub="Past their expiry date" icon={Archive} />
          </div>

          <div className="mt-4">
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(n) => n.id}
              searchable={(n) => n.title}
              searchPlaceholder="Search by title…"
              filters={filters}
              emptyTitle="No notices found"
              emptyDescription="Try changing search or filters."
            />
          </div>
        </>
      )}
    </div>
  );
}
