'use client';

import { useMemo } from 'react';
import { ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { EmptyState, InfoRow, StatusChip } from '@/components/erp/ui/primitives';
import {
  activeEnrollmentOf, attendanceHistoryFor, getStudent, sectionLabel,
} from '@/lib/erp/derive';
import { fmtDate, fmtPct } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

export default function T06StudentCard() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);

  const studentId = params.studentId ?? 'stu-ananya';
  const sectionId = params.sectionId ?? 's-7a';
  const student = getStudent(data, studentId);
  const enrollment = activeEnrollmentOf(data, studentId, ayId);

  const monthHistory = useMemo(
    () => attendanceHistoryFor(data, studentId, sectionId).filter((h) => h.date.startsWith('2026-07')),
    [data, studentId, sectionId],
  );
  const present = monthHistory.filter((h) => h.status === 'P').length;
  const absent = monthHistory.filter((h) => h.status === 'A').length;
  const leave = monthHistory.filter((h) => h.status === 'L').length;
  const marked = present + absent + leave;
  const pct = marked > 0 ? (present / marked) * 100 : 0;

  /* Latest authorized note: most recent register with an A/L reason for this student */
  const note = (() => {
    const regs = data.registers
      .filter((r) => r.sectionId === sectionId)
      .sort((x, y) => y.date.localeCompare(x.date));
    for (const r of regs) {
      const reason = r.reasons[studentId];
      const mark = r.marks[studentId];
      if (reason && (mark === 'A' || mark === 'L')) return { reason, date: r.date };
    }
    return undefined;
  })();

  if (!student) {
    return (
      <div className="flex min-h-full flex-col">
        <PhoneHeader title="Student card" accent="#0E9F9A" onBack={() => nav('T05', { sectionId })} />
        <div className="p-4">
          <EmptyState title="Student not found" description="This student is not on the active roster." />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title={student.displayName}
        subtitle={`Roll ${enrollment?.rollNo ?? '—'} · ${student.admNo}`}
        accent="#0E9F9A"
        onBack={() => nav('T05', { sectionId })}
      />
      <div className="space-y-3 p-4 pb-6">
        <PhoneCard>
          <p className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Identity</p>
          <InfoRow label="Admission number" value={student.admNo} mono />
          <InfoRow label="GR number" value={student.grNo} mono />
          <InfoRow label="Date of birth" value={fmtDate(student.dob)} />
          <InfoRow label="Enrollment status" value={<StatusChip status={student.status} />} />
        </PhoneCard>

        <PhoneCard>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
            Attendance summary · {sectionLabel(data, sectionId)} · July 2026
          </p>
          <div className="mt-2 grid grid-cols-4 gap-1.5 text-center">
            <div className="rounded-[10px] bg-success-soft py-1.5">
              <p className="font-heading text-[16px] font-bold tabular-nums text-success">{present}</p>
              <p className="text-[10px] font-semibold text-success">Present</p>
            </div>
            <div className="rounded-[10px] bg-danger-soft py-1.5">
              <p className="font-heading text-[16px] font-bold tabular-nums text-danger">{absent}</p>
              <p className="text-[10px] font-semibold text-danger">Absent</p>
            </div>
            <div className="rounded-[10px] bg-amber-soft py-1.5">
              <p className="font-heading text-[16px] font-bold tabular-nums text-[#8a5a00]">{leave}</p>
              <p className="text-[10px] font-semibold text-[#8a5a00]">Leave</p>
            </div>
            <div className="rounded-[10px] bg-[#FAFBFE] py-1.5">
              <p className="font-heading text-[16px] font-bold tabular-nums text-ink">{fmtPct(pct)}</p>
              <p className="text-[10px] font-semibold text-muted-foreground">Present</p>
            </div>
          </div>
        </PhoneCard>

        <PhoneCard className={note ? 'border-teal/30' : undefined}>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Authorized note</p>
          {note ? (
            <p className="mt-1 text-[13px] text-ink">
              <span className="font-bold text-teal">Authorized note:</span> {note.reason} ({fmtDate(note.date)})
            </p>
          ) : (
            <p className="mt-1 text-[13px] text-muted-foreground">No authorized notes</p>
          )}
        </PhoneCard>

        <Button
          className="h-12 min-h-[44px] w-full rounded-control bg-teal font-bold hover:bg-teal/90"
          onClick={() => nav('T07', { studentId, sectionId })}
        >
          <ClipboardList className="h-4 w-4" aria-hidden /> View attendance history
        </Button>
      </div>
    </div>
  );
}
