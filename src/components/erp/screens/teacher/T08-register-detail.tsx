'use client';

import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { EmptyState, InfoRow, MarkChip, StatusChip } from '@/components/erp/ui/primitives';
import { registerFor, rosterOf, sectionLabel } from '@/lib/erp/derive';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import { cn } from '@/lib/utils';

export default function T08RegisterDetail() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);

  const date = params.date ?? '2026-07-17';
  const sectionId = params.sectionId ?? 's-7a';
  const highlight = params.studentId;
  const reg = registerFor(data, date, sectionId);
  const roster = rosterOf(data, sectionId, ayId);
  const ready = reg?.status === 'submitted';

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Submitted register"
        subtitle={`${sectionLabel(data, sectionId)} · ${fmtDate(date)}`}
        accent="#0E9F9A"
        onBack={() => nav('T07', highlight ? { studentId: highlight, sectionId } : { sectionId })}
      />
      <div className="space-y-3 p-4 pb-6">
        {!ready ? (
          <EmptyState
            title="Register not submitted yet"
            description="The class teacher has not submitted this register, so marks may still change."
          />
        ) : (
          <>
            <PhoneCard>
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Submission</p>
                <StatusChip status={reg.status} />
              </div>
              <div className="mt-1">
                <InfoRow label="Submitted by" value={reg.submittedBy ?? '—'} />
                <InfoRow label="Submitted at" value={fmtDateTime(reg.submittedAt)} />
                <InfoRow label="Revision" value={`#${reg.revision}`} mono />
              </div>
            </PhoneCard>

            <PhoneCard className="p-2">
              {roster.map(({ enrollment, student }) => {
                const isHighlight = highlight === student.id;
                return (
                  <div
                    key={student.id}
                    className={cn(
                      'rounded-[10px] px-2 py-1.5',
                      isHighlight && 'border border-teal/40 bg-teal-soft/50',
                    )}
                  >
                    <div className="flex min-h-[52px] items-center gap-2.5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-ink-soft">
                        {enrollment.rollNo}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13.5px] font-semibold text-ink">{student.displayName}</span>
                        <span className="block truncate text-[11.5px] text-muted-foreground">
                          {reg.reasons[student.id] ? reg.reasons[student.id] : 'No reason'}
                          {' · '}Marked by {reg.submittedBy ?? '—'}
                        </span>
                      </span>
                      <MarkChip mark={reg.marks[student.id] ?? 'unmarked'} />
                    </div>
                    <Button
                      variant="outline"
                      className="mt-1 h-11 min-h-[44px] w-full rounded-control border-teal/40 text-[12.5px] text-teal hover:bg-teal-soft"
                      onClick={() => nav('T09', { date, sectionId, studentId: student.id })}
                    >
                      Request correction
                    </Button>
                  </div>
                );
              })}
            </PhoneCard>
          </>
        )}
      </div>
    </div>
  );
}
