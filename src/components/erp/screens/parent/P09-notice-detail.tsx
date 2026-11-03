'use client';

import { useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, StatusChip } from '@/components/erp/ui/primitives';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { downloadText, fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

const FEE_SCHEDULE_TEXT = `Sunrise Public School — Fee payment schedule (AY 2026-27)

Term 1 — Rs 28,300 — due 10 Apr 2026
Term 2 — Rs 28,300 — due 10 Jul 2026
Term 3 — Rs 28,300 — due 10 Oct 2026

Payments are collected at the school office. This app is read-only.
Office: +91 20 4075 1200 · office@sunrisepublic.edu.in
`;

function MetaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{children}</span>
    </div>
  );
}

export default function P09NoticeDetail() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const markNoticeRead = useErp((s) => s.markNoticeRead);

  const noticeId = params.noticeId ?? 'not-001';
  const notice = data.notices.find((n) => n.id === noticeId);

  /* Opening a notice marks it read */
  useEffect(() => {
    markNoticeRead(noticeId);
  }, [noticeId, markNoticeRead]);

  if (!notice) {
    return (
      <div className="flex min-h-full flex-col">
        <PhoneHeader title="Notice" accent="#5B5FEF" onBack={() => nav('P08')} />
        <div className="p-4">
          <EmptyState title="Notice not found" description="Open Notices and pick one to read." />
        </div>
      </div>
    );
  }

  const attachment = notice.attachment ?? (notice.id === 'not-001' ? 'Fee-payment-schedule.pdf' : undefined);

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Notice" subtitle={notice.title} accent="#5B5FEF" onBack={() => nav('P08')} />

      <div className="space-y-3 p-4 pb-6">
        {/* Notice body */}
        <PhoneCard>
          <div className="flex items-center justify-between gap-2">
            <StatusChip status={notice.status} />
            <span className="text-[11.5px] text-muted-foreground">{fmtDate(notice.publishDate)}</span>
          </div>
          <h2 className="mt-2 font-heading text-[17px] font-bold leading-snug text-ink">{notice.title}</h2>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-soft">{notice.message}</p>
          <div className="mt-3">
            <MetaRow label="Published by">{notice.author}</MetaRow>
            <MetaRow label="Published at">{fmtDateTime(notice.publishedAt ?? notice.createdAt)}</MetaRow>
            <MetaRow label="Audience">{notice.audience}</MetaRow>
            <MetaRow label="Expiry date">{fmtDate(notice.expiryDate)}</MetaRow>
          </div>
        </PhoneCard>

        {/* Attachment */}
        {attachment && (
          <PhoneCard>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-brand/10 text-brand-dark">
                <FileText className="h-5 w-5" aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13.5px] font-semibold text-ink">{attachment}</span>
                <span className="block text-[11.5px] text-muted-foreground">PDF attachment</span>
              </span>
            </div>
            <Button
              variant="outline"
              className="mt-2 h-11 w-full rounded-control font-bold"
              onClick={() => downloadText(attachment, FEE_SCHEDULE_TEXT)}
            >
              <Download className="h-4 w-4" aria-hidden /> Download attachment
            </Button>
          </PhoneCard>
        )}

        <p className="pt-1 text-center text-[12px] text-muted-foreground">Questions? Call the school office.</p>
      </div>
    </div>
  );
}
