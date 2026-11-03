'use client';

import { useMemo, useState } from 'react';
import { Download, Send, UserX, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import { EmptyState, InfoRow, Money, PageHeader, PermissionState, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { activeEnrollmentOf, activeStudents, getSection, gradeLabel, sectionLabel } from '@/lib/erp/derive';
import { downloadCsv, fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { FeePlan, Student } from '@/lib/erp/types';

interface PreviewRow {
  studentId: string;
  name: string;
  admNo: string;
  active: boolean;
  missingNames: string;
  amount: number;
  existing: number;
  missingCount: number;
  excluded: boolean;
}

export default function W16Assessment() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);

  const [grade, setGrade] = useState('all');
  const [section, setSection] = useState('all');
  const [selected, setSelected] = useState<Set<string>>(() => new Set(data.students.filter((s) => s.status === 'active').map((s) => s.id)));
  const [excluded, setExcluded] = useState<Set<string>>(() => new Set());

  const loading = useFakeLoad(350);

  const chargeIndex = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const c of data.charges) {
      if (c.status !== 'posted' || !c.installmentId) continue;
      let set = m.get(c.studentId);
      if (!set) { set = new Set<string>(); m.set(c.studentId, set); }
      set.add(c.installmentId);
    }
    return m;
  }, [data.charges]);

  if (!can(role, 'fees', 'create')) return <PermissionState module="Fees" />;

  const plan: FeePlan | undefined = data.feePlans.find((p) => p.id === (params.planId ?? 'plan-2026'));

  if (loading) {
    return (
      <div>
        <PageHeader description="Per-student preview before posting charges." />
        <SkeletonTable rows={8} cols={6} />
      </div>
    );
  }

  if (!plan) {
    return (
      <div>
        <PageHeader description="Per-student preview before posting charges." />
        <EmptyState
          title="Plan not found"
          description="The fee plan you are assessing no longer exists. Pick another plan from the list."
          action={<Button variant="outline" className="rounded-control" onClick={() => nav('W14')}>Back to fee plans</Button>}
        />
      </div>
    );
  }

  const planInsts = [...plan.installments].sort((a, b) => a.sequence - b.sequence);
  const sectionOptions = data.sections.filter((sec) => sec.status === 'active' && (grade === 'all' || sec.gradeId === grade));
  const filtered: Student[] = activeStudents(data)
    .filter((s) => {
      const secId = activeEnrollmentOf(data, s.id, ayId)?.sectionId;
      if (grade !== 'all') {
        const sec = getSection(data, secId ?? '');
        if (!sec || sec.gradeId !== grade) return false;
      }
      if (section !== 'all' && secId !== section) return false;
      return true;
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const previewRows: PreviewRow[] = filtered
    .filter((s) => selected.has(s.id))
    .map((s) => {
      const posted = chargeIndex.get(s.id) ?? new Set<string>();
      const missing = planInsts.filter((i) => !posted.has(i.id));
      return {
        studentId: s.id, name: s.displayName, admNo: s.admNo, active: s.status === 'active',
        missingNames: missing.map((i) => i.name).join(' · '),
        amount: missing.reduce((t, i) => t + i.amount, 0),
        existing: planInsts.filter((i) => posted.has(i.id)).length,
        missingCount: missing.length,
        excluded: excluded.has(s.id),
      };
    });

  const readyToPost = previewRows.filter((r) => !r.excluded && r.missingCount > 0);
  const allSelected = filtered.length > 0 && filtered.every((s) => selected.has(s.id));

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) filtered.forEach((s) => next.delete(s.id));
      else filtered.forEach((s) => next.add(s.id));
      return next;
    });
  };

  const toggleExclude = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const downloadPreview = () => {
    downloadCsv(
      `assessment-preview-${plan.id}.csv`,
      ['Student', 'Admission no', 'Enrollment status', 'Missing installments', 'Amount', 'Existing charges', 'Result'],
      previewRows.map((r) => [
        r.name, r.admNo, r.active ? 'Active' : 'Inactive', r.missingNames || '—',
        String(r.amount), String(r.existing), r.missingCount > 0 ? 'Ready to commit' : 'Committed',
      ]),
    );
  };

  const postCharges = () => {
    if (readyToPost.length === 0) return;
    openDialog('D18', {
      planId: plan.id, planName: plan.name,
      count: readyToPost.length,
      studentIds: readyToPost.map((r) => r.studentId),
    });
  };

  return (
    <div>
      <PageHeader
        description={`Preview ${plan.name} charges per student, then post. Students who already have a charge are skipped.`}
        actions={
          <>
            <Button variant="outline" className="rounded-control" onClick={downloadPreview}>
              <Download className="h-4 w-4" aria-hidden /> Download preview
            </Button>
            <Button className="rounded-control" disabled={readyToPost.length === 0} onClick={postCharges}>
              <Send className="h-4 w-4" aria-hidden /> Post charges
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5">
          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <h2 className="font-heading text-[15px] font-bold text-ink">{plan.name}</h2>
            <p className="mt-0.5 text-[12px] text-muted-foreground">
              {plan.appliesTo === 'all' ? 'All grades' : gradeLabel(data, plan.appliesTo)} · <StatusChip status={plan.status} />
            </p>
            <div className="mt-3">
              {planInsts.map((i) => (
                <InfoRow key={i.id} label={`${i.name} (due ${fmtDate(i.dueDate)})`} value={<Money value={i.amount} />} mono />
              ))}
              {planInsts.length === 0 && <p className="text-[13px] text-muted-foreground">No installments defined yet.</p>}
            </div>
          </Card>

          <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
            <h2 className="font-heading text-[15px] font-bold text-ink">Students</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Select value={grade} onValueChange={(v) => { setGrade(v); setSection('all'); }}>
                <SelectTrigger className="rounded-control bg-background" aria-label="Grade filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All grades</SelectItem>
                  {data.grades.filter((g) => g.status === 'active').map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={section} onValueChange={setSection}>
                <SelectTrigger className="rounded-control bg-background" aria-label="Section filter"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All sections</SelectItem>
                  {sectionOptions.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>{sectionLabel(data, sec.id)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="mt-3 flex items-center gap-2 rounded-[10px] bg-muted px-2.5 py-2">
              <Checkbox
                checked={allSelected}
                onCheckedChange={() => toggleAll()}
                aria-label="Select all students"
              />
              <span className="text-[13px] font-semibold text-ink">
                Select all ({filtered.length} student{filtered.length === 1 ? '' : 's'})
              </span>
            </label>
            <div className="erp-scroll mt-2 max-h-72 space-y-0.5 overflow-y-auto pr-1">
              {filtered.map((s) => (
                <label key={s.id} className="flex items-center gap-2 rounded-[8px] px-2 py-1.5 hover:bg-muted">
                  <Checkbox
                    checked={selected.has(s.id)}
                    onCheckedChange={() => toggleStudent(s.id)}
                    aria-label={`Select ${s.displayName}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-[13px] text-ink-soft">{s.displayName}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {sectionLabel(data, activeEnrollmentOf(data, s.id, ayId)?.sectionId ?? '')}
                  </span>
                </label>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-[13px] text-muted-foreground">No students match the filters.</p>
              )}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <DataTable<PreviewRow>
            rows={previewRows}
            rowKey={(r) => r.studentId}
            searchable={(r) => `${r.name} ${r.admNo}`}
            searchPlaceholder="Search preview…"
            emptyTitle="No students selected"
            emptyDescription="Pick students on the left to build the assessment."
            columns={[
              {
                key: 'student', header: 'Student',
                render: (r) => (
                  <div className={r.excluded ? 'opacity-50' : undefined}>
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-[11.5px] text-muted-foreground">{r.admNo}</p>
                  </div>
                ),
                sortValue: (r) => r.name,
              },
              { key: 'enr', header: 'Enrollment status', render: (r) => <StatusChip status={r.active ? 'Active' : 'Inactive'} /> },
              { key: 'inst', header: 'Installment', render: (r) => (r.missingNames || '—'), sortValue: (r) => r.missingNames },
              { key: 'amount', header: 'Amount', align: 'right', render: (r) => <Money value={r.amount} className={r.excluded ? 'opacity-50' : undefined} />, sortValue: (r) => r.amount },
              { key: 'existing', header: 'Existing charge', align: 'right', render: (r) => r.existing, sortValue: (r) => r.existing },
              {
                key: 'result', header: 'Result',
                render: (r) => (
                  <div className={r.excluded ? 'opacity-50' : undefined}>
                    <StatusChip status={r.missingCount > 0 ? 'Ready to commit' : 'Committed'} />
                  </div>
                ),
                sortValue: (r) => r.missingCount,
              },
              {
                key: 'actions', header: '', align: 'right',
                render: (r) => (
                  <Button
                    size="sm" variant="ghost" className="rounded-control"
                    onClick={() => toggleExclude(r.studentId)}
                  >
                    {r.excluded
                      ? (<><UserCheck className="h-3.5 w-3.5" aria-hidden /> Include row</>)
                      : (<><UserX className="h-3.5 w-3.5" aria-hidden /> Exclude row</>)}
                  </Button>
                ),
              },
            ]}
          />
        </div>
      </div>
    </div>
  );
}
