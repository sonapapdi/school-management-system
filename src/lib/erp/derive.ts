import type {
  AttendanceRegister, Charge, ErpData, MarkCode, Payment, Receipt, Role, ScreenId, Student,
} from './types';
import { daysBetween, fmtPct } from './utils';

/* ── Lookups ── */

export const getStudent = (d: ErpData, id: string): Student | undefined => d.students.find((s) => s.id === id);
export const getGrade = (d: ErpData, id: string): string => d.grades.find((g) => g.id === id)?.name ?? id;
export const getSection = (d: ErpData, id: string) => d.sections.find((s) => s.id === id);
export const getStaff = (d: ErpData, id: string | undefined) => (id ? d.staff.find((s) => s.id === id) : undefined);
export const getAy = (d: ErpData, id: string) => d.academicYears.find((a) => a.id === id);

export function sectionLabel(d: ErpData, sectionId: string): string {
  const sec = getSection(d, sectionId);
  if (!sec) return '—';
  return `${getGrade(d, sec.gradeId)}-${sec.name}`;
}

export function gradeLabel(d: ErpData, gradeId: string): string {
  return getGrade(d, gradeId);
}

export function studentName(d: ErpData, id: string): string {
  return getStudent(d, id)?.displayName ?? '—';
}

/** Active students in a section sorted by roll no (dated enrollment) */
export function rosterOf(d: ErpData, sectionId: string, ayId: string) {
  return d.enrollments
    .filter((e) => e.sectionId === sectionId && e.ayId === ayId && e.status === 'active')
    .map((e) => ({ enrollment: e, student: getStudent(d, e.studentId) }))
    .filter((x): x is { enrollment: typeof x.enrollment; student: Student } => !!x.student && x.student.status === 'active')
    .sort((a, b) => a.enrollment.rollNo - b.enrollment.rollNo);
}

export function activeEnrollmentOf(d: ErpData, studentId: string, ayId: string) {
  return d.enrollments.find((e) => e.studentId === studentId && e.ayId === ayId && e.status === 'active');
}

export function activeStudents(d: ErpData): Student[] {
  return d.students.filter((s) => s.status === 'active');
}

export function guardiansOf(d: ErpData, studentId: string) {
  return d.guardians.filter((g) => g.studentId === studentId);
}

/** Sections assigned to a staff member (dated) */
export function assignmentsOf(d: ErpData, staffId: string) {
  return d.assignments
    .filter((a) => a.staffId === staffId && a.sectionId)
    .sort((a, b) => a.start.localeCompare(b.start));
}

export function sectionsTaughtBy(d: ErpData, staffId: string) {
  return assignmentsOf(d, staffId)
    .map((a) => ({ assignment: a, section: getSection(d, a.sectionId!) }))
    .filter((x) => !!x.section);
}

/* ── Attendance ── */

export function registerFor(d: ErpData, date: string, sectionId: string): AttendanceRegister | undefined {
  return d.registers.find((r) => r.date === date && r.sectionId === sectionId);
}

export interface AttendanceSummary {
  totalSections: number;
  submitted: number;
  presentPct: number;
  present: number;
  marked: number;
  unmarkedSections: string[];
}

export function attendanceSummary(d: ErpData, date: string): AttendanceSummary {
  const regs = d.registers.filter((r) => r.date === date);
  const submitted = regs.filter((r) => r.status === 'submitted');
  let present = 0;
  let marked = 0;
  for (const r of submitted) {
    for (const m of Object.values(r.marks)) {
      marked += 1;
      if (m === 'P') present += 1;
    }
  }
  return {
    totalSections: d.sections.filter((s) => s.status === 'active').length || regs.length,
    submitted: submitted.length,
    presentPct: marked ? (present / marked) * 100 : 0,
    present,
    marked,
    unmarkedSections: regs.filter((r) => r.status !== 'submitted').map((r) => r.sectionId),
  };
}

