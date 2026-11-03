'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneHeader } from '@/components/erp/ui/phone';
import { EmptyState, StatusChip } from '@/components/erp/ui/primitives';
import {
  attendanceHistoryFor, getStudent, registerFor, sectionLabel,
} from '@/lib/erp/derive';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

const MONTH_OPTIONS = [
  { value: '2026-07', label: 'July 2026' },
  { value: '2026-06', label: 'June 2026' },
];

function MonthFilter({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <p className="text-[12px] font-semibold text-ink-soft">Month</p>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Filter by month"
        className="h-10 rounded-control border border-line bg-card px-2.5 text-[12.5px] font-semibold text-ink"
      >
        {MONTH_OPTIONS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}

export default function T07AttendanceHistory() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);

  const studentId = params.studentId;
  const classTeacherSection = data.assignments.find(
    (a) => a.staffId === 'stf-farah' && a.type === 'Class Teacher',
  )?.sectionId ?? 's-7a';
  const sectionId = params.sectionId ?? classTeacherSection;
  const [month, setMonth] = useState('2026-07');
  const student = studentId ? getStudent(data, studentId) : undefined;

  /* Student mode: one row per date with submission + correction status */
  const studentRows = useMemo(() => {
    if (!studentId) return [];
    return attendanceHistoryFor(data, studentId, sectionId)
      .filter((h) => h.date.startsWith(month))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map((h) => ({
        date: h.date,
        reg: registerFor(data, h.date, sectionId),
        correction: data.corrections.find((c) => c.studentId === studentId && c.date === h.date),
      }));
  }, [data, studentId, sectionId, month]);

  /* Section mode: recent school dates for the class-teacher section */
  const sectionRows = useMemo(() => {
    if (studentId) return [];
    return data.registers
      .filter((r) => r.sectionId === sectionId && r.date.startsWith(month))
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [data, sectionId, month, studentId]);

  const rows = studentId ? studentRows : sectionRows;

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Attendance history"
        subtitle={student
          ? `${student.displayName} · ${sectionLabel(data, sectionId)}`
          : `${sectionLabel(data, sectionId)} · recent registers`}
        accent="#0E9F9A"
        onBack={student
          ? () => nav('T06', { studentId, sectionId })
          : () => nav('T01')}
      />
      <div className="space-y-3 p-4 pb-6">
        <MonthFilter value={month} onChange={setMonth} />

        {rows.length === 0 ? (
          <EmptyState
            title="No registers for this month"
            description="Submitted registers will appear here once marking starts."
          />
        ) : studentId ? (
          <div className="space-y-1.5">
            {studentRows.map(({ date, reg, correction }) => (
              <div key={date} className="rounded-[12px] border border-line bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink">{fmtDate(date)}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                      {sectionLabel(data, sectionId)}
                      {reg?.submittedAt ? ` · Submitted ${fmtDateTime(reg.submittedAt)}` : ' · Not submitted'}
                    </p>
                  </div>
                  <StatusChip status={reg?.status ?? 'unmarked'} />
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
                    Correction:
                    {correction ? <StatusChip status={correction.status} /> : <span>—</span>}
                  </span>
                  <Button
                    variant="outline"
                    className="h-11 min-h-[44px] shrink-0 rounded-control text-[12.5px]"
                    onClick={() => nav('T08', { date, sectionId, studentId })}
                  >
                    Open register
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1.5">
            {sectionRows.map((r) => (
              <div key={r.id} className="rounded-[12px] border border-line bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-bold text-ink">{fmtDate(r.date)}</p>
                    {r.submittedAt ? (
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">
                        Submitted {fmtDateTime(r.submittedAt)} · {r.submittedBy}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[11.5px] text-muted-foreground">Not submitted yet</p>
                    )}
                  </div>
                  <StatusChip status={r.status} />
                </div>
                <div className="mt-2 flex justify-end">
                  {r.status === 'submitted' ? (
                    <Button
                      variant="outline"
                      className="h-11 min-h-[44px] rounded-control text-[12.5px]"
                      onClick={() => nav('T08', { date: r.date, sectionId })}
                    >
                      Open register
                    </Button>
                  ) : (
                    <Button
                      className="h-11 min-h-[44px] rounded-control bg-teal font-bold text-[12.5px] hover:bg-teal/90"
                      onClick={() => nav('T02', { sectionId })}
                    >
                      Take attendance
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button
          variant="outline"
          className="h-11 min-h-[44px] w-full rounded-control"
          onClick={() => nav('T02', { sectionId })}
        >
          <CalendarCheck className="h-4 w-4 text-teal" aria-hidden /> Attendance tab
        </Button>
        <p className="text-center text-[11px] text-muted-foreground">
          Today is {fmtDate(schoolDate)} · registers list newest first
        </p>
      </div>
    </div>
  );
}
