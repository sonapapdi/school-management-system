'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AttendanceStatusSelector, PhoneCard, PhoneHeader, PhoneStickyBar, type AttStatus,
} from '@/components/erp/ui/phone';
import { EmptyState, MarkChip } from '@/components/erp/ui/primitives';
import { getStudent, registerFor, sectionLabel } from '@/lib/erp/derive';
import { fmtDate } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

export default function T09RequestCorrection() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);
  const requestCorrection = useErp((s) => s.requestCorrection);
  const userName = useErp((s) => s.session.userName);

  const date = params.date ?? '2026-07-17';
  const sectionId = params.sectionId ?? 's-7a';
  const studentId = params.studentId ?? '';
  const student = studentId ? getStudent(data, studentId) : undefined;
  const reg = registerFor(data, date, sectionId);
  const existing = reg?.marks[studentId] ?? 'unmarked';

  const [to, setTo] = useState<'P' | 'A' | 'L'>(existing === 'A' ? 'P' : 'A');
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [tried, setTried] = useState(false);

  if (!student || !reg || reg.status !== 'submitted' || existing === 'unmarked') {
    return (
      <div className="flex min-h-full flex-col">
        <PhoneHeader
          title="Request correction"
          subtitle={`${sectionLabel(data, sectionId)} · ${fmtDate(date)}`}
          accent="#0E9F9A"
          onBack={() => nav('T08', { date, sectionId })}
        />
        <div className="p-4">
          <EmptyState
            title="Nothing to correct"
            description="Open a submitted register and pick a student to request a mark correction."
          />
        </div>
      </div>
    );
  }

  const sameStatus = to === existing;
  const reasonInvalid = reason.trim().length < 5;

  const submit = () => {
    setTried(true);
    if (reasonInvalid || sameStatus) return;
    requestCorrection({
      date,
      sectionId,
      studentId,
      from: existing,
      to,
      reason: reason.trim(),
      note: note.trim() || undefined,
      requestedBy: userName,
    });
    nav('T07', { studentId, sectionId });
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Request correction"
        subtitle={`${student.displayName} · ${sectionLabel(data, sectionId)} · ${fmtDate(date)}`}
        accent="#0E9F9A"
        onBack={() => nav('T08', { date, sectionId, studentId })}
      />
      <div className="space-y-3 p-4 pb-6">
        <PhoneCard>
          <p className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Student</p>
          <p className="text-[14px] font-bold text-ink">{student.displayName}</p>
          <p className="text-[11.5px] text-muted-foreground">Admission {student.admNo}</p>
        </PhoneCard>

        <PhoneCard>
          <div className="flex items-center justify-between gap-2 border-b border-line/60 pb-2.5">
            <span className="text-[12.5px] font-semibold text-ink-soft">Existing status</span>
            <MarkChip mark={existing} />
          </div>
          <div className="pt-2.5">
            <p className="mb-1.5 text-[12.5px] font-semibold text-ink-soft">Requested status</p>
            <AttendanceStatusSelector
              value={to}
              onChange={(s: AttStatus) => {
                if (s !== 'unmarked') setTo(s);
              }}
            />
            {sameStatus && (
              <p className="mt-1.5 text-[11.5px] font-medium text-[#8a5a00]">
                Pick a status different from the current mark.
              </p>
            )}
          </div>
        </PhoneCard>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="corr-reason" className="text-[13px] font-semibold text-ink-soft">
            Reason <span className="text-danger">*</span>
          </label>
          <Textarea
            id="corr-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Why should the office change this mark?"
            rows={3}
            className={`rounded-control bg-background ${tried && reasonInvalid ? 'border-danger' : ''}`}
          />
          {tried && reasonInvalid && (
            <p className="text-[12px] font-medium text-danger">Reason is required.</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="corr-note" className="text-[13px] font-semibold text-ink-soft">
            Supporting note
          </label>
          <Input
            id="corr-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional reference, e.g. bus log, clinic slip"
            className="h-11 min-h-[44px] rounded-control bg-background"
          />
        </div>
      </div>

      <PhoneStickyBar>
        <Button
          variant="outline"
          className="h-12 min-h-[44px] flex-1 rounded-control"
          onClick={() => nav('T08', { date, sectionId, studentId })}
        >
          Cancel
        </Button>
        <Button
          className="h-12 min-h-[44px] flex-1 rounded-control bg-teal font-bold hover:bg-teal/90"
          onClick={submit}
        >
          Submit request
        </Button>
      </PhoneStickyBar>
    </div>
  );
}