export function studentMarkOn(d: ErpData, studentId: string, date: string): { status: MarkCode | 'unmarked'; reason?: string; submittedAt?: string } | undefined {
  const enr = d.enrollments.find((e) => e.studentId === studentId && e.status === 'active');
  if (!enr) return undefined;
  const reg = registerFor(d, date, enr.sectionId);
  if (!reg || reg.status === 'unmarked') return { status: 'unmarked' };
  const m = reg.marks[studentId];
  if (!m) return { status: 'unmarked' };
  return { status: m, reason: reg.reasons[studentId], submittedAt: reg.submittedAt };
}

/** Month grid for parent calendar */
export function monthMarks(d: ErpData, studentId: string, year: number, month: number): { date: string; status: MarkCode | 'unmarked' | 'no_school' }[] {
  const out: { date: string; status: MarkCode | 'unmarked' | 'no_school' }[] = [];
  const days = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= days; day++) {
    const date = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dow = new Date(date + 'T00:00:00').getDay();
    const holiday = d.holidays.some((h) => h.date === date && h.type === 'Holiday');
    if (dow === 0 || dow === 6 || holiday) {
      out.push({ date, status: 'no_school' });
      continue;
    }
    const m = studentMarkOn(d, studentId, date);
    out.push({ date, status: m?.status === undefined ? 'no_school' : m.status });
  }
  return out;
}

export function attendanceHistoryFor(d: ErpData, studentId: string, sectionId?: string): { date: string; status: MarkCode | 'unmarked'; submittedAt?: string }[] {
  const regs = d.registers
    .filter((r) => (sectionId ? r.sectionId === sectionId : true))
    .filter((r) => r.marks[studentId] !== undefined || r.status === 'submitted')
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);
  return regs.map((r) => ({ date: r.date, status: r.marks[studentId] ?? 'unmarked', submittedAt: r.submittedAt }));
}

/* ── Fees ── */

export function chargePaid(d: ErpData, chargeId: string): number {
  return d.payments
    .filter((p) => p.status !== 'reversed')
    .flatMap((p) => p.allocations)
    .filter((a) => a.chargeId === chargeId)
    .reduce((t, a) => t + a.amount, 0);
}

export function studentCharges(d: ErpData, studentId: string): Charge[] {
  return d.charges.filter((c) => c.studentId === studentId && c.status === 'posted');
}

export interface InstallmentView {
  chargeId: string;
  head: string;
  original: number;
  concession: number;
  paid: number;
  remaining: number;
  dueDate: string;
  status: 'paid' | 'partial' | 'unpaid';
}

export function studentInstallments(d: ErpData, studentId: string): InstallmentView[] {
  return studentCharges(d, studentId)
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((c) => {
      const paid = chargePaid(d, c.id);
      const concession = 0;
      const remaining = Math.max(0, c.amount - concession - paid);
      return {
        chargeId: c.id, head: c.head, original: c.amount, concession,
        paid, remaining, dueDate: c.dueDate,
        status: remaining === 0 ? 'paid' : paid > 0 ? 'partial' : 'unpaid',
      } as InstallmentView;
    });
}

export interface DuesSummary {
  totalCharges: number;
  paid: number;
  due: number;
  overdue: number;
  nextDueDate?: string;
  nextDueAmount: number;
}

export function duesFor(d: ErpData, studentId: string, asOf: string): DuesSummary {
  const inst = studentInstallments(d, studentId);
  const totalCharges = inst.reduce((t, i) => t + i.original, 0);
  const paid = inst.reduce((t, i) => t + i.paid + i.concession, 0);
  const due = inst.reduce((t, i) => t + i.remaining, 0);
  const overdue = inst.filter((i) => i.remaining > 0 && i.dueDate <= asOf).reduce((t, i) => t + i.remaining, 0);
  const next = inst.find((i) => i.remaining > 0);
  return { totalCharges, paid, due, overdue, nextDueDate: next?.dueDate, nextDueAmount: next?.remaining ?? 0 };
}

