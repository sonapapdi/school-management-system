'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { InfoRow, StatusChip } from '@/components/erp/ui/primitives';
import { rosterOf, sectionLabel } from '@/lib/erp/derive';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import { cn } from '@/lib/utils';

export default function T12Profile() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const nav = useErp((s) => s.nav);
  const userName = useErp((s) => s.session.userName);
  const createOfficeTask = useErp((s) => s.createOfficeTask);
  const pushToast = useErp((s) => s.pushToast);

  const staff = data.staff.find((s) => s.id === 'stf-farah');
  const assignments = data.assignments.filter((a) => a.staffId === 'stf-farah' && a.sectionId);

  const [reportOpen, setReportOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');

  const submitReport = () => {
    const trimmed = reportNote.trim();
    if (!trimmed) return;
    createOfficeTask({ studentId: '—', note: trimmed, from: userName });
    pushToast({ title: 'Report sent to the office', variant: 'success' });
    setReportNote('');
    setReportOpen(false);
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Profile" subtitle={userName} accent="#0E9F9A" />
      <div className="space-y-3 p-4 pb-6">
        <PhoneCard className="border-teal/30">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-teal-soft font-heading text-[17px] font-bold text-teal">
              FK
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate font-heading text-[16px] font-bold text-ink">{userName}</p>
              <p className="text-[12px] text-muted-foreground">Staff code {staff?.code ?? 'STF-006'}</p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span className="rounded-full border border-teal/25 bg-teal-soft px-2 py-0.5 text-[11px] font-semibold text-teal">
                  {staff?.role ?? 'Class Teacher'}
                </span>
                <StatusChip status="active" />
              </div>
            </div>
          </div>
        </PhoneCard>

        <PhoneCard>
          <p className="mb-2 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
            Assigned sections
          </p>
          <div className="space-y-2">
            {assignments.map((a) => {
              const sid = a.sectionId!;
              const isCT = a.type === 'Class Teacher';
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => nav('T05', { sectionId: sid })}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-[12px] border border-line px-3 py-2.5 text-left transition-colors hover:bg-[#FAFBFF] active:bg-muted"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-semibold text-ink">
                      {sectionLabel(data, sid)} · {rosterOf(data, sid, ayId).length} students
                    </span>
                    <span className="block truncate text-[11.5px] text-muted-foreground">
                      {fmtDate(a.start)} – {a.end ? fmtDate(a.end) : 'Ongoing'}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'shrink-0 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold',
                      isCT ? 'border-teal/25 bg-teal-soft text-teal' : 'border-line bg-card text-muted-foreground',
                    )}
                  >
                    {a.type}
                  </span>
                </button>
              );
            })}
          </div>
        </PhoneCard>

        <PhoneCard>
          <p className="mb-1 text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Account</p>
          <InfoRow label="Email" value={staff?.email ?? '—'} />
          <InfoRow label="Mobile" value={staff?.mobile ?? '—'} mono />
          <InfoRow label="Last sign-in" value={fmtDateTime(staff?.lastSignIn)} />
        </PhoneCard>

        <div>
          <Button
            variant="outline"
            className="h-11 min-h-[44px] w-full rounded-control"
            onClick={() => setReportOpen((v) => !v)}
            aria-expanded={reportOpen}
          >
            Report incorrect assignment
          </Button>
          {reportOpen && (
            <div className="mt-2 flex flex-col gap-2 rounded-[12px] border border-line bg-card p-3">
              <Textarea
                value={reportNote}
                onChange={(e) => setReportNote(e.target.value)}
                placeholder="Describe what is wrong with your assignments…"
                rows={3}
                className="rounded-control bg-background"
                aria-label="Report note"
              />
              <Button
                className="h-11 min-h-[44px] w-full rounded-control bg-teal font-bold hover:bg-teal/90"
                disabled={!reportNote.trim()}
                onClick={submitReport}
              >
                Submit report
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
