'use client';

import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader, PhoneStickyBar } from '@/components/erp/ui/phone';
import { StatusChip } from '@/components/erp/ui/primitives';
import { registerFor, rosterOf, sectionLabel } from '@/lib/erp/derive';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

function Tile({ label, value, cls, span }: { label: string; value: number; cls: string; span?: boolean }) {
  return (
    <div className={`rounded-[11px] border border-line/60 bg-[#FAFBFE] py-2 text-center ${span ? 'col-span-2' : ''}`}>
      <p className={`font-heading text-[19px] font-bold tabular-nums ${cls}`}>{value}</p>
      <p className="text-[10.5px] font-semibold text-muted-foreground">{label}</p>
    </div>
  );
}

export default function T03ReviewSubmit() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);

  const sectionId = params.sectionId ?? 's-7a';
  const reg = registerFor(data, schoolDate, sectionId);
  const roster = rosterOf(data, sectionId, ayId);
  const submitted = reg?.status === 'submitted';

  let present = 0;
  let absent = 0;
  let leave = 0;
  let unmarked = 0;
  for (const { student } of roster) {
    const m = reg?.marks[student.id];
    if (m === 'P') present += 1;
    else if (m === 'A') absent += 1;
    else if (m === 'L') leave += 1;
    else unmarked += 1;
  }

  /* Exceptions: marked absent without a recorded reason */
  const exceptions = roster.filter(({ student }) => reg?.marks[student.id] === 'A' && !reg?.reasons[student.id]);

  const submit = () => {
    openDialog('D15', { date: schoolDate, sectionId, present, absent, leave, unmarked });
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Review & submit"
        subtitle={`${sectionLabel(data, sectionId)} · ${fmtDate(schoolDate)}`}
        accent="#0E9F9A"
        onBack={() => nav('T02', { sectionId })}
      />

      <div className="space-y-3 p-4 pb-6">
        {submitted && (
          <PhoneCard className="border-success/30">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
                  <CheckCircle2 className="h-5 w-5" aria-hidden />
                </span>
                <div>
                  <p className="font-heading text-[15px] font-bold text-ink">Register submitted</p>
                  <p className="text-[11.5px] text-muted-foreground">
                    Submitted by {reg?.submittedBy ?? '—'} · {fmtDateTime(reg?.submittedAt)}
                  </p>
                </div>
              </div>
              <StatusChip status="submitted" />
            </div>
            <div className="mt-3 grid gap-2">
              <Button
                className="h-11 min-h-[44px] w-full rounded-control bg-teal font-bold hover:bg-teal/90"
                onClick={() => nav('T01')}
              >
                Back to Today
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" className="h-11 min-h-[44px] flex-1 rounded-control" onClick={() => nav('T10')}>
                  View notices
                </Button>
                <Button
                  variant="outline"
                  className="h-11 min-h-[44px] flex-1 rounded-control"
                  onClick={() => nav('T07', { sectionId })}
                >
                  Attendance history
                </Button>
              </div>
            </div>
          </PhoneCard>
        )}

        <PhoneCard>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
            Today&apos;s totals · {sectionLabel(data, sectionId)}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <Tile label="Total students" value={roster.length} cls="text-ink" />
            <Tile label="Present" value={present} cls="text-success" />
            <Tile label="Absent" value={absent} cls="text-danger" />
            <Tile label="Leave" value={leave} cls="text-[#8a5a00]" />
            <Tile label="Unmarked" value={unmarked} cls="text-muted-foreground" span />
          </div>
        </PhoneCard>

        {!submitted && exceptions.length > 0 && (
          <PhoneCard className="border-amber/40">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-[#8a5a00]">
              Exceptions · absent without reason
            </p>
            <div className="mt-1.5">
              {exceptions.map(({ student }) => (
                <div key={student.id} className="flex min-h-[44px] items-center justify-between gap-2 border-b border-line/60 py-1.5 last:border-0">
                  <span className="truncate text-[13px] font-semibold text-ink">{student.displayName}</span>
                  <button
                    type="button"
                    onClick={() => nav('T02', { sectionId })}
                    className="shrink-0 text-[12px] font-bold text-teal"
                  >
                    Add reason
                  </button>
                </div>
              ))}
            </div>
          </PhoneCard>
        )}
      </div>

      {!submitted && (
        <PhoneStickyBar>
          <Button
            variant="outline"
            className="h-12 min-h-[44px] flex-1 rounded-control"
            onClick={() => nav('T02', { sectionId })}
          >
            Back to edit
          </Button>
          <Button
            className="h-12 min-h-[44px] flex-1 rounded-control bg-teal font-bold hover:bg-teal/90"
            onClick={submit}
          >
            Submit register
          </Button>
        </PhoneStickyBar>
      )}
    </div>
  );
}
