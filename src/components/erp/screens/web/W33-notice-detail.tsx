'use client';

import { ArrowLeft, Ban, CheckCircle2, Copy, Download, Pencil } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  EmptyState, PageHeader, PermissionState, Section, SkeletonTable, StatusChip, Timeline,
} from '@/components/erp/ui/primitives';
import { gradeLabel, rosterOf, sectionLabel, studentName } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate, fmtDateTime, useFakeLoad } from '@/lib/erp/utils';
import type { Notice } from '@/lib/erp/types';

function MetaCell({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-0.5 text-[13px] font-semibold text-ink">{children}</div>
    </div>
  );
}

export default function W33NoticeDetail() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const paramsNoticeId = useErp((s) => s.route.params.noticeId);
  const nav = useErp((s) => s.nav);
  const expireNotice = useErp((s) => s.expireNotice);
  const duplicateNotice = useErp((s) => s.duplicateNotice);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const noticeId = paramsNoticeId ?? 'not-001';
  const notice: Notice | undefined = data.notices.find((n) => n.id === noticeId);

  if (!can(role, 'notices', 'view')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Notices" />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader />
        <SkeletonTable rows={6} cols={3} />
      </div>
    );
  }

  if (!notice) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          title="Notice not found"
          description="The notice may have been removed or the link is stale."
          action={<Button className="rounded-control" onClick={() => nav('W31')}>Back to notices</Button>}
        />
      </div>
    );
  }

  const canCreate = can(role, 'notices', 'create');
  const canExpire = can(role, 'notices', 'approve') || can(role, 'notices', 'update');

  const audienceInfo = (() => {
    switch (notice.audience) {
      case 'All parents': {
        const n = data.guardians.filter((g) => g.appAccess).length;
        return { count: n, label: `${n} parents with app access` };
      }
      case 'Everyone': {
        const n = data.students.filter((st) => st.status === 'active').length + data.staff.length;
        return { count: n, label: `${n} students & staff` };
      }
      case 'All staff':
        return { count: data.staff.length, label: `${data.staff.length} staff members` };
      case 'Grade': {
        const secIds = data.sections.filter((sc) => sc.gradeId === notice.gradeId).map((sc) => sc.id);
        const n = data.enrollments.filter((e) => e.ayId === ayId && e.status === 'active' && secIds.includes(e.sectionId)).length;
        return { count: n, label: `${n} students in ${gradeLabel(data, notice.gradeId ?? '')}` };
      }
      case 'Section': {
        const n = rosterOf(data, notice.sectionId ?? '', ayId).length;
        return { count: n, label: `${n} students in ${sectionLabel(data, notice.sectionId ?? '')}` };
      }
      default:
        return { count: 0, label: '—' };
    }
  })();

  const delivered = data.guardians.filter((g) => g.appAccess);

  const auditItems = data.audit
    .filter((a) => a.resourceId === noticeId)
    .map((a) => ({
      title: a.action,
      description: a.resource,
      time: fmtDateTime(a.at),
      actor: a.actor,
      tone: a.result === 'success' ? ('success' as const) : a.result === 'denied' ? ('warning' as const) : ('danger' as const),
    }));

  const isDraftish = notice.status === 'draft' || notice.status === 'scheduled';

  const handleDuplicate = () => {
    const id = duplicateNotice(noticeId);
    if (id) nav('W32', { noticeId: id });
  };

  return (
    <div>
      <PageHeader
        status={<StatusChip status={notice.status} />}
        actions={
          <>
            {isDraftish && (
              <Button variant="outline" className="rounded-control" disabled={!canCreate} onClick={() => nav('W32', { noticeId })}>
                <Pencil className="h-4 w-4" aria-hidden /> Edit draft
              </Button>
            )}
            {notice.status === 'published' && (
              <Button
                className="rounded-control bg-danger text-white hover:bg-danger/90"
                disabled={!canExpire}
                onClick={() => expireNotice(noticeId)}
              >
                <Ban className="h-4 w-4" aria-hidden /> Expire notice
              </Button>
            )}
            <Button variant="outline" className="rounded-control" onClick={handleDuplicate}>
              <Copy className="h-4 w-4" aria-hidden /> Duplicate
            </Button>
            <Button variant="ghost" className="rounded-control" onClick={() => nav('W31')}>
              <ArrowLeft className="h-4 w-4" aria-hidden /> Back to notices
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Section>
            <h2 className="font-heading text-lg font-bold text-ink">{notice.title}</h2>
            <p className="mt-3 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-soft">{notice.message}</p>
            <div className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 sm:grid-cols-3">
              <MetaCell label="Published by">{notice.author}</MetaCell>
              <MetaCell label="Published at">{fmtDateTime(notice.publishedAt)}</MetaCell>
              <MetaCell label="Audience">
                {notice.audience}
                <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">{audienceInfo.label}</p>
              </MetaCell>
              <MetaCell label="Publish date">{fmtDate(notice.publishDate)}</MetaCell>
              <MetaCell label="Expiry">{fmtDate(notice.expiryDate)}</MetaCell>
              <MetaCell label="Attachment">
                {notice.attachment ? (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-brand-dark hover:underline"
                    onClick={() => pushToast({ title: 'Attachment download started', description: notice.attachment, variant: 'info' })}
                  >
                    <Download className="h-3.5 w-3.5" aria-hidden /> {notice.attachment}
                  </button>
                ) : '—'}
              </MetaCell>
            </div>
          </Section>

          <Section title="Read receipts" description="Mock delivery snapshot for this prototype">
            {delivered.length === 0 ? (
              <EmptyState title="No app recipients" description="No guardians currently have app access." />
            ) : (
              <ul className="space-y-2">
                {delivered.slice(0, 5).map((g) => (
                  <li key={g.id} className="flex items-center justify-between gap-2 rounded-[10px] border border-line bg-page px-3 py-2">
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold text-ink">{g.name}</p>
                      <p className="text-[11px] text-muted-foreground">{g.relationship} of {studentName(data, g.studentId)}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
                      <CheckCircle2 className="h-3 w-3" aria-hidden /> Delivered to app
                    </span>
                  </li>
                ))}
                {delivered.length > 5 && (
                  <li className="text-[12px] text-muted-foreground">…and {delivered.length - 5} more</li>
                )}
              </ul>
            )}
          </Section>
        </div>

        <div className="space-y-5">
          <Section title="Audience">
            <p className="font-heading text-3xl font-bold tabular-nums text-ink">{audienceInfo.count}</p>
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">{audienceInfo.label}</p>
            <div className="mt-3">
              <span className="inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                {notice.audience}
                {notice.audience === 'Grade' && notice.gradeId ? ` · ${gradeLabel(data, notice.gradeId)}` : ''}
                {notice.audience === 'Section' && notice.sectionId ? ` · ${sectionLabel(data, notice.sectionId)}` : ''}
              </span>
            </div>
          </Section>

          <Section title="Audit trail" description="Events recorded for this notice">
            <Timeline items={auditItems} />
          </Section>
        </div>
      </div>
    </div>
  );
}
