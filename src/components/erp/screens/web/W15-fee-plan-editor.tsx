'use client';

import { useState } from 'react';
import { Eye, Plus, Save, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Field, KpiCard, PageHeader, PermissionState, SkeletonCards } from '@/components/erp/ui/primitives';
import { addDays, fmtDate, uid, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { FeePlan } from '@/lib/erp/types';

type PlanStatus = 'draft' | 'active' | 'archived';

interface Draft {
  name: string;
  appliesTo: string;
  status: PlanStatus;
  partialAllowed: boolean;
  heads: { head: string; amount: number }[];
  installments: { id: string; name: string; amount: number; dueDate: string; sequence: number }[];
}

export default function W15FeePlanEditor() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const params = useErp((s) => s.route.params);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const upsertFeePlan = useErp((s) => s.upsertFeePlan);

  const plan: FeePlan | undefined = params.planId ? data.feePlans.find((p) => p.id === params.planId) : undefined;

  const [initialDraft] = useState<Draft>(() => plan
    ? {
      name: plan.name, appliesTo: plan.appliesTo, status: plan.status, partialAllowed: plan.partialAllowed,
      heads: plan.heads.map((h) => ({ ...h })),
      installments: [...plan.installments].sort((a, b) => a.sequence - b.sequence).map((i) => ({ ...i })),
    }
    : {
      name: '', appliesTo: 'all', status: 'draft', partialAllowed: true,
      heads: [{ head: 'Tuition fee', amount: 0 }],
      installments: [{ id: uid('inst'), name: 'Term 1', amount: 0, dueDate: addDays(schoolDate, 30), sequence: 1 }],
    });
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [showErrors, setShowErrors] = useState(false);

  const loading = useFakeLoad(350);

  if (!can(role, 'fees', 'create')) return <PermissionState module="Fees" />;

  const dirty = JSON.stringify(draft) !== JSON.stringify(initialDraft);
  const nameMissing = draft.name.trim() === '';
  const badInstallments = draft.installments.filter((i) => !(i.amount > 0));
  const headsTotal = draft.heads.reduce((t, h) => t + h.amount, 0);
  const instTotal = draft.installments.reduce((t, i) => t + i.amount, 0);

  const persist = (): string => {
    return upsertFeePlan({
      id: plan?.id,
      name: draft.name.trim() || 'Untitled plan',
      ayId: plan?.ayId ?? ayId,
      appliesTo: draft.appliesTo,
      heads: draft.heads
        .filter((h) => h.head.trim() !== '' || h.amount > 0)
        .map((h) => ({ head: h.head.trim(), amount: h.amount })),
      installments: draft.installments.map((i, idx) => ({
        id: i.id, name: i.name.trim() || `Installment ${idx + 1}`,
        amount: i.amount, dueDate: i.dueDate || schoolDate, sequence: idx + 1,
      })),
      partialAllowed: draft.partialAllowed,
      status: 'draft',
    });
  };

  const validate = (): boolean => {
    const ok = !nameMissing && badInstallments.length === 0;
    setShowErrors(!ok);
    return ok;
  };

  const saveDraft = () => {
    if (!validate()) return;
    persist();
    nav('W14');
  };

  const previewAssessment = () => {
    if (!validate()) return;
    const id = persist();
    nav('W16', { planId: id });
  };

  const cancel = () => {
    if (dirty) {
      openDialog('D02', { discard: () => useErp.getState().nav('W14') });
      return;
    }
    nav('W14');
  };

  return (
    <div>
      <PageHeader
        title={plan ? `Edit plan — ${plan.name}` : 'Create fee plan'}
        description="Heads, installments and due dates. Save as draft, then preview the assessment before posting charges."
        status={dirty ? undefined : <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">All changes saved</span>}
        actions={
          <>
            <Button variant="ghost" className="rounded-control" onClick={cancel}>
              <X className="h-4 w-4" aria-hidden /> Cancel
            </Button>
            <Button variant="outline" className="rounded-control" onClick={previewAssessment}>
              <Eye className="h-4 w-4" aria-hidden /> Preview assessment
            </Button>
            <Button className="rounded-control" onClick={saveDraft}>
              <Save className="h-4 w-4" aria-hidden /> Save draft
            </Button>
          </>
        }
      />

      {loading ? (
        <SkeletonCards count={3} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
              <h2 className="mb-3 font-heading text-[15px] font-bold text-ink">Plan details</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Plan name" required error={showErrors && nameMissing ? 'Plan name is required.' : undefined} className="sm:col-span-2">
                  <Input
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    placeholder="e.g. Annual Fee Plan 2027-28"
                    className="rounded-control bg-background"
                    aria-label="Plan name"
                  />
                </Field>
                <Field label="Grade or section">
                  <Select value={draft.appliesTo} onValueChange={(v) => setDraft((d) => ({ ...d, appliesTo: v }))}>
                    <SelectTrigger className="rounded-control bg-background" aria-label="Grade or section"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All grades</SelectItem>
                      {data.grades.filter((g) => g.status === 'active').map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Status" hint="Saving always stores a draft; plans go live after review.">
                  <Select value={draft.status} onValueChange={(v) => setDraft((d) => ({ ...d, status: v as PlanStatus }))}>
                    <SelectTrigger className="rounded-control bg-background" aria-label="Status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Partial payment allowed" className="sm:col-span-2">
                  <div className="flex h-9 items-center gap-2">
                    <Switch
                      checked={draft.partialAllowed}
                      onCheckedChange={(v) => setDraft((d) => ({ ...d, partialAllowed: v }))}
                      aria-label="Partial payment allowed"
                    />
                    <span className="text-[13px] text-muted-foreground">
                      {draft.partialAllowed ? 'Students may pay part of an installment at the collection desk.' : 'Installments must be paid in full.'}
                    </span>
                  </div>
                </Field>
              </div>
            </Card>

            <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-[15px] font-bold text-ink">Fee heads</h2>
                <p className="text-[13px] text-muted-foreground">Annual total <span className="font-semibold text-ink">₹{headsTotal.toLocaleString('en-IN')}</span></p>
              </div>
              <div className="space-y-2">
                {draft.heads.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Input
                      value={h.head}
                      onChange={(e) => setDraft((d) => ({ ...d, heads: d.heads.map((x, i) => (i === idx ? { ...x, head: e.target.value } : x)) }))}
                      placeholder="Head name" className="rounded-control bg-background" aria-label={`Fee head ${idx + 1} name`}
                    />
                    <Input
                      type="number" min={0} value={h.amount}
                      onChange={(e) => setDraft((d) => ({ ...d, heads: d.heads.map((x, i) => (i === idx ? { ...x, amount: Number(e.target.value) || 0 } : x)) }))}
                      className="w-36 rounded-control bg-background text-right" aria-label={`Fee head ${idx + 1} amount`}
                    />
                    <Button
                      variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-danger"
                      onClick={() => setDraft((d) => ({ ...d, heads: d.heads.filter((_, i) => i !== idx) }))}
                      aria-label={`Remove fee head ${idx + 1}`}
                    >
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline" size="sm" className="mt-3 rounded-control"
                onClick={() => setDraft((d) => ({ ...d, heads: [...d.heads, { head: '', amount: 0 }] }))}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add fee head
              </Button>
            </Card>

            <Card className="rounded-card border border-line bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-heading text-[15px] font-bold text-ink">Installments</h2>
                <p className="text-[13px] text-muted-foreground">Billed total <span className="font-semibold text-ink">₹{instTotal.toLocaleString('en-IN')}</span></p>
              </div>
              <div className="space-y-3">
                {draft.installments.map((inst, idx) => (
                  <div key={inst.id} className="rounded-[10px] border border-line bg-page/60 p-3">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand-dark">{idx + 1}</span>
                      <Input
                        value={inst.name}
                        onChange={(e) => setDraft((d) => ({ ...d, installments: d.installments.map((x, i) => (i === idx ? { ...x, name: e.target.value } : x)) }))}
                        placeholder="Installment name" className="rounded-control bg-background" aria-label={`Installment ${idx + 1} name`}
                      />
                      <Input
                        type="number" min={0} value={inst.amount}
                        onChange={(e) => setDraft((d) => ({ ...d, installments: d.installments.map((x, i) => (i === idx ? { ...x, amount: Number(e.target.value) || 0 } : x)) }))}
                        className="w-36 rounded-control bg-background text-right" aria-label={`Installment ${idx + 1} amount`}
                      />
                      <input
                        type="date" value={inst.dueDate}
                        onChange={(e) => setDraft((d) => ({ ...d, installments: d.installments.map((x, i) => (i === idx ? { ...x, dueDate: e.target.value } : x)) }))}
                        className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px]"
                        aria-label={`Installment ${idx + 1} due date`}
                      />
                      <Button
                        variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-danger"
                        onClick={() => setDraft((d) => ({ ...d, installments: d.installments.filter((_, i) => i !== idx) }))}
                        aria-label={`Remove installment ${idx + 1}`}
                      >
                        <Trash2 className="h-4 w-4" aria-hidden />
                      </Button>
                    </div>
                    <p className="mt-1.5 text-[11.5px] text-muted-foreground">
                      Sequence {idx + 1} · Due {inst.dueDate ? fmtDate(inst.dueDate) : 'not set'}
                    </p>
                    {showErrors && !(inst.amount > 0) && (
                      <p className="mt-1 text-[12px] font-medium text-danger">Amount must be greater than ₹0.00.</p>
                    )}
                  </div>
                ))}
              </div>
              <Button
                variant="outline" size="sm" className="mt-3 rounded-control"
                onClick={() => setDraft((d) => ({
                  ...d,
                  installments: [...d.installments, { id: uid('inst'), name: `Term ${d.installments.length + 1}`, amount: 0, dueDate: addDays(schoolDate, 30 * (d.installments.length + 1)), sequence: d.installments.length + 1 }],
                }))}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden /> Add installment
              </Button>
            </Card>
          </div>

          <div className="space-y-3">
            <KpiCard label="Fee heads" value={draft.heads.length} sub={`Annual total ₹${headsTotal.toLocaleString('en-IN')}`} />
            <KpiCard label="Installments" value={draft.installments.length} sub={`Billed across the year: ₹${instTotal.toLocaleString('en-IN')}`} tone="primary" />
            <KpiCard
              label="Validation" value={nameMissing || badInstallments.length > 0 ? 'Needs attention' : 'Ready to save'}
              sub={nameMissing ? 'Plan name is required.' : badInstallments.length > 0 ? `${badInstallments.length} installment amount(s) must be greater than ₹0.00.` : 'All checks passed.'}
              tone={nameMissing || badInstallments.length > 0 ? 'warning' : 'success'}
            />
            <p className="px-1 text-[12px] text-muted-foreground">
              Preview assessment saves this draft and opens the per-student assessment with these installments.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
