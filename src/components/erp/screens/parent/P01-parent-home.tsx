'use client';

import { ArrowRight, Bell, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChildSwitcher, PhoneCard, PhoneHeader, PhoneRow } from '@/components/erp/ui/phone';
import { EmptyState, Money, StatusChip } from '@/components/erp/ui/primitives';
import { getStudent, noticesForRole, sectionLabel, studentInstallments, studentMarkOn } from '@/lib/erp/derive';
import { fmtDate, initials } from '@/lib/erp/utils';
import { cn } from '@/lib/utils';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

export default function P01ParentHome() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const userName = useErp((s) => s.session.userName);
  const nav = useErp((s) => s.nav);

  /* Children linked to this guardian with app access (demo parent → Ananya only) */
  const guardianChildIds = Array.from(
    new Set(data.guardians.filter((g) => g.appAccess && g.name === userName).map((g) => g.studentId)),
  );
  const childList = (guardianChildIds.length > 0 ? guardianChildIds : [CHILD_ID]).map((id) => {
    const st = getStudent(data, id);
    const enr = data.enrollments.find((e) => e.studentId === id && e.status === 'active');
    return { id, name: st?.displayName ?? id, className: enr ? sectionLabel(data, enr.sectionId) : '—' };
  });
  const switcherProps = { children: childList, current: CHILD_ID, onSelect: () => undefined };

  /* Today's attendance */
  const mark = studentMarkOn(data, CHILD_ID, schoolDate);
  const att = mark?.status ?? 'unmarked';

  /* Fees — next unpaid installment */
  const nextInst = studentInstallments(data, CHILD_ID).find((i) => i.remaining > 0);
  const nextTerm = nextInst ? (nextInst.head.split('—').pop() ?? '').trim() : '';

  /* Latest notice for the child's section */
  const latest = noticesForRole(data, 'parent', 's-7a')[0];

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title="Home"
        subtitle={`Namaste, ${userName.split(' ')[0]} ji`}
        accent="#5B5FEF"
        right={
          <button
            type="button"
            onClick={() => nav('P12')}
            aria-label="Help & contact"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand/10 font-heading text-[13px] font-bold text-brand-dark"
          >
            {initials(userName) || 'RP'}
          </button>
        }
      />

      <div className="space-y-3 p-4 pb-6">
        {/* Child switcher — single child renders as a plain identity card */}
        <ChildSwitcher {...switcherProps} />

        {/* Today's attendance */}
        <PhoneCard>
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11.5px] font-bold uppercase tracking-wide text-brand">Today’s attendance</p>
            <span className="text-[11.5px] text-muted-foreground">{fmtDate(schoolDate)}</span>
          </div>
          {att === 'P' || att === 'A' || att === 'L' ? (
            <div
              className={cn(
                'mt-3 rounded-[12px] py-4 text-center',
                att === 'P' && 'bg-success-soft',
                att === 'A' && 'bg-danger-soft',
                att === 'L' && 'bg-amber-soft',
              )}
            >
              <p
                className={cn(
                  'font-heading text-[22px] font-extrabold',
                  att === 'P' ? 'text-success' : att === 'A' ? 'text-danger' : 'text-[#8a5a00]',
                )}
              >
                {att === 'P' ? 'Present' : att === 'A' ? 'Absent' : 'Leave'}
              </p>
              {mark?.reason && <p className="mt-0.5 text-[12px] text-muted-foreground">{mark.reason}</p>}
            </div>
          ) : (
            <div className="mt-3 rounded-[12px] bg-muted py-4 text-center">
              <StatusChip status="attendance_pending" />
              <p className="mt-1.5 text-[12px] text-muted-foreground">Register not submitted yet</p>
            </div>
          )}
          <Button className="mt-3 h-12 w-full rounded-control bg-brand font-bold hover:bg-brand/90" onClick={() => nav('P02')}>
            Open attendance
          </Button>
        </PhoneCard>

        {/* Fees — next due */}
        <PhoneCard>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-brand">Fees — next due</p>
          {nextInst ? (
            <div className="mt-2 flex items-end justify-between gap-2">
              <Money value={nextInst.remaining} className="font-heading text-[24px] font-extrabold text-danger" />
              <span className="pb-1 text-right text-[12px] text-muted-foreground">
                {nextTerm} · due {fmtDate(nextInst.dueDate)}
              </span>
            </div>
          ) : (
            <p className="mt-2 text-[13.5px] font-semibold text-success">No dues pending — all posted fees are cleared.</p>
          )}
          <Button variant="outline" className="mt-3 h-12 w-full rounded-control font-bold" onClick={() => nav('P04')}>
            Open fees
          </Button>
        </PhoneCard>

        {/* Latest notice */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-heading text-[14px] font-bold text-ink">Latest notice</p>
            <button
              type="button"
              onClick={() => nav('P08')}
              className="min-h-[44px] px-1 text-[12px] font-semibold text-brand"
            >
              View all
            </button>
          </div>
          {latest ? (
            <PhoneRow
              icon={Bell}
              title={latest.title}
              subtitle={`Published ${fmtDate(latest.publishDate)} · ${latest.author}`}
              onClick={() => nav('P09', { noticeId: latest.id })}
              right={<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
            />
          ) : (
            <EmptyState title="No notices yet" description="Notices from the school office will appear here." />
          )}
        </div>

        {/* Read-only footer note */}
        <PhoneCard className="border-dashed bg-[#FAFBFF]">
          <p className="flex items-center justify-center gap-1.5 text-center text-[12px] font-medium text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-brand" aria-hidden />
            Read-only app — data is approved by the school office.
          </p>
        </PhoneCard>
      </div>
    </div>
  );
}
