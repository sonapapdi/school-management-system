'use client';

import { useEffect } from 'react';
import { Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { EmptyState, InfoRow, StatusChip } from '@/components/erp/ui/primitives';
import { downloadText, fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

export default function T11NoticeDetail() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const markNoticeRead = useErp((s) => s.markNoticeRead);

  const noticeId = params.noticeId ?? 'not-002';
  const notice = data.notices.find((n) => n.id === noticeId);

  useEffect(() => {
    if (notice) markNoticeRead(notice.id);
  }, [notice, markNoticeRead]);

  if (!notice) {
    return (
      <div className="flex min-h-full flex-col">
        <PhoneHeader title="Notice" accent="#0E9F9A" onBack={() => nav('T10')} />
        <div className="p-4">
          <EmptyState title="Notice not found" description="This notice may have been removed." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Notice" subtitle={notice.title} accent="#0E9F9A" onBack={() => nav('T10')} />
      <div className="space-y-3 p-4 pb-6">
        <PhoneCard>
          <div className="flex items-center justify-between gap-2">
            <StatusChip status={notice.status} />
            <span className="text-[11.5px] text-muted-foreground">{fmtDate(notice.publishDate)}</span>
          </div>
          <h2 className="mt-2 font-heading text-[17px] font-bold leading-snug text-ink">{notice.title}</h2>
          <p className="mt-2 whitespace-pre-line text-[13.5px] leading-relaxed text-ink-soft">{notice.message}</p>
        </PhoneCard>

        <PhoneCard>
          <p className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Details</p>
          <InfoRow label="Published by" value={notice.author} />
          <InfoRow label="Published at" value={fmtDateTime(notice.publishedAt ?? notice.createdAt)} />
          <InfoRow label="Audience" value={notice.audience} />
          <InfoRow label="Expiry" value={fmtDate(notice.expiryDate)} />
        </PhoneCard>

        <div className="flex min-h-[52px] items-center gap-3 rounded-[12px] border border-line bg-card px-3.5 py-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
            <FileText className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[14px] font-semibold text-ink">Term-2-circular.pdf</span>
            <span className="block text-[11.5px] text-muted-foreground">Attachment · PDF</span>
          </span>
          <Button
            variant="outline"
            className="h-11 min-h-[44px] shrink-0 rounded-control border-teal/40 text-[12.5px] text-teal hover:bg-teal-soft"
            onClick={() => downloadText('attachment.txt', 'Sample attachment for prototype')}
          >
            <Download className="h-4 w-4" aria-hidden /> Download
          </Button>
        </div>
      </div>
    </div>
  );
}
