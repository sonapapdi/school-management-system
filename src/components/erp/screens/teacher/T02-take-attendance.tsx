'use client';

import { useMemo, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ClassSwitcher, MarkButtons, PhoneCard, PhoneHeader, PhoneStickyBar, type AttStatus,
} from '@/components/erp/ui/phone';
import { MarkChip, OfflineState } from '@/components/erp/ui/primitives';
import { registerFor, rosterOf, sectionLabel } from '@/lib/erp/derive';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import type { MarkCode } from '@/lib/erp/types';
import { cn } from '@/lib/utils';

type LocalMark = MarkCode | 'unmarked';

export default function T02TakeAttendance() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const saveRegisterDraft = useErp((s) => s.saveRegisterDraft);

  const sectionId = params.sectionId ?? 's-7a';
  const reg = registerFor(data, schoolDate, sectionId);
  const roster = useMemo(() => rosterOf(data, sectionId, ayId), [data, sectionId, ayId]);
  const submitted = reg?.status === 'submitted';

  /* Local marks sync from the store register via render-time derivation:
     section switch, D14 dialog commit, draft save all change the signature. */
  const syncSig = `${sectionId}|${reg?.id ?? 'none'}|${reg?.status ?? ''}|${reg?.revision ?? 0}`;
  const [sync, setSync] = useState<{ sig: string; marks: Record<string, LocalMark>; reasons: Record<string, string> }>({
    sig: syncSig, marks: {}, reasons: {},
  });
  if (sync.sig !== syncSig) {
    const source = reg && reg.status !== 'submitted' ? reg : null;
    const next: Record<string, LocalMark> = {};
    for (const { student } of roster) next[student.id] = source?.marks[student.id] ?? 'unmarked';
    setSync({ sig: syncSig, marks: next, reasons: source?.reasons ?? {} });
  }
  const marks = sync.marks;
  const reasons = sync.reasons;

  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let leave = 0;
    let unmarked = 0;
    for (const { student } of roster) {
      const m = marks[student.id] ?? 'unmarked';
      if (m === 'P') present += 1;
      else if (m === 'A') absent += 1;
      else if (m === 'L') leave += 1;
      else unmarked += 1;
    }
    return { present, absent, leave, unmarked };
  }, [marks, roster]);

  const sections = useMemo(
    () => data.assignments
      .filter((a) => a.staffId === 'stf-farah' && a.sectionId)
      .sort((a, b) => (a.type === 'Class Teacher' ? -1 : 1) - (b.type === 'Class Teacher' ? -1 : 1))
      .map((a) => ({ id: a.sectionId!, label: sectionLabel(data, a.sectionId!) })),
    [data],
  );

  const [offline, setOffline] = useState(false);

  const setMark = (studentId: string, m: AttStatus) => {
    if (offline || m === 'unmarked') return;
    setSync((prev) => ({ ...prev, marks: { ...prev.marks, [studentId]: m } }));
  };

  const saveDraft = () => {
    const mapped: Record<string, MarkCode> = {};
    for (const [sid, m] of Object.entries(marks)) {
      if (m !== 'unmarked') mapped[sid] = m;
    }
    saveRegisterDraft({ date: schoolDate, sectionId, marks: mapped, reasons });
  };

  /* Persist marks so the review screen reads live totals from the store */
  const review = () => {
    saveDraft();
    nav('T03', { sectionId });
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Take attendance"
        subtitle={`${sectionLabel(data, sectionId)} · ${fmtDate(schoolDate)}`}
        accent="#0E9F9A"
        onBack={() => nav('T01')}
        right={(
          <button
            type="button"
            onClick={() => setOffline((v) => !v)}
            aria-pressed={offline}
            className={cn(
              'flex h-9 shrink-0 items-center gap-1 rounded-full border px-2.5 text-[10.5px] font-semibold',
              offline ? 'border-amber/50 bg-amber-soft text-[#8a5a00]' : 'border-line bg-card text-muted-foreground',
            )}
          >
            <WifiOff className="h-3.5 w-3.5" aria-hidden />
            Simulate weak Wi-Fi
          </button>
        )}
      />

      <div className="space-y-3 p-4 pb-6">
        <ClassSwitcher sections={sections} current={sectionId} onSelect={(id) => nav('T02', { sectionId: id })} />

        {offline && <OfflineState />}
        <p className="text-[11.5px] text-muted-foreground">Roster cached for offline marking.</p>

        {submitted ? (
          <>
            <div className="rounded-[14px] border border-teal/30 bg-teal-soft px-4 py-3">
              <div>
                <p className="text-[13px] font-bold text-teal">Register submitted and locked</p>
                <p className="mt-0.5 text-[12px] text-ink-soft">
                  Submitted by {reg?.submittedBy ?? '—'} · {fmtDateTime(reg?.submittedAt)}
                </p>
              </div>
              <Button
                variant="outline"
                className="mt-2.5 h-11 min-h-[44px] w-full rounded-control border-teal/40 text-teal hover:bg-teal-soft"
                onClick={() => nav('T08', { date: schoolDate, sectionId })}
              >
                Request correction
              </Button>
            </div>
            <PhoneCard className="p-2">
              {roster.map(({ enrollment, student }) => (
                <div key={student.id} className="flex min-h-[52px] items-center gap-2.5 border-b border-line/60 px-1.5 py-1.5 last:border-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-[12px] font-bold text-ink-soft">
                    {enrollment.rollNo}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">{student.displayName}</span>
                    {reg?.reasons[student.id] && (
                      <span className="block truncate text-[11.5px] text-muted-foreground">{reg.reasons[student.id]}</span>
                    )}
                  </span>
                  <MarkChip mark={reg?.marks[student.id] ?? 'unmarked'} />
                </div>
              ))}
            </PhoneCard>
          </>
        ) : (
          <PhoneCard className="p-2">
            {roster.map(({ enrollment, student }) => {
              const m = marks[student.id] ?? 'unmarked';
              const showReason = m === 'A' || m === 'L';
              return (
                <div key={student.id} className={cn('px-1.5 py-1.5', offline && 'pointer-events-none opacity-50')}>
                  <div className="flex min-h-[52px] items-center gap-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-soft text-[12px] font-bold text-teal">
                      {enrollment.rollNo}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">{student.displayName}</span>
                    <MarkButtons value={m} onChange={(v) => setMark(student.id, v)} />
                  </div>
                  {showReason && (
                    <Input
                      value={reasons[student.id] ?? ''}
                      onChange={(e) => setSync((prev) => ({ ...prev, reasons: { ...prev.reasons, [student.id]: e.target.value } }))}
                      placeholder="Reason (optional)"
                      disabled={offline}
                      className="mt-1 h-9 rounded-control bg-background text-[13px]"
                      aria-label={`Reason for ${student.displayName}`}
                    />
                  )}
                </div>
              );
            })}
          </PhoneCard>
        )}
      </div>

      {!submitted && (
        <PhoneStickyBar>
          <div className="w-full">
            <div className="mb-2 grid grid-cols-4 gap-1.5 text-center">
              <div className="rounded-[9px] bg-success-soft py-1">
                <p className="font-heading text-[14px] font-bold tabular-nums text-success">{counts.present}</p>
                <p className="text-[10px] font-semibold text-success">Present</p>
              </div>
              <div className="rounded-[9px] bg-danger-soft py-1">
                <p className="font-heading text-[14px] font-bold tabular-nums text-danger">{counts.absent}</p>
                <p className="text-[10px] font-semibold text-danger">Absent</p>
              </div>
              <div className="rounded-[9px] bg-amber-soft py-1">
                <p className="font-heading text-[14px] font-bold tabular-nums text-[#8a5a00]">{counts.leave}</p>
                <p className="text-[10px] font-semibold text-[#8a5a00]">Leave</p>
              </div>
              <div className="rounded-[9px] bg-muted py-1">
                <p className="font-heading text-[14px] font-bold tabular-nums text-ink-soft">{counts.unmarked}</p>
                <p className="text-[10px] font-semibold text-muted-foreground">Unmarked</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="h-11 min-h-[44px] flex-1 rounded-control text-[12.5px]"
                disabled={counts.unmarked === 0 || offline}
                onClick={() => openDialog('D14', { date: schoolDate, sectionId, count: counts.unmarked })}
              >
                Mark remaining present
              </Button>
              <Button
                variant="outline"
                className="h-11 min-h-[44px] rounded-control text-[12.5px]"
                disabled={offline}
                onClick={saveDraft}
              >
                Save draft
              </Button>
            </div>
            <Button
              className="mt-2 h-11 min-h-[44px] w-full rounded-control bg-teal font-bold hover:bg-teal/90"
              disabled={counts.unmarked > 0 || offline}
              title={counts.unmarked > 0 ? 'Complete marking first' : undefined}
              onClick={review}
            >
              Review
            </Button>
            {counts.unmarked > 0 && (
              <p className="mt-1 text-center text-[11px] text-muted-foreground">
                Complete marking first — {counts.unmarked} unmarked.
              </p>
            )}
          </div>
        </PhoneStickyBar>
      )}
    </div>
  );
}
