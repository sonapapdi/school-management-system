'use client';

import { useMemo, useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PhoneHeader } from '@/components/erp/ui/phone';
import { EmptyState, SearchInput, StatusChip } from '@/components/erp/ui/primitives';
import { rosterOf, sectionLabel } from '@/lib/erp/derive';
import { useErp } from '@/lib/erp/store';

export default function T05ClassRoster() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const params = useErp((s) => s.route.params);
  const nav = useErp((s) => s.nav);

  const sectionId = params.sectionId ?? 's-7a';
  const roster = useMemo(() => rosterOf(data, sectionId, ayId), [data, sectionId, ayId]);
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = roster.filter(({ student }) =>
    student.displayName.toLowerCase().includes(q) || student.admNo.toLowerCase().includes(q));

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Class roster"
        subtitle={`${sectionLabel(data, sectionId)} · ${roster.length} students`}
        accent="#0E9F9A"
        onBack={() => nav('T04')}
      />
      <div className="space-y-3 p-4 pb-6">
        <SearchInput value={query} onChange={setQuery} placeholder="Search name or admission no…" />
        <p className="text-[11.5px] text-muted-foreground">
          {roster.length} students · {filtered.length} shown
        </p>
        {filtered.length === 0 ? (
          <EmptyState title="No students found" description="Try a different name or admission number." />
        ) : (
          <div className="space-y-1.5">
            {filtered.map(({ enrollment, student }) => (
              <button
                key={student.id}
                type="button"
                onClick={() => nav('T06', { studentId: student.id, sectionId })}
                className="flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-left transition-colors hover:bg-[#FAFBFF] active:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-soft text-[12.5px] font-bold text-teal">
                  {enrollment.rollNo}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[14px] font-semibold text-ink">{student.displayName}</span>
                  <span className="block truncate text-[11.5px] text-muted-foreground">Adm {student.admNo}</span>
                </span>
                <StatusChip status={student.status} />
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
