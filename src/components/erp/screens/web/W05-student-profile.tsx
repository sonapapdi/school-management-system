'use client';

import { useMemo, useState } from 'react';
import { CalendarCheck, ReceiptText, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EmptyState, InfoRow, MarkChip, Money, PageHeader, PermissionState, Section, SkeletonCards, StatusChip, Timeline } from '@/components/erp/ui/primitives';
import type { TimelineItem } from '@/components/erp/ui/primitives';
import { attendanceSummary, duesFor, guardiansOf, receiptsFor, sectionLabel, studentMarkOn } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { addDays, fmtDate, fmtPct, useFakeLoad } from '@/lib/erp/utils';

const ENR_TONE = { active: 'info', transferred: 'warning', withdrawn: 'danger', promoted: 'success' } as const;

export default function W05StudentProfile() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);
  const updateStudent = useErp((s) => s.updateStudent);
  const loading = useFakeLoad(350);

  const studentId = params.studentId ?? 'stu-ananya';
  const student = data.students.find((s) => s.id === studentId);

  const [editing, setEditing] = useState(false);
  const [edit, setEdit] = useState({ firstName: '', middleName: '', lastName: '', dob: '', gender: 'Female' as 'Female' | 'Male' });
  const [editErrors, setEditErrors] = useState<Record<string, string | undefined>>({});

  /* ── Derived data ── */
  const guardians = useMemo(() => (student ? guardiansOf(data, student.id) : []), [data, student]);
  const enrollments = useMemo(
    () => (student ? data.enrollments.filter((e) => e.studentId === student.id).sort((a, b) => b.start.localeCompare(a.start)) : []),
    [data, student],
  );
  const activeEnr = enrollments.find((e) => e.status === 'active');
  const dues = useMemo(() => (student ? duesFor(data, student.id, schoolDate) : undefined), [data, student, schoolDate]);
  const receipts = useMemo(() => (student ? receiptsFor(data, student.id).slice(0, 3) : []), [data, student]);

  const last8Dates = useMemo(() => {
    const out: string[] = [];
    let d = schoolDate;
    let guard = 0;
    while (out.length < 8 && guard < 40) {
      const dow = new Date(d + 'T00:00:00').getDay();
      const holiday = data.holidays.some((h) => h.date === d && h.type === 'Holiday');
      if (dow !== 0 && dow !== 6 && !holiday) out.unshift(d);
      d = addDays(d, -1);
      guard += 1;
    }
    return out;
  }, [schoolDate, data.holidays]);

  const attendancePct = useMemo(() => {
    let present = 0;
    let marked = 0;
    for (const d of last8Dates) {
      const m = studentMarkOn(data, studentId, d);
      if (m && m.status !== 'unmarked') {
        marked += 1;
        if (m.status === 'P') present += 1;
      }
    }
    return marked ? (present / marked) * 100 : 0;
  }, [last8Dates, data, studentId]);

  const timeline: TimelineItem[] = useMemo(() => {
    if (!student) return [];
    const items: { item: TimelineItem; sortKey: string }[] = [];
    for (const e of enrollments) {
      items.push({
        item: {
          title: `Enrolled in ${sectionLabel(data, e.sectionId)}`,
          description: `Roll ${e.rollNo}${e.reason ? ` · ${e.reason}` : ''}`,
          time: fmtDate(e.start),
          tone: ENR_TONE[e.status],
        },
        sortKey: e.start,
      });
    }
    for (const a of data.audit) {
      const mentions = a.resourceId === student.id || a.action.toLowerCase().includes(student.displayName.toLowerCase());
      if (!mentions) continue;
      items.push({
        item: {
          title: a.action,
          description: `${a.resource} · ${a.resourceId}`,
          time: a.at.replace('T', ', '),
          actor: a.actor,
          tone: a.result === 'success' ? 'success' : a.result === 'denied' ? 'warning' : 'danger',
        },
        sortKey: a.at,
      });
    }
    return items.sort((x, y) => y.sortKey.localeCompare(x.sortKey)).map((x) => x.item);
  }, [data, enrollments, student]);

  if (!can(role, 'students', 'view')) return <PermissionState module="Students" />;

  if (!student) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          title="Student not found"
          description="This student may have been removed. Pick another student from the directory."
          action={<Button className="rounded-control" onClick={() => nav('W03')}>Open directory</Button>}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <PageHeader title={student.displayName} status={<StatusChip status={student.status} />} />
        <div className="grid gap-5 lg:grid-cols-2">
          <SkeletonCards count={2} />
          <SkeletonCards count={2} />
        </div>
      </div>
    );
  }

  const canUpdate = can(role, 'students', 'update');
  const canCollect = can(role, 'fees', 'create');
  const today = attendanceSummary(data, schoolDate);

  const startEdit = () => {
    setEdit({
      firstName: student.firstName,
      middleName: student.middleName ?? '',
      lastName: student.lastName,
      dob: student.dob,
      gender: student.gender,
    });
    setEditErrors({});
    setEditing(true);
  };

  const saveEdit = () => {
    const e: Record<string, string> = {};
    if (!edit.firstName.trim()) e.firstName = 'First name is required.';
    if (!edit.lastName.trim()) e.lastName = 'Last name is required.';
    setEditErrors(e);
    if (Object.keys(e).length > 0) return;
    updateStudent(student.id, {
      firstName: edit.firstName.trim(),
      middleName: edit.middleName.trim() || undefined,
      lastName: edit.lastName.trim(),
      dob: edit.dob,
      gender: edit.gender,
    });
    pushToast({ title: 'Profile updated', description: 'Identity changes were saved and audited.', variant: 'success' });
    setEditing(false);
  };

  return (
    <div>
      <PageHeader
        title={student.displayName}
        status={<StatusChip status={student.status} />}
        actions={
          <>
            {!editing && canUpdate && (
              <Button variant="outline" className="rounded-control" onClick={startEdit}>Edit profile</Button>
            )}
            <Button variant="outline" className="rounded-control" onClick={() => nav('W19', { studentId: student.id })}>View ledger</Button>
            {canUpdate && (
              <Button variant="outline" className="rounded-control" onClick={() => nav('W07', { studentId: student.id })}>Transfer</Button>
            )}
            {canUpdate && (
              <Button
                className="rounded-control bg-danger text-white hover:bg-danger/90"
                onClick={() => openDialog('D10', { studentId: student.id, studentName: student.displayName, date: schoolDate })}
              >
                Withdraw
              </Button>
            )}
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ── Left column ── */}
        <div className="space-y-5">
          <Section
            title="Identity"
            description={activeEnr ? `Currently in ${sectionLabel(data, activeEnr.sectionId)} · Roll ${activeEnr.rollNo}` : 'No active enrollment'}
            actions={
              editing ? (
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" className="rounded-control" onClick={() => { setEditing(false); setEditErrors({}); }}>Cancel</Button>
                  <Button size="sm" className="rounded-control" onClick={saveEdit}>Save</Button>
                </div>
              ) : undefined
            }
          >
            {editing ? (
              <div className="grid gap-3.5 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-soft">
                  First name*
                  <Input value={edit.firstName} onChange={(e) => { setEdit({ ...edit, firstName: e.target.value }); setEditErrors((x) => ({ ...x, firstName: undefined })); }} className="rounded-control bg-background" aria-label="First name" />
                  {editErrors.firstName && <span className="text-[12px] font-medium text-danger">{editErrors.firstName}</span>}
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-soft">
                  Middle name
                  <Input value={edit.middleName} onChange={(e) => setEdit({ ...edit, middleName: e.target.value })} className="rounded-control bg-background" aria-label="Middle name" />
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-soft">
                  Last name*
                  <Input value={edit.lastName} onChange={(e) => { setEdit({ ...edit, lastName: e.target.value }); setEditErrors((x) => ({ ...x, lastName: undefined })); }} className="rounded-control bg-background" aria-label="Last name" />
                  {editErrors.lastName && <span className="text-[12px] font-medium text-danger">{editErrors.lastName}</span>}
                </label>
                <label className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-soft">
                  Date of birth
                  <Input type="date" value={edit.dob} onChange={(e) => setEdit({ ...edit, dob: e.target.value })} className="rounded-control bg-background" aria-label="Date of birth" />
                </label>
                <div className="flex flex-col gap-1.5 text-[13px] font-semibold text-ink-soft">
                  Gender
                  <div className="flex w-fit rounded-control border border-line p-0.5" role="group" aria-label="Gender">
                    {(['Female', 'Male'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        aria-pressed={edit.gender === g}
                        onClick={() => setEdit({ ...edit, gender: g })}
                        className={`rounded-[9px] px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${edit.gender === g ? 'bg-brand text-white' : 'text-ink-soft hover:bg-muted'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="self-end text-[12px] text-muted-foreground">Display name is regenerated from first and last name on save.</p>
              </div>
            ) : (
              <div>
                <InfoRow label="Admission number" value={student.admNo} mono />
                <InfoRow label="GR number" value={student.grNo} mono />
                <InfoRow label="Date of birth" value={fmtDate(student.dob)} />
                <InfoRow label="Gender" value={student.gender} />
                <InfoRow label="Admission date" value={fmtDate(student.admissionDate)} />
                <InfoRow label="Display name" value={student.displayName} />
              </div>
            )}
          </Section>

          <Section
            title="Guardian summary"
            description={`${guardians.length} guardian${guardians.length === 1 ? '' : 's'} linked`}
            actions={
              <Button size="sm" variant="ghost" className="rounded-control text-brand-dark" onClick={() => nav('W06', { studentId: student.id })}>
                Manage guardians →
              </Button>
            }
          >
            <div className="space-y-2.5">
              {guardians.length === 0 && <p className="text-[13px] text-muted-foreground">No guardians recorded yet.</p>}
              {guardians.map((g) => (
                <div key={g.id} className="flex flex-wrap items-center justify-between gap-2 rounded-[10px] border border-line bg-[#FAFBFE] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ink">{g.name} <span className="font-medium text-muted-foreground">· {g.relationship}</span></p>
                    <p className="text-[12px] text-muted-foreground">{g.mobile}{g.email ? ` · ${g.email}` : ''}</p>
                  </div>
                  <StatusChip status={g.appAccess ? 'Active' : 'Inactive'} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Enrollment history" description="Dated enrollments, transfers and promotions">
            <div className="space-y-2.5">
              {enrollments.length === 0 && <p className="text-[13px] text-muted-foreground">No enrollments recorded.</p>}
              {enrollments.map((e) => (
                <div key={e.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-line/60 pb-2.5 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-ink">{sectionLabel(data, e.sectionId)} · Roll {e.rollNo}</p>
                    <p className="text-[12px] text-muted-foreground">
                      {fmtDate(e.start)} – {e.end ? fmtDate(e.end) : 'Present'}{e.reason ? ` · ${e.reason}` : ''}
                    </p>
                  </div>
                  <StatusChip status={e.status} />
                </div>
              ))}
            </div>
          </Section>

          <Section title="Timeline" description="Audit events and enrollment milestones">
            <Timeline items={timeline} />
          </Section>
        </div>

        {/* ── Right column ── */}
        <div className="space-y-5">
          <Section title="Attendance summary" description={`Last ${last8Dates.length} school days · ${ayId.replace('ay-', 'AY ')}`}>
            <div className="flex flex-wrap items-end gap-2.5">
              {last8Dates.map((d) => {
                const m = studentMarkOn(data, student.id, d);
                return (
                  <div key={d} className="flex flex-col items-center gap-1">
                    <span className="text-[10.5px] font-semibold text-muted-foreground">{d.slice(8)}/{d.slice(5, 7)}</span>
                    <MarkChip mark={m?.status ?? 'unmarked'} />
                  </div>
                );
              })}
            </div>
            <div className="mt-3.5 flex items-center justify-between rounded-[10px] bg-brand/10 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-dark"><CalendarCheck className="h-4 w-4" aria-hidden /> Present over last 8 days</span>
              <span className="font-heading text-[15px] font-bold tabular-nums text-brand-dark">{fmtPct(attendancePct)}</span>
            </div>
            <p className="mt-2 text-[12px] text-muted-foreground">
              School-wide today: {today.submitted}/{today.totalSections} registers submitted · {fmtPct(today.presentPct)} present.
            </p>
          </Section>

          <Section
            title="Outstanding balance"
            description={`As of ${fmtDate(schoolDate)}`}
            actions={
              canCollect && dues && dues.due > 0 ? (
                <Button size="sm" className="rounded-control" onClick={() => nav('W17', { studentId: student.id })}>
                  <Wallet className="h-4 w-4" aria-hidden /> Collect payment
                </Button>
              ) : undefined
            }
          >
            {dues ? (
              <div>
                <InfoRow label="Total charges" value={<Money value={dues.totalCharges} />} />
                <InfoRow label="Paid" value={<Money value={dues.paid} />} />
                <InfoRow label="Due" value={<Money value={dues.due} className={dues.due > 0 ? 'text-danger' : 'text-success'} />} />
                {dues.nextDueDate && (
                  <p className="mt-2 text-[12px] text-muted-foreground">
                    Next due: <Money value={dues.nextDueAmount} /> by {fmtDate(dues.nextDueDate)}.
                  </p>
                )}
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">No fee records for this student.</p>
            )}
          </Section>

          <Section
            title="Latest receipts"
            description="Most recent payments"
            actions={
              <Button size="sm" variant="ghost" className="rounded-control text-brand-dark" onClick={() => nav('W19', { studentId: student.id })}>
                <ReceiptText className="h-4 w-4" aria-hidden /> Full ledger
              </Button>
            }
          >
            <div className="space-y-2">
              {receipts.length === 0 && <p className="text-[13px] text-muted-foreground">No receipts issued yet.</p>}
              {receipts.map((rc) => (
                <button
                  key={rc.id}
                  type="button"
                  onClick={() => nav('W19', { studentId: student.id })}
                  className="flex w-full items-center justify-between gap-2 rounded-[10px] border border-line bg-[#FAFBFE] px-3 py-2.5 text-left transition-colors hover:border-brand/30"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-mono text-[12.5px] font-semibold text-ink">{rc.no}</span>
                    <span className="block text-[11.5px] text-muted-foreground">{fmtDate(rc.date)} · {rc.mode}</span>
                  </span>
                  <Money value={rc.amount} />
                </button>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
