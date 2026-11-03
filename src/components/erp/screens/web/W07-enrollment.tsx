'use client';

import { useState } from 'react';
import { ArrowRightLeft, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { EmptyState, Field, PageHeader, PermissionState, Section, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { sectionLabel } from '@/lib/erp/derive';
import type { Enrollment } from '@/lib/erp/types';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';

interface HistRow {
  e: Enrollment;
  toLabel: string;
}

export default function W07Enrollment() {
  const data = useErp((s) => s.data);
  const params = useErp((s) => s.route.params);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const loading = useFakeLoad(350);

  const studentId = params.studentId ?? 'stu-ananya';
  const student = data.students.find((s) => s.id === studentId);

  const activeEnr = student ? data.enrollments.find((e) => e.studentId === student.id && e.ayId === ayId && e.status === 'active') : undefined;

  const [toSectionId, setToSectionId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(schoolDate);
  const [rollNo, setRollNo] = useState('');
  const [reason, setReason] = useState('');
  const [transferErrors, setTransferErrors] = useState<Record<string, string | undefined>>({});
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawDate, setWithdrawDate] = useState(schoolDate);

  if (!can(role, 'students', 'view')) return <PermissionState module="Students" />;

  const canUpdate = can(role, 'students', 'update');

  if (!student) {
    return (
      <div>
        <PageHeader />
        <EmptyState
          title="Student not found"
          description="Open a student profile first to see enrollment history."
          action={<Button className="rounded-control" onClick={() => nav('W03')}>Open directory</Button>}
        />
      </div>
    );
  }

  const all = data.enrollments
    .filter((e) => e.studentId === student.id)
    .sort((a, b) => a.start.localeCompare(b.start));
  const histRows: HistRow[] = all.map((e, i) => ({
    e,
    toLabel: i + 1 < all.length ? sectionLabel(data, all[i + 1].sectionId) : '—',
  }));
  const histDesc = [...histRows].reverse();

  const histColumns: Column<HistRow>[] = [
    { key: 'from', header: 'From section', render: (r) => <span className="font-semibold text-ink">{sectionLabel(data, r.e.sectionId)}</span>, sortValue: (r) => sectionLabel(data, r.e.sectionId) },
    { key: 'to', header: 'To section', render: (r) => r.toLabel },
    { key: 'date', header: 'Effective date', render: (r) => fmtDate(r.e.start), sortValue: (r) => r.e.start },
    { key: 'roll', header: 'Roll number', align: 'right', render: (r) => <span className="tabular-nums">{r.e.rollNo}</span>, sortValue: (r) => r.e.rollNo },
    { key: 'reason', header: 'Reason', render: (r) => r.e.reason ?? '—', hideBelow: 'md' },
    { key: 'status', header: 'Current status', render: (r) => <StatusChip status={r.e.status} />, sortValue: (r) => r.e.status },
  ];

  const otherSections = data.sections.filter((sec) => sec.status === 'active' && sec.id !== activeEnr?.sectionId);

  const submitTransfer = () => {
    const e: Record<string, string> = {};
    if (!activeEnr) e.from = 'No active enrollment to transfer from.';
    if (!toSectionId) e.toSectionId = 'To section is required.';
    if (!effectiveDate) e.effectiveDate = 'Effective date is required.';
    if (!rollNo || Number(rollNo) < 1) e.rollNo = 'Roll number must be at least 1.';
    if (!reason.trim()) e.reason = 'Reason is required.';
    setTransferErrors(e);
    if (Object.keys(e).length > 0 || !student || !toSectionId) return;
    openDialog('D09', {
      studentId: student.id,
      studentName: student.displayName,
      toSectionId,
      toLabel: sectionLabel(data, toSectionId),
      effectiveDate,
      rollNo: Number(rollNo),
    });
  };

  const submitWithdraw = () => {
    if (!student) return;
    openDialog('D10', {
      studentId: student.id,
      studentName: student.displayName,
      date: withdrawDate || schoolDate,
      reason: withdrawReason.trim() || 'Withdrawn from school',
    });
  };

  const resetTransferForm = () => {
    setToSectionId('');
    setEffectiveDate(schoolDate);
    setRollNo('');
    setReason('');
    setTransferErrors({});
  };

  return (
    <div>
      <PageHeader
        title={student.displayName}
        description={`${student.admNo} · GR ${student.grNo} · enrollment timeline, section transfer and withdrawal.`}
        status={<StatusChip status={student.status} />}
      />

      {loading ? (
        <SkeletonTable rows={4} cols={5} />
      ) : (
        <div className="space-y-5">
          <Section title="Enrollment history" description="Every dated enrollment, transfer and promotion for this student.">
            <DataTable
              rows={histDesc}
              columns={histColumns}
              rowKey={(r) => r.e.id}
              pageSize={5}
              emptyTitle="No enrollments recorded"
              emptyDescription="Admit the student or add an enrollment to build the history."
            />
          </Section>

          <div className="grid gap-5 lg:grid-cols-2">
            <Section title="Transfer student" description="Closes the current enrollment and opens a new one with a fresh roll number.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="From section">
                  <Input
                    value={activeEnr ? sectionLabel(data, activeEnr.sectionId) : 'No active enrollment'}
                    readOnly
                    disabled
                    className="rounded-control bg-muted text-muted-foreground"
                    aria-label="From section"
                  />
                  {transferErrors.from && <span className="text-[12px] font-medium text-danger">{transferErrors.from}</span>}
                </Field>
                <Field label="To section" required error={transferErrors.toSectionId}>
                  <Select
                    value={toSectionId}
                    disabled={!activeEnr}
                    onValueChange={(v) => {
                      setToSectionId(v);
                      setRollNo(String(data.enrollments.filter((en) => en.sectionId === v && en.ayId === ayId && en.status === 'active').length + 1));
                      setTransferErrors((x) => ({ ...x, toSectionId: undefined }));
                    }}
                  >
                    <SelectTrigger className="rounded-control" aria-label="To section"><SelectValue placeholder="Select section" /></SelectTrigger>
                    <SelectContent>
                      {otherSections.map((sec) => (
                        <SelectItem key={sec.id} value={sec.id}>{sectionLabel(data, sec.id)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Effective date" required error={transferErrors.effectiveDate}>
                  <Input type="date" value={effectiveDate} onChange={(e) => { setEffectiveDate(e.target.value); setTransferErrors((x) => ({ ...x, effectiveDate: undefined })); }} className="rounded-control bg-background" aria-label="Effective date" />
                </Field>
                <Field label="Roll number" required error={transferErrors.rollNo} hint="Defaults to the next free roll">
                  <Input type="number" min={1} value={rollNo} onChange={(e) => { setRollNo(e.target.value); setTransferErrors((x) => ({ ...x, rollNo: undefined })); }} className="rounded-control bg-background" aria-label="Roll number" />
                </Field>
                <Field label="Reason" required error={transferErrors.reason} className="sm:col-span-2">
                  <Textarea value={reason} onChange={(e) => { setReason(e.target.value); setTransferErrors((x) => ({ ...x, reason: undefined })); }} placeholder="e.g. Sibling alignment, section balance…" rows={2} className="rounded-control bg-background" aria-label="Reason" />
                </Field>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {canUpdate ? (
                  <Button className="rounded-control" disabled={!activeEnr} onClick={submitTransfer}>
                    <ArrowRightLeft className="h-4 w-4" aria-hidden /> Transfer student
                  </Button>
                ) : (
                  <p className="text-[12px] text-muted-foreground">Your role cannot transfer students.</p>
                )}
                <Button variant="ghost" className="rounded-control" onClick={resetTransferForm}>Cancel</Button>
              </div>
            </Section>

            <Section title="Withdraw student" description="Records are kept, the seat is released and the ledger becomes read-only.">
              <div className="grid gap-4">
                <Field label="Effective date" required>
                  <Input type="date" value={withdrawDate} onChange={(e) => setWithdrawDate(e.target.value)} className="rounded-control bg-background" aria-label="Withdrawal date" />
                </Field>
                <Field label="Reason" hint="Confirmed again in the next step">
                  <Textarea value={withdrawReason} onChange={(e) => setWithdrawReason(e.target.value)} placeholder="e.g. Family relocation to Nagpur" rows={2} className="rounded-control bg-background" aria-label="Withdrawal reason" />
                </Field>
              </div>
              <div className="mt-4">
                {canUpdate ? (
                  <Button className="rounded-control bg-danger text-white hover:bg-danger/90" onClick={submitWithdraw}>
                    <UserMinus className="h-4 w-4" aria-hidden /> Withdraw student
                  </Button>
                ) : (
                  <p className="text-[12px] text-muted-foreground">Your role cannot withdraw students.</p>
                )}
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
