'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Field, InfoRow, PageHeader, PermissionState, Section, Stepper } from '@/components/erp/ui/primitives';
import { activeEnrollmentOf, gradeLabel, rosterOf, sectionLabel } from '@/lib/erp/derive';
import type { StudentStatus } from '@/lib/erp/types';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { fmtDate } from '@/lib/erp/utils';

type Relationship = 'Father' | 'Mother' | 'Guardian';

interface AdmissionDraft {
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  gender: 'Female' | 'Male';
  admissionDate: string;
  studentStatus: StudentStatus;
  ayId: string;
  gradeId: string;
  sectionId: string;
  rollNo: number;
  enrollStart: string;
  guardianName: string;
  relationship: Relationship;
  guardianMobile: string;
  guardianEmail: string;
  address: string;
  language: string;
  communicationAllowed: boolean;
  appAccess: boolean;
}

const STEPS = ['Student identity', 'Academic placement', 'Guardian information', 'Review'];

export default function W04NewAdmission() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);
  const addStudent = useErp((s) => s.addStudent);

  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const initial: AdmissionDraft = useMemo(() => ({
    firstName: '',
    middleName: '',
    lastName: '',
    dob: '',
    gender: 'Female',
    admissionDate: schoolDate,
    studentStatus: 'active',
    ayId,
    gradeId: '',
    sectionId: '',
    rollNo: 0,
    enrollStart: schoolDate,
    guardianName: '',
    relationship: 'Father',
    guardianMobile: '',
    guardianEmail: '',
    address: '',
    language: 'English',
    communicationAllowed: true,
    appAccess: true,
  }), [schoolDate, ayId]);
  const [draft, setDraft] = useState<AdmissionDraft>(initial);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);

  if (!can(role, 'students', 'create')) return <PermissionState module="Students" action="create" />;

  const set = <K extends keyof AdmissionDraft>(key: K, value: AdmissionDraft[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setErrors((e) => { const next = { ...e }; delete next[key as string]; return next; });
  };

  const displayNamePreview = [draft.firstName, draft.middleName, draft.lastName].map((v) => v.trim()).filter(Boolean).join(' ');

  const onGradeChange = (gradeId: string) => {
    const firstSec = data.sections.find((sec) => sec.gradeId === gradeId && sec.status === 'active');
    setDraft((d) => ({
      ...d,
      gradeId,
      sectionId: firstSec?.id ?? '',
      rollNo: firstSec ? rosterOf(data, firstSec.id, d.ayId).length + 1 : 0,
    }));
    setErrors((e) => ({ ...e, gradeId: undefined, sectionId: undefined }));
  };

  const onSectionChange = (sectionId: string) => {
    setDraft((d) => ({ ...d, sectionId, rollNo: rosterOf(data, sectionId, d.ayId).length + 1 }));
    setErrors((e) => ({ ...e, sectionId: undefined }));
  };

  const validateStep = (i: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (i === 0) {
      if (!draft.firstName.trim()) e.firstName = 'First name is required.';
      if (!draft.lastName.trim()) e.lastName = 'Last name is required.';
      if (!draft.dob) e.dob = 'Date of birth is required.';
      if (!draft.admissionDate) e.admissionDate = 'Admission date is required.';
    }
    if (i === 1) {
      if (!draft.gradeId) e.gradeId = 'Grade is required.';
      if (!draft.sectionId) e.sectionId = 'Section is required.';
      if (!draft.enrollStart) e.enrollStart = 'Enrollment start date is required.';
    }
    if (i === 2) {
      if (!draft.guardianName.trim()) e.guardianName = 'Guardian name is required.';
      if (!/^\d{10}$/.test(draft.guardianMobile.trim())) e.guardianMobile = 'Primary mobile must be 10 digits.';
    }
    return e;
  };

  /* Duplicate check — runs when the Review step is shown (plain derivation, no hook) */
  const duplicate = (() => {
    if (step !== 3) return undefined;
    const first = draft.firstName.trim();
    const last = draft.lastName.trim();
    if (!first || !last) return undefined;
    const nameKey = `${first}${last}`.replace(/\s/g, '').toLowerCase();
    return data.students.find((s) =>
      s.displayName.toLowerCase() === `${first} ${last}`.toLowerCase() ||
      s.displayName.replace(/\s/g, '').toLowerCase() === nameKey ||
      (s.dob === draft.dob && s.lastName.toLowerCase() === last.toLowerCase()),
    );
  })();

  const duplicateLabel = (() => {
    if (!duplicate) return '';
    const enr = activeEnrollmentOf(data, duplicate.id, ayId)
      ?? [...data.enrollments.filter((e) => e.studentId === duplicate.id)].sort((a, b) => b.start.localeCompare(a.start))[0];
    return `${duplicate.admNo} — ${duplicate.displayName}${enr ? ` (${sectionLabel(data, enr.sectionId)})` : ''}`;
  })();

  const reviewAdmission = () => {
    for (let i = 0; i < 3; i++) {
      const e = validateStep(i);
      if (Object.keys(e).length > 0) {
        setStep(i);
        setErrors(e);
        return;
      }
    }
    setErrors({});
    setStep(3);
  };

  const admit = () => {
    const sec = data.sections.find((x) => x.id === draft.sectionId);
    openDialog('D08', {
      studentName: `${draft.firstName.trim()} ${draft.lastName.trim()}`.trim(),
      classNameLabel: `${gradeLabel(data, draft.gradeId)}-${sec?.name ?? ''}`,
      onConfirm: () => {
        const id = addStudent({
          firstName: draft.firstName.trim(),
          middleName: draft.middleName.trim() || undefined,
          lastName: draft.lastName.trim(),
          dob: draft.dob,
          gender: draft.gender,
          admissionDate: draft.admissionDate,
          ayId: draft.ayId,
          sectionId: draft.sectionId,
          rollNo: Number(draft.rollNo),
          guardianName: draft.guardianName.trim(),
          relationship: draft.relationship,
          guardianMobile: draft.guardianMobile.trim(),
          guardianEmail: draft.guardianEmail.trim() || undefined,
          communicationAllowed: draft.communicationAllowed,
          appAccess: draft.appAccess,
        });
        nav('W05', { studentId: id });
      },
    });
  };

  const cancel = () => {
    if (dirty) openDialog('D02', { discard: () => nav('W03') });
    else nav('W03');
  };

  const sectionsForGrade = data.sections.filter((sec) => sec.gradeId === draft.gradeId && sec.status === 'active');
  const ay = data.academicYears.find((a) => a.id === draft.ayId);

  return (
    <div>
      <PageHeader
        description="Capture the student, place them in a section, add the first guardian and review before admitting."
      />

      <div className="mb-4"><Stepper steps={STEPS} current={step} onStepClick={(i) => { setStep(i); setErrors({}); }} /></div>

      {/* Step 1 — Student identity */}
      {step === 0 && (
        <Section title="Student identity" description="Identity is locked after admission except for name corrections.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Admission number" hint="Auto-generated on admission">
              <Input value="Auto-generated on admission" readOnly disabled className="rounded-control bg-muted text-muted-foreground" aria-label="Admission number" />
            </Field>
            <Field label="First name" required error={errors.firstName}>
              <Input value={draft.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="e.g. Ananya" className="rounded-control bg-background" aria-label="First name" />
            </Field>
            <Field label="Middle name">
              <Input value={draft.middleName} onChange={(e) => set('middleName', e.target.value)} className="rounded-control bg-background" aria-label="Middle name" />
            </Field>
            <Field label="Last name" required error={errors.lastName}>
              <Input value={draft.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="e.g. Patil" className="rounded-control bg-background" aria-label="Last name" />
            </Field>
            <Field label="Display name" hint="Auto preview from first, middle and last name">
              <Input value={displayNamePreview || '—'} readOnly className="rounded-control bg-muted text-muted-foreground" aria-label="Display name preview" />
            </Field>
            <Field label="Date of birth" required error={errors.dob}>
              <Input type="date" value={draft.dob} onChange={(e) => set('dob', e.target.value)} className="rounded-control bg-background" aria-label="Date of birth" />
            </Field>
            <Field label="Gender" required>
              <div className="flex w-fit rounded-control border border-line p-0.5" role="group" aria-label="Gender">
                {(['Female', 'Male'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={draft.gender === g}
                    onClick={() => set('gender', g)}
                    className={`rounded-[9px] px-4 py-1.5 text-[13px] font-semibold transition-colors ${draft.gender === g ? 'bg-brand text-white' : 'text-ink-soft hover:bg-muted'}`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Admission date" required error={errors.admissionDate}>
              <Input type="date" value={draft.admissionDate} onChange={(e) => set('admissionDate', e.target.value)} className="rounded-control bg-background" aria-label="Admission date" />
            </Field>
            <Field label="Student status">
              <Select value={draft.studentStatus} onValueChange={(v) => set('studentStatus', v as StudentStatus)}>
                <SelectTrigger className="rounded-control" aria-label="Student status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </Section>
      )}

      {/* Step 2 — Academic placement */}
      {step === 1 && (
        <Section title="Academic placement" description="The section decides the register, roster and class teacher.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Academic year" required>
              <Select value={draft.ayId} onValueChange={(v) => set('ayId', v)}>
                <SelectTrigger className="rounded-control" aria-label="Academic year"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.academicYears.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}{a.status === 'active' ? ' — active' : ''}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Grade" required error={errors.gradeId}>
              <Select value={draft.gradeId} onValueChange={onGradeChange}>
                <SelectTrigger className="rounded-control" aria-label="Grade"><SelectValue placeholder="Select grade" /></SelectTrigger>
                <SelectContent>
                  {data.grades.filter((g) => g.status === 'active').map((g) => (
                    <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Section" required error={errors.sectionId}>
              <Select value={draft.sectionId} onValueChange={onSectionChange} disabled={!draft.gradeId}>
                <SelectTrigger className="rounded-control" aria-label="Section"><SelectValue placeholder={draft.gradeId ? 'Select section' : 'Pick a grade first'} /></SelectTrigger>
                <SelectContent>
                  {sectionsForGrade.map((sec) => (
                    <SelectItem key={sec.id} value={sec.id}>{sectionLabel(data, sec.id)} · {rosterOf(data, sec.id, draft.ayId).length}/{sec.capacity} seats filled</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Roll number" hint="Defaults to the next free roll in the section">
              <Input
                type="number"
                min={1}
                value={draft.rollNo || ''}
                onChange={(e) => set('rollNo', Number(e.target.value))}
                className="rounded-control bg-background"
                aria-label="Roll number"
              />
            </Field>
            <Field label="Enrollment start date" required error={errors.enrollStart}>
              <Input type="date" value={draft.enrollStart} onChange={(e) => set('enrollStart', e.target.value)} className="rounded-control bg-background" aria-label="Enrollment start date" />
            </Field>
          </div>
        </Section>
      )}

      {/* Step 3 — Guardian information */}
      {step === 2 && (
        <Section title="Guardian information" description="The first guardian is invited to the parent app after admission.">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Guardian full name" required error={errors.guardianName}>
              <Input value={draft.guardianName} onChange={(e) => set('guardianName', e.target.value)} placeholder="e.g. Rajesh Patil" className="rounded-control bg-background" aria-label="Guardian full name" />
            </Field>
            <Field label="Relationship" required>
              <Select value={draft.relationship} onValueChange={(v) => set('relationship', v as Relationship)}>
                <SelectTrigger className="rounded-control" aria-label="Relationship"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Primary mobile" required error={errors.guardianMobile} hint="10 digits, no country code">
              <Input
                value={draft.guardianMobile}
                onChange={(e) => set('guardianMobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
                inputMode="numeric"
                placeholder="e.g. 9822044321"
                className="rounded-control bg-background"
                aria-label="Primary mobile"
              />
            </Field>
            <Field label="Email">
              <Input type="email" value={draft.guardianEmail} onChange={(e) => set('guardianEmail', e.target.value)} className="rounded-control bg-background" aria-label="Email" />
            </Field>
            <Field label="Address">
              <Input value={draft.address} onChange={(e) => set('address', e.target.value)} className="rounded-control bg-background" aria-label="Address" />
            </Field>
            <Field label="Preferred language">
              <Select value={draft.language} onValueChange={(v) => set('language', v)}>
                <SelectTrigger className="rounded-control" aria-label="Preferred language"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="मराठी">मराठी</SelectItem>
                  <SelectItem value="हिंदी">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex items-center justify-between rounded-control border border-line bg-background px-3 py-2.5 sm:col-span-1">
              <span className="text-[13px] font-semibold text-ink-soft">Communication allowed</span>
              <Switch checked={draft.communicationAllowed} onCheckedChange={(v) => set('communicationAllowed', v)} aria-label="Communication allowed" />
            </div>
            <div className="flex items-center justify-between rounded-control border border-line bg-background px-3 py-2.5 sm:col-span-1">
              <span className="text-[13px] font-semibold text-ink-soft">Parent app access allowed</span>
              <Switch checked={draft.appAccess} onCheckedChange={(v) => set('appAccess', v)} aria-label="Parent app access allowed" />
            </div>
          </div>
        </Section>
      )}

      {/* Step 4 — Review */}
      {step === 3 && (
        <div className="space-y-4">
          {duplicate ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-amber/40 bg-amber-soft p-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber" aria-hidden />
                <div>
                  <p className="text-[13px] font-bold text-[#8a5a00]">A possible student match already exists. Review it before creating a new record.</p>
                  <p className="mt-0.5 text-[12.5px] font-semibold text-[#8a5a00]">{duplicateLabel}</p>
                </div>
              </div>
              <Button size="sm" variant="outline" className="rounded-control" onClick={() => openDialog('D07', { existing: duplicateLabel, onContinue: () => {} })}>
                Review duplicate
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-card border border-success/25 bg-success-soft p-3.5 text-[13px] font-semibold text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> No duplicate match found — safe to admit.
            </div>
          )}

          <Section title="Review admission" description="Check every value before confirming. Names and DOB cannot be edited casually later.">
            <div className="grid gap-x-8 sm:grid-cols-2">
              <div>
                <InfoRow label="Student name" value={displayNamePreview || '—'} />
                <InfoRow label="Date of birth" value={draft.dob ? fmtDate(draft.dob) : '—'} />
                <InfoRow label="Gender" value={draft.gender} />
                <InfoRow label="Admission date" value={draft.admissionDate ? fmtDate(draft.admissionDate) : '—'} />
                <InfoRow label="Student status" value={draft.studentStatus.charAt(0).toUpperCase() + draft.studentStatus.slice(1)} />
              </div>
              <div>
                <InfoRow label="Academic year" value={ay?.name ?? draft.ayId} />
                <InfoRow label="Grade & section" value={draft.sectionId ? sectionLabel(data, draft.sectionId) : '—'} />
                <InfoRow label="Roll number" value={draft.rollNo || '—'} />
                <InfoRow label="Enrollment start date" value={draft.enrollStart ? fmtDate(draft.enrollStart) : '—'} />
                <InfoRow label="Guardian" value={`${draft.guardianName || '—'} (${draft.relationship})`} />
                <InfoRow label="Primary mobile" value={draft.guardianMobile || '—'} mono />
                <InfoRow label="Communication allowed" value={draft.communicationAllowed ? 'Yes' : 'No'} />
                <InfoRow label="Parent app access" value={draft.appAccess ? 'Allowed' : 'Not allowed'} />
              </div>
            </div>
          </Section>
        </div>
      )}

      {/* Sticky footer */}
      <div className="sticky bottom-3 z-10 mt-5 flex flex-wrap items-center justify-between gap-2 rounded-card border border-line bg-card p-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="rounded-control" onClick={cancel}>Cancel</Button>
          <Button variant="outline" className="rounded-control" onClick={() => pushToast({ title: 'Draft saved on this device', description: 'Continue where you left off.', variant: 'info' })}>
            Save draft
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {step < 3 ? (
            <Button className="rounded-control" onClick={reviewAdmission}>Review admission</Button>
          ) : (
            <Button className="rounded-control" onClick={admit}>Admit student</Button>
          )}
        </div>
      </div>
    </div>
  );
}
