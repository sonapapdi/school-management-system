'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { StatusChip } from '@/components/erp/ui/primitives';
import { getStudent, rosterOf, sectionLabel } from '@/lib/erp/derive';
import { fmtDate, initials } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';
const AY_ID = 'ay-2026-27';

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="text-right text-[13px] font-semibold text-ink">{children}</span>
    </div>
  );
}

export default function P10ChildProfile() {
  const data = useErp((s) => s.data);
  const userName = useErp((s) => s.session.userName);
  const createOfficeTask = useErp((s) => s.createOfficeTask);
  const pushToast = useErp((s) => s.pushToast);

  const child = getStudent(data, CHILD_ID);
  const enr = data.enrollments.find(
    (e) => e.studentId === CHILD_ID && e.ayId === AY_ID && e.status === 'active',
  );
  const sec = data.sections.find((x) => x.id === enr?.sectionId);
  const grade = data.grades.find((g) => g.id === sec?.gradeId);
  const ay = data.academicYears.find((a) => a.id === enr?.ayId);
  const rollNo = sec
    ? rosterOf(data, sec.id, enr?.ayId ?? AY_ID).find((x) => x.student.id === CHILD_ID)?.enrollment.rollNo
    : undefined;

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

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Child profile" accent="#5B5FEF" />

      <div className="space-y-3 p-4 pb-6">
        {/* Identity card */}
        <PhoneCard className="flex items-center gap-3">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-[18px] font-extrabold text-brand-dark">
            {child ? initials(child.displayName) : '—'}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-heading text-[16px] font-bold text-ink">
              {child?.displayName ?? '—'}
            </span>
            <span className="block text-[12.5px] text-muted-foreground">
              {enr ? sectionLabel(data, enr.sectionId) : '—'} · Roll no {rollNo ?? '—'}
            </span>
          </span>
          <StatusChip status={child?.status ?? 'inactive'} />
        </PhoneCard>

        {/* School record */}
        <PhoneCard>
          <InfoRow label="Admission number">{child?.admNo ?? '—'}</InfoRow>
          <InfoRow label="GR number">{child?.grNo ?? '—'}</InfoRow>
          <InfoRow label="Grade">{grade?.name ?? '—'}</InfoRow>
          <InfoRow label="Section">{sec?.name ?? '—'}</InfoRow>
          <InfoRow label="School year">{ay?.name ?? '—'}</InfoRow>
          <InfoRow label="Date of birth">{child ? fmtDate(child.dob) : '—'}</InfoRow>
          <InfoRow label="Gender">{child?.gender ?? '—'}</InfoRow>
        </PhoneCard>

        {/* Report incorrect information */}
        <PhoneCard className="border-amber/30 bg-amber-soft/40">
          <p className="text-[13px] font-semibold text-ink">Incorrect information? Tell the office.</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            Reporting creates an office task. Records are updated only by the school office.
          </p>
          {reportOpen ? (
            <div className="mt-3 space-y-2">
              <Textarea
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setError(false);
                }}
                placeholder="Describe what is incorrect (e.g. spelling of the name, date of birth)…"
                rows={3}
                aria-label="Report note"
                className={cn(error && 'border-danger')}
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
              Report incorrect information
            </Button>
          )}
        </PhoneCard>
      </div>
    </div>
  );
}
