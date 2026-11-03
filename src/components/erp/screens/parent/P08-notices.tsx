'use client';

import { ChevronRight, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState, StatusChip } from '@/components/erp/ui/primitives';
import { PhoneHeader } from '@/components/erp/ui/phone';
import { noticesForRole } from '@/lib/erp/derive';
import { fmtDate } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_SECTION = 's-7a';

export default function P08Notices() {
  const data = useErp((s) => s.data);
  const readNotices = useErp((s) => s.readNotices);
  const nav = useErp((s) => s.nav);
  const markNoticeRead = useErp((s) => s.markNoticeRead);
  const schoolName = useErp((s) => s.theme.schoolName);

  const rows = noticesForRole(data, 'parent', CHILD_SECTION);

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Notices" subtitle={`From ${schoolName}`} accent="#5B5FEF" />

      <div className="space-y-3 p-4 pb-6">
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            className="h-11 rounded-control"
            onClick={() => rows.forEach((n) => markNoticeRead(n.id))}
            disabled={rows.length === 0}
          >
            Mark all read
          </Button>
        </div>

        {rows.length === 0 ? (
          <EmptyState
            icon={Megaphone}
            title="No notices yet"
            description="Notices from the school office will appear here."
          />
        ) : (
          <div className="space-y-2">
            {rows.map((n) => {
              const unread = !readNotices[n.id];
              const expired = n.status === 'expired';
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    nav('P09', { noticeId: n.id });
                    markNoticeRead(n.id);
                  }}
                  className={cn(
                    'flex min-h-[64px] w-full items-center gap-3 rounded-[12px] border border-line bg-card px-3.5 py-3 text-left transition-colors hover:bg-[#FAFBFF]',
                    expired && 'opacity-60',
                  )}
                >
                  <span
                    className={cn('h-2 w-2 shrink-0 rounded-full', unread ? 'bg-brand' : 'bg-transparent')}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block truncate text-[14px]',
                        unread ? 'font-bold text-ink' : 'font-semibold text-ink-soft',
                      )}
                    >
                      {n.title}
                    </span>
                    <span className="block truncate text-[12px] text-muted-foreground">
                      Published {fmtDate(n.publishDate)} · {n.author}
                    </span>
                  </span>
                  {expired ? (
                    <StatusChip status="expired" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
