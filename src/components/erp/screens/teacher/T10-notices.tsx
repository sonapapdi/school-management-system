'use client';

import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneHeader, PhoneRow } from '@/components/erp/ui/phone';
import { EmptyState } from '@/components/erp/ui/primitives';
import { noticesForRole } from '@/lib/erp/derive';
import { fmtDate } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import { cn } from '@/lib/utils';

export default function T10Notices() {
  const data = useErp((s) => s.data);
  const readNotices = useErp((s) => s.readNotices);
  const nav = useErp((s) => s.nav);
  const markNoticeRead = useErp((s) => s.markNoticeRead);

  const notices = noticesForRole(data, 'teacher');
  const unread = notices.filter((n) => !readNotices[n.id]);

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Notices" subtitle="From the school office" accent="#0E9F9A" />
      <div className="space-y-3 p-4 pb-6">
        <div className="flex min-h-[44px] items-center justify-between gap-2">
          <p className="text-[11.5px] text-muted-foreground">
            {notices.length} notices · {unread.length} unread
          </p>
          {unread.length > 0 && (
            <Button
              variant="outline"
              className="h-11 min-h-[44px] rounded-control border-teal/40 px-3 text-[12px] text-teal hover:bg-teal-soft"
              onClick={() => unread.forEach((n) => markNoticeRead(n.id))}
            >
              Mark all read
            </Button>
          )}
        </div>

        {notices.length === 0 ? (
          <EmptyState
            title="No notices yet"
            description="Notices from the school office will appear here."
          />
        ) : (
          <div className="space-y-1.5">
            {notices.map((n) => {
              const isUnread = !readNotices[n.id];
              return (
                <PhoneRow
                  key={n.id}
                  title={<span className={cn('text-ink', isUnread && 'font-bold')}>{n.title}</span>}
                  subtitle={`Published ${fmtDate(n.publishDate)} · ${n.author}`}
                  onClick={() => {
                    markNoticeRead(n.id);
                    nav('T11', { noticeId: n.id });
                  }}
                  right={(
                    <span className="flex shrink-0 items-center gap-1.5">
                      {isUnread && <span className="h-2 w-2 rounded-full bg-teal" aria-label="Unread" />}
                      <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
                    </span>
                  )}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