export function overdueTotal(d: ErpData, asOf: string): number {
  let total = 0;
  for (const c of d.charges) {
    if (c.status !== 'posted' || c.dueDate > asOf) continue;
    const st = getStudent(d, c.studentId);
    if (!st || st.status !== 'active') continue;
    const paid = chargePaid(d, c.id);
    if (paid < c.amount) total += c.amount - paid;
  }
  return total;
}

export function collectionsOn(d: ErpData, date: string): number {
  return d.payments.filter((p) => p.date === date && p.status === 'posted').reduce((t, p) => t + p.amount, 0);
}

export function collectionsByMode(d: ErpData, from: string, to: string) {
  const modes = ['Cash', 'UPI', 'Bank transfer', 'Cheque'];
  return modes.map((mode) => {
    const list = d.payments.filter((p) => p.date >= from && p.date <= to && p.mode === mode);
    const gross = list.reduce((t, p) => t + p.amount, 0);
    const reversal = list.filter((p) => p.status === 'reversed').reduce((t, p) => t + p.amount, 0);
    return { mode, count: list.length, gross, reversal, net: gross - reversal };
  });
}

export function receiptsFor(d: ErpData, studentId: string): Receipt[] {
  return d.receipts.filter((r) => r.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));
}

export interface LedgerRow {
  id: string;
  date: string;
  type: 'Charge' | 'Payment' | 'Reversal' | 'Adjustment';
  ref: string;
  debit: number;
  credit: number;
  balance: number;
  status: string;
}

