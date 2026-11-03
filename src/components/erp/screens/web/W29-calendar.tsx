'use client';

import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/erp/ui/table';
import {
  Field, LockedHint, PageHeader, PermissionState, Section, SkeletonTable,
} from '@/components/erp/ui/primitives';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { daysInMonth, fmtDate, monthLabel, useFakeLoad, weekday } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import type { Holiday } from '@/lib/erp/types';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function DayTypeChip({ type }: { type: 'Holiday' | 'Teaching day' }) {
  return type === 'Holiday' ? (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-amber/25 bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-[#8a5a00]">Holiday</span>
  ) : (
    <span className="inline-flex items-center whitespace-nowrap rounded-full border border-teal/20 bg-teal-soft px-2 py-0.5 text-[11px] font-semibold text-teal">Teaching day</span>
  );
}

export default function W29Calendar() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const addHoliday = useErp((s) => s.addHoliday);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(6); // July 2026
  const [formDate, setFormDate] = useState('');
  const [formType, setFormType] = useState<'Holiday' | 'Teaching day'>('Holiday');
  const [formName, setFormName] = useState('');
  const [formApplies, setFormApplies] = useState('All');

  const holidayMap = useMemo(() => {
    const m = new Map<string, Holiday>();
    for (const h of data.holidays) {
      const cur = m.get(h.date);
      if (!cur || (cur.type === 'Teaching day' && h.type === 'Holiday')) m.set(h.date, h);
    }
    return m;
  }, [data.holidays]);

  if (!can(role, 'academics', 'view')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Academics" />
      </div>
    );
  }

  const canUpdate = can(role, 'academics', 'update');

  const sortedHolidays = [...data.holidays].sort((a, b) => a.date.localeCompare(b.date));

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(year - 1); } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(year + 1); } else setMonth(month + 1);
  };

  const firstDow = new Date(Date.UTC(year, month, 1)).getUTCDay();
  const dayCount = daysInMonth(month, year);

  const validateForm = (): boolean => {
    if (!formDate || !formName.trim()) {
      pushToast({ title: 'Date and name are required.', variant: 'error' });
      return false;
    }
    return true;
  };

  const submitHoliday = (type: 'Holiday' | 'Teaching day') => {
    if (!validateForm()) return;
    addHoliday({ date: formDate, type, name: formName.trim(), appliesTo: formApplies });
    setFormType(type);
    setFormName('');
  };

  const columns: Column<Holiday>[] = [
    {
      key: 'date', header: 'Date', render: (h) => (
        <div>
          <p className="font-semibold text-ink">{fmtDate(h.date)}</p>
          <p className="text-[11px] text-muted-foreground">{weekday(h.date)}</p>
        </div>
      ), sortValue: (h) => h.date,
    },
    { key: 'type', header: 'Day type', render: (h) => <DayTypeChip type={h.type} /> },
    { key: 'name', header: 'Holiday name', render: (h) => <span className="font-semibold text-ink">{h.name}</span> },
    { key: 'appliesTo', header: 'Applies to', render: (h) => h.appliesTo },
  ];

  return (
    <div>
      <PageHeader
        title="Calendar & holidays"
        description="Holidays block the day; teaching days are extra school days such as compensating days."
        actions={!canUpdate ? <LockedHint>Editing the calendar needs update permission</LockedHint> : undefined}
      />

      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-5">
          <div className="space-y-4 lg:col-span-2">
            <Section
              title={monthLabel(month, year)}
              description="Month at a glance"
              actions={
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-control" onClick={prevMonth} aria-label="Previous month">
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </Button>
                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-control" onClick={nextMonth} aria-label="Next month">
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </Button>
                </div>
              }
            >
              <div className="grid grid-cols-7 gap-1">
                {WEEKDAYS.map((w) => (
                  <div key={w} className="py-1 text-center text-[10.5px] font-bold uppercase tracking-wide text-muted-foreground">{w}</div>
                ))}
                {Array.from({ length: firstDow }, (_, i) => <div key={`blank-${i}`} aria-hidden />)}
                {Array.from({ length: dayCount }, (_, i) => {
                  const day = i + 1;
                  const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const hol = holidayMap.get(date);
                  const dow = new Date(Date.UTC(year, month, day)).getUTCDay();
                  return (
                    <div
                      key={date}
                      title={hol ? `${hol.type}: ${hol.name}` : undefined}
                      className={cn(
                        'flex h-9 items-center justify-center rounded-[8px] border border-transparent text-[12.5px] tabular-nums',
                        hol?.type === 'Holiday' && 'border-amber/30 bg-amber-soft font-semibold text-[#8a5a00]',
                        hol?.type === 'Teaching day' && 'border-teal/25 bg-teal-soft font-semibold text-teal',
                        !hol && dow === 0 && 'text-muted-foreground',
                        date === schoolDate && 'ring-2 ring-brand',
                      )}
                    >
                      {day}
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line pt-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[4px] border border-amber/30 bg-amber-soft" aria-hidden /> Holiday</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[4px] border border-teal/25 bg-teal-soft" aria-hidden /> Teaching day</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-[4px] ring-2 ring-brand" aria-hidden /> Today</span>
              </div>
            </Section>

            <Section title="Add holiday" description="Applies to the current academic year.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Date" required>
                  <Input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="rounded-control bg-background" aria-label="Date" />
                </Field>
                <Field label="Day type">
                  <Select value={formType} onValueChange={(v) => setFormType(v as 'Holiday' | 'Teaching day')}>
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Day type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Holiday">Holiday</SelectItem>
                      <SelectItem value="Teaching day">Teaching day</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Name" required>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Independence Day" className="rounded-control bg-background" />
                </Field>
                <Field label="Applies to">
                  <Select value={formApplies} onValueChange={setFormApplies}>
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Applies to">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All</SelectItem>
                      <SelectItem value="Grade">Grade</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button className="rounded-control" disabled={!canUpdate} onClick={() => submitHoliday('Holiday')}>Add holiday</Button>
                <Button variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => submitHoliday('Teaching day')}>Mark teaching day</Button>
                <Button variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => pushToast({ title: 'Calendar saved', variant: 'success' })}>
                  Save calendar
                </Button>
              </div>
            </Section>
          </div>

          <div className="lg:col-span-3">
            <DataTable
              rows={sortedHolidays}
              columns={columns}
              rowKey={(h) => h.id}
              searchPlaceholder="Search holidays…"
              searchable={(h) => `${h.name} ${h.date}`}
              emptyTitle="No holidays or teaching days"
              emptyDescription="Add the first entry using the form."
            />
          </div>
        </div>
      )}
    </div>
  );
}
