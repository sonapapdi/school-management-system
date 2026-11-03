'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayCell, PhoneHeader } from '@/components/erp/ui/phone';
import { getStudent, monthMarks, sectionLabel } from '@/lib/erp/derive';
import { monthLabel } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';
const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as const;

export default function P02AttendanceCalendar() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);
  const params = useErp((s) => s.route.params);

  /* July 2026 by default (the demo school date is 21 Jul 2026) */
  const [sel, setSel] = useState({ month: 6, year: 2026 });

  const child = getStudent(data, CHILD_ID);
  const enr = data.enrollments.find((e) => e.studentId === CHILD_ID && e.status === 'active');
  const classLabel = enr ? sectionLabel(data, enr.sectionId) : '—';

  const marks = monthMarks(data, CHILD_ID, sel.year, sel.month);
  const offset = (new Date(sel.year, sel.month, 1).getDay() + 6) % 7; // Monday-first grid

  const shift = (delta: number) =>
    setSel((s) => {
      const m = s.month + delta;
      if (m < 0) return { month: 11, year: s.year - 1 };
      if (m > 11) return { month: 0, year: s.year + 1 };
      return { month: m, year: s.year };
    });

  const counts = marks.reduce(
    (acc, m) => {
      if (m.status === 'P') acc.present += 1;
      else if (m.status === 'A') acc.absent += 1;
      else if (m.status === 'L') acc.leave += 1;
      else if (m.status === 'unmarked') acc.pending += 1;
      return acc;
    },
    { present: 0, absent: 0, leave: 0, pending: 0 },
  );

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Attendance"
        subtitle={`${child?.displayName ?? '—'} · ${classLabel}`}
        accent="#5B5FEF"
      />

      <div className="space-y-3 p-4 pb-6">
        {/* Month selector */}
        <div className="flex items-center justify-between gap-2 rounded-[12px] border border-line bg-card px-2 py-2">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Previous month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <p className="font-heading text-[15px] font-bold text-ink">{monthLabel(sel.month, sel.year)}</p>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Next month"
            className="flex h-11 w-11 items-center justify-center rounded-full text-ink hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        {/* Calendar grid */}
        <div className="rounded-[12px] border border-line bg-card p-3">
          <div className="mb-1 grid grid-cols-7 place-items-center">
            {WEEKDAYS.map((d) => (
              <span key={d} className="text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">
                {d}
              </span>
            ))}
          </div>
          <div className="grid grid-cols-7 place-items-center gap-y-1">
            {Array.from({ length: offset }).map((_, i) => (
              <span key={`pad-${i}`} className="h-10 w-10" aria-hidden />
            ))}
            {marks.map((m) => {
              const day = Number(m.date.slice(8));
              if (m.date > schoolDate) {
                /* Future days render as plain, non-interactive text */
                return (
                  <span
                    key={m.date}
                    className="flex h-10 w-10 items-center justify-center rounded-[11px] text-[13px] font-semibold text-[#C4CAD6]"
                  >
                    {day}
                  </span>
                );
              }
              return (
                <DayCell
                  key={m.date}
                  day={day}
                  status={m.status}
                  selected={params.date === m.date}
                  onClick={m.status !== 'no_school' ? () => nav('P03', { date: m.date }) : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] font-semibold text-muted-foreground">
          {([
            ['Present', 'bg-success'],
            ['Absent', 'bg-danger'],
            ['Leave', 'bg-amber'],
            ['Pending', 'bg-[#C4CAD6]'],
          ] as const).map(([label, dot]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={cn('h-2 w-2 rounded-full', dot)} aria-hidden /> {label}
            </span>
          ))}
        </div>

        {/* Month summary */}
        <div className="grid grid-cols-4 gap-2">
          {([
            ['Present', counts.present, 'text-success'],
            ['Absent', counts.absent, 'text-danger'],
            ['Leave', counts.leave, 'text-[#8a5a00]'],
            ['Pending', counts.pending, 'text-muted-foreground'],
          ] as const).map(([label, value, tone]) => (
            <div key={label} className="rounded-[12px] border border-line bg-card px-2 py-2.5 text-center">
              <p className={cn('font-heading text-[17px] font-bold tabular-nums', tone)}>{value}</p>
              <p className="text-[10.5px] font-semibold text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-[11.5px] text-muted-foreground">
          Tap a day to see the shared detail from the school office.
        </p>
      </div>
    </div>
  );
}