export function ledgerFor(d: ErpData, studentId: string): LedgerRow[] {
  const rows: Omit<LedgerRow, 'balance'>[] = [];
  for (const c of studentCharges(d, studentId)) {
    rows.push({ id: c.id, date: c.date, type: 'Charge', ref: c.head, debit: c.amount, credit: 0, status: 'Posted' });
  }
  for (const p of d.payments.filter((p) => p.studentId === studentId)) {
    rows.push({
      id: p.id, date: p.date, type: p.status === 'reversed' ? 'Reversal' : 'Payment',
      ref: d.receipts.find((r) => r.paymentId === p.id)?.no ?? p.id,
      debit: 0, credit: p.status === 'reversed' ? 0 : p.amount,
      status: p.status === 'posted' ? 'Posted' : p.status === 'reversed' ? 'Reversed' : 'Reversal requested',
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date) || a.type.localeCompare(b.type));
  let bal = 0;
  return rows.map((r) => {
    bal += r.debit - r.credit;
    return { ...r, balance: bal };
  }).reverse();
}

export function nextReceiptNo(d: ErpData): string {
  const nums = d.receipts.map((r) => Number(r.no.split('/').pop())).filter((n) => !isNaN(n));
  return `RCPT/2026/${String(Math.max(0, ...nums) + 1).padStart(5, '0')}`;
}

/* ── Approvals ── */

export interface ApprovalItem {
  id: string;
  kind: 'attendance_correction' | 'fee_reversal' | 'fee_adjustment';
  title: string;
  requestedBy: string;
  date: string;
  requestedAt: string;
  amountOrStudent: string;
  ageDays: number;
  status: string;
  ref: string;
}

export function approvalQueue(d: ErpData, asOf: string): ApprovalItem[] {
  const items: ApprovalItem[] = [];
  for (const c of d.corrections.filter((c) => c.status === 'pending')) {
    items.push({
      id: c.id, kind: 'attendance_correction', title: `Attendance correction ${c.no}`,
      requestedBy: c.requestedBy, date: c.date, requestedAt: c.requestedAt,
      amountOrStudent: `${studentName(d, c.studentId)} — ${c.from} → ${c.to}`,
      ageDays: Math.max(0, daysBetween(c.requestedAt.slice(0, 10), asOf)),
      status: 'pending', ref: c.no,
    });
  }
  for (const f of d.feeRequests.filter((f) => f.status === 'pending')) {
    items.push({
      id: f.id, kind: f.type === 'reversal' ? 'fee_reversal' : 'fee_adjustment',
      title: f.type === 'reversal' ? 'Payment reversal' : 'Fee adjustment',
      requestedBy: f.requestedBy, date: f.requestedAt.slice(0, 10), requestedAt: f.requestedAt,
      amountOrStudent: `${studentName(d, f.studentId)} — ₹${f.amount.toLocaleString('en-IN')}`,
      ageDays: Math.max(0, daysBetween(f.requestedAt.slice(0, 10), asOf)),
      status: 'pending', ref: f.id,
    });
  }
  return items.sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
}

/* ── Operational alerts (W02) ── */

export interface OperationalAlert {
  id: string;
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  owner: string;
  age: string;
  status: string;
  action?: { label: string; screen: ScreenId; params?: Record<string, string> };
}

export function operationalAlerts(d: ErpData, date: string): OperationalAlert[] {
  const out: OperationalAlert[] = [];
  const sum = attendanceSummary(d, date);
  for (const secId of sum.unmarkedSections) {
    const sec = getSection(d, secId);
    const ct = getStaff(d, sec?.classTeacherId);
    out.push({
      id: `alert-reg-${secId}`, severity: 'high',
      title: 'Missing attendance register',
      detail: `${sectionLabel(d, secId)} has not submitted the register for ${date}.`,
      owner: ct?.name ?? 'Class teacher', age: 'Today', status: 'Open',
      action: { label: 'Open monitor', screen: 'W10' },
    });
  }
  for (const imp of d.imports.filter((i) => i.status === 'failed' || i.status === 'partial')) {
    out.push({
      id: `alert-imp-${imp.id}`, severity: imp.status === 'failed' ? 'high' : 'medium',
      title: imp.status === 'failed' ? 'Import failed' : 'Import partially accepted',
      detail: `${imp.fileName} — ${imp.rows.filter((r) => r.result === 'rejected').length} rejected rows need attention.`,
      owner: imp.uploadedBy, age: `${daysBetween(imp.uploadedAt.slice(0, 10), date)} days`, status: 'Open',
      action: { label: 'Open import', screen: 'W09', params: { importId: imp.id } },
    });
  }
  const pendingFee = d.feeRequests.filter((f) => f.status === 'pending').length;
  if (pendingFee > 0) {
    out.push({
      id: 'alert-fee-req', severity: 'medium',
      title: 'Fee variance pending review',
      detail: `${pendingFee} reversal/adjustment request${pendingFee > 1 ? 's' : ''} awaiting approval.`,
      owner: 'Principal', age: '1 day', status: 'Open',
      action: { label: 'Open approvals', screen: 'W38' },
    });
  }
  const pendCorr = d.corrections.filter((c) => c.status === 'pending').length;
  if (pendCorr > 0) {
    out.push({
      id: 'alert-corr', severity: 'medium',
      title: 'Pending attendance corrections',
      detail: `${pendCorr} correction request${pendCorr > 1 ? 's' : ''} awaiting approval.`,
      owner: 'Admin office', age: '1 day', status: 'Open',
      action: { label: 'Review corrections', screen: 'W12' },
    });
  }
  return out;
}

/* ── Notices ── */

export function noticesForRole(d: ErpData, role: Role, studentSectionId?: string) {
  const rel = d.notices
    .filter((n) => n.status === 'published' || n.status === 'expired')
    .filter((n) => {
      if (role === 'teacher') return n.audience === 'Everyone' || n.audience === 'All staff';
      if (role === 'parent') {
        if (n.audience === 'All parents') return true;
        if (n.audience === 'Everyone') return true;
        if (n.audience === 'Grade' && studentSectionId) return getSection(d, studentSectionId)?.gradeId === n.gradeId;
        if (n.audience === 'Section') return n.sectionId === studentSectionId;
        return false;
      }
      return true;
    })
    .sort((a, b) => b.publishDate.localeCompare(a.publishDate));
  return rel;
}

/* ── Payments helpers ── */

export function paymentForReceipt(d: ErpData, receiptId: string): Payment | undefined {
  const rc = d.receipts.find((r) => r.id === receiptId);
  return rc ? d.payments.find((p) => p.id === rc.paymentId) : undefined;
}

export function fmtPct1(n: number): string {
  return fmtPct(n);
}
