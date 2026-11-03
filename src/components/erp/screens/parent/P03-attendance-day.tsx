'use client';

import { useState } from 'react';
import { Phone as PhoneIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { MarkChip } from '@/components/erp/ui/primitives';
import { registerFor, studentMarkOn } from '@/lib/erp/derive';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{children}</span>
    </div>
  );
}

export default function P03AttendanceDay() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const userName = useErp((s) => s.session.userName);
  const settings = useErp((s) => s.settings);
  const nav = useErp((s) => s.nav);
  const createOfficeTask = useErp((s) => s.createOfficeTask);
  const pushToast = useErp((s) => s.pushToast);

  const date = params.date ?? schoolDate;
  const sectionId =
    data.enrollments.find((e) => e.studentId === CHILD_ID && e.status === 'active')?.sectionId ?? 's-7a';
  const mark = studentMarkOn(data, CHILD_ID, date);
  const register = registerFor(data, date, sectionId);

  const [reportOpen, setReportOpen] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState(false);

  const submitReport = () => {
    if (note.trim().length < 5) {
      setError(true);
      return;
    }
    createOfficeTask({ studentId: CHILD_ID, note: note.trim(), from: userName });
    pushToast({
      title: 'Report sent to the office',
      description: 'The school office will review and respond.',
      variant: 'success',
    });
    setNote('');
    setError(false);
    setReportOpen(false);
  };

  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Day detail" subtitle={fmtDate(date)} accent="#5B5FEF" onBack={() => nav('P02')} />

      <div className="space-y-3 p-4 pb-6">
        {/* Day detail */}
        <PhoneCard>
          <DetailRow label="Date">{fmtDate(date)}</DetailRow>
          <DetailRow label="Status">
            <span className="inline-flex [&>span]:px-3 [&>span]:py-1 [&>span]:text-[13px]">
              <MarkChip mark={mark?.status ?? 'unmarked'} />
            </span>
          </DetailRow>
          <DetailRow label="Shared reason">
            <span className="block">{mark?.reason ?? '—'}</span>
            <span className="mt-0.5 block text-[11px] font-normal text-muted-foreground">
              Shared by the school office
            </span>
          </DetailRow>
          <DetailRow label="Submitted at">
            {register?.submittedAt ? fmtDateTime(register.submittedAt) : '—'}
          </DetailRow>
        </PhoneCard>

        {/* Call the office */}
        <a
          href={telHref}
          className="flex min-h-[52px] items-center gap-3 rounded-[12px] border border-line bg-card px-3.5 py-3 transition-colors hover:bg-[#FAFBFF]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-ink-soft">
            <PhoneIcon className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-semibold text-ink">School contact</span>
            <span className="block truncate text-[12px] text-muted-foreground">{settings.phone}</span>
          </span>
          <span className="text-[12.5px] font-bold text-brand">Call office</span>
        </a>

        {/* Report a possible error */}
        <PhoneCard className="border-amber/30 bg-amber-soft/40">
          <p className="text-[13px] font-semibold text-ink">Something look wrong?</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Reporting creates an office task. You can never edit attendance directly.
          </p>
          {reportOpen ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setError(false);
                }}
                placeholder="Describe what looks wrong (e.g. child was in school but marked absent)…"
                rows={3}
                aria-label="Report note"
                className={error ? 'border-danger' : undefined}
              />
              {error && <p className="text-[12px] font-medium text-danger">Please write at least 5 characters.</p>}
              <div className="flex gap-2">
                <Button
                  className="h-11 flex-1 rounded-control bg-brand font-bold hover:bg-brand/90"
                  onClick={submitReport}
                >
                  Submit report
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1 rounded-control"
                  onClick={() => {
                    setReportOpen(false);
                    setNote('');
                    setError(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              variant="outline"
              className="mt-3 h-11 w-full rounded-control font-bold"
              onClick={() => setReportOpen(true)}
            >
              Report a possible error
            </Button>
          )}
        </PhoneCard>
      </div>
    </div>
  );
}
