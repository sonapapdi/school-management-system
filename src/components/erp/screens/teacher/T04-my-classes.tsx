'use client';

import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { rosterOf, sectionLabel } from '@/lib/erp/derive';
import { fmtDate } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import { cn } from '@/lib/utils';

export default function T04MyClasses() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);

  const assignments = data.assignments.filter((a) => a.staffId === 'stf-farah' && a.sectionId);

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="My classes" subtitle={fmtDate(schoolDate)} accent="#0E9F9A" />
      <div className="space-y-3 p-4 pb-6">
        {assignments.map((a) => {
          const sid = a.sectionId!;
          const isCT = a.type === 'Class Teacher';
          const count = rosterOf(data, sid, ayId).length;
          return (
            <PhoneCard key={a.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-heading text-[15.5px] font-bold text-ink">{sectionLabel(data, sid)}</p>
                  <p className="mt-0.5 text-[12px] text-muted-foreground">
                    {fmtDate(a.start)} – {a.end ? fmtDate(a.end) : 'Ongoing'} · {count} students
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold',
                    isCT ? 'border-teal/25 bg-teal-soft text-teal' : 'border-line bg-card text-muted-foreground',
                  )}
                >
                  {a.type}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  variant="outline"
                  className="h-11 min-h-[44px] flex-1 rounded-control"
                  onClick={() => nav('T05', { sectionId: sid })}
                >
                  Open roster
                </Button>
                {isCT && (
                  <Button
                    className="h-11 min-h-[44px] flex-1 rounded-control bg-teal font-bold hover:bg-teal/90"
                    onClick={() => nav('T02', { sectionId: sid })}
                  >
                    Take attendance
                  </Button>
                )}
              </div>
            </PhoneCard>
          );
        })}
        <p className="px-1 text-center text-[11.5px] text-muted-foreground">
          Assignments are dated — you only see sections assigned to you.
        </p>
      </div>
    </div>
  );
}
