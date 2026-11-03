import type { ComponentType } from 'react';

/* ────────────────────────────── Roles & permissions ────────────────────────────── */

export type Role =
  | 'platform_operator'
  | 'school_admin'
  | 'principal'
  | 'receptionist'
  | 'accountant'
  | 'teacher'
  | 'parent';

export type PermAction = 'view' | 'create' | 'update' | 'approve' | 'export';

export type ModuleKey =
  | 'dashboard'
  | 'students'
  | 'attendance'
  | 'fees'
  | 'staff'
  | 'academics'
  | 'notices'
  | 'reports'
  | 'approvals'
  | 'settings';

/* ────────────────────────────── Screens & routing ────────────────────────────── */

export type AppKind = 'auth' | 'web' | 'teacher' | 'parent';

export type ScreenId =
  | 'A01' | 'A02' | 'A03' | 'A04'
  | 'W01' | 'W02' | 'W03' | 'W04' | 'W05' | 'W06' | 'W07' | 'W08' | 'W09'
  | 'W10' | 'W11' | 'W12' | 'W13'
  | 'W14' | 'W15' | 'W16' | 'W17' | 'W18' | 'W19' | 'W20' | 'W21'
  | 'W22' | 'W23' | 'W24' | 'W25'
  | 'W26' | 'W27' | 'W28' | 'W29' | 'W30'
  | 'W31' | 'W32' | 'W33'
  | 'W34' | 'W35' | 'W36' | 'W37'
  | 'W38' | 'W39'
  | 'W40' | 'W41' | 'W42' | 'W43' | 'W44'
  | 'T01' | 'T02' | 'T03' | 'T04' | 'T05' | 'T06' | 'T07' | 'T08' | 'T09' | 'T10' | 'T11' | 'T12' | 'T13'
  | 'P01' | 'P02' | 'P03' | 'P04' | 'P05' | 'P06' | 'P07' | 'P08' | 'P09' | 'P10' | 'P11' | 'P12';

export type ScreenComponent = ComponentType;

export interface RouteDef {
  id: ScreenId;
  path: string;
  title: string;
  app: AppKind;
  /** sidebar module tab (web) */
  tab?: string;
  /** phone bottom-nav index (0-4) */
  phoneTab?: number;
  roles: Role[];
  desc: string;
}

export type DialogId =
  | 'D01' | 'D02' | 'D03' | 'D04' | 'D05' | 'D06' | 'D07' | 'D08'
  | 'D09' | 'D10' | 'D11' | 'D12' | 'D13' | 'D14' | 'D15' | 'D16'
  | 'D17' | 'D18' | 'D19' | 'D20' | 'D21' | 'D22' | 'D23' | 'D24'
  | 'D25' | 'D26' | 'D27' | 'D28';

/* ────────────────────────────── Setup entities ────────────────────────────── */

export interface AcademicYear {
  id: string;
  name: string;
  start: string;
  end: string;
  status: 'active' | 'upcoming' | 'closed';
}

export interface Campus {
  id: string;
  name: string;
}

export interface Grade {
  id: string;
  name: string;
  order: number;
  status: 'active' | 'archived';
}

export interface Section {
  id: string;
  ayId: string;
  gradeId: string;
  name: string;
  capacity: number;
  classTeacherId?: string;
  status: 'active' | 'archived';
}

/* ────────────────────────────── People ────────────────────────────── */

export type StudentStatus = 'active' | 'inactive' | 'withdrawn' | 'archived';

export interface Student {
  id: string;
  admNo: string;
  grNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  dob: string;
  gender: 'Female' | 'Male';
  admissionDate: string;
  status: StudentStatus;
}

export interface Guardian {
  id: string;
  studentId: string;
  name: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  mobile: string;
  email?: string;
  communicationAllowed: boolean;
  appAccess: boolean;
  appAccessEnd?: string;
  verified: boolean;
  invitedAt?: string;
}

export interface Enrollment {
  id: string;
  studentId: string;
  ayId: string;
  sectionId: string;
  rollNo: number;
  start: string;
  end?: string;
  status: 'active' | 'transferred' | 'withdrawn' | 'promoted';
  reason?: string;
}

export type StaffRole =
  | 'Principal'
  | 'Admin Officer'
  | 'Accountant'
  | 'Receptionist'
  | 'Class Teacher'
  | 'Subject Teacher'
  | 'Coordinator';

export interface StaffMember {
  id: string;
  code: string;
  name: string;
  role: StaffRole;
  mobile: string;
  email: string;
  startDate: string;
  status: 'active' | 'inactive';
  lastSignIn?: string;
}

export interface StaffAssignment {
  id: string;
  staffId: string;
  ayId: string;
  gradeId?: string;
  sectionId?: string;
  type: 'Class Teacher' | 'Subject Teacher' | 'Substitute';
  start: string;
  end?: string;
}

/* ────────────────────────────── Attendance ────────────────────────────── */

export type MarkCode = 'P' | 'A' | 'L';

export interface AttendanceRegister {
  id: string;
  date: string;
  sectionId: string;
  /** P/A/L per studentId */
  marks: Record<string, MarkCode>;
  reasons: Record<string, string>;
  status: 'unmarked' | 'draft' | 'submitted';
  submittedAt?: string;
  submittedBy?: string;
  revision: number;
}

export interface CorrectionRequest {
  id: string;
  no: string;
  date: string;
  sectionId: string;
  studentId: string;
  from: MarkCode;
  to: MarkCode;
  reason: string;
  note?: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  resolvedAt?: string;
  resolutionNote?: string;
}

/* ────────────────────────────── Fees ────────────────────────────── */

export interface FeePlan {
  id: string;
  name: string;
  ayId: string;
  appliesTo: string; // 'all' | gradeId
  heads: { head: string; amount: number }[];
  installments: { id: string; name: string; amount: number; dueDate: string; sequence: number }[];
  partialAllowed: boolean;
  status: 'draft' | 'active' | 'archived';
}

export interface Charge {
  id: string;
  studentId: string;
  ayId: string;
  planId?: string;
  installmentId?: string;
  head: string;
  amount: number;
  date: string;
  dueDate: string;
  status: 'posted' | 'reversed';
}

export type PaymentMode = 'Cash' | 'UPI' | 'Bank transfer' | 'Cheque';

export interface Payment {
  id: string;
  studentId: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  reference?: string;
  notes?: string;
  collectedBy: string;
  allocations: { chargeId: string; amount: number }[];
  status: 'posted' | 'reversal_requested' | 'reversed';
}

export interface Receipt {
  id: string;
  no: string;
  paymentId: string;
  studentId: string;
  date: string;
  amount: number;
  mode: PaymentMode;
  collectedBy: string;
}

export interface FeeRequest {
  id: string;
  type: 'reversal' | 'adjustment';
  paymentId?: string;
  chargeId?: string;
  studentId: string;
  originalRef: string;
  amount: number;
  reason: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewer?: string;
  resolvedAt?: string;
}

export interface DayClose {
  id: string;
  date: string;
  cashExpected: number;
  cashCounted: number;
  upiVerified: number;
  bankVerified: number;
  variance: number;
  explanation?: string;
  reviewer?: string;
  status: 'draft' | 'submitted' | 'closed';
}

/* ────────────────────────────── Imports ────────────────────────────── */

export interface ImportRow {
  n: number;
  values: Record<string, string>;
  result: 'accepted' | 'conflict' | 'rejected';
  match?: string;
  error?: string;
}

export interface ImportBatch {
  id: string;
  type: 'Students' | 'Guardians';
  ayId: string;
  fileName: string;
  headerRow: boolean;
  duplicateStrategy: 'skip' | 'update';
  uploadedAt: string;
  uploadedBy: string;
  status: 'uploaded' | 'validating' | 'ready' | 'partial' | 'committed' | 'failed';
  rows: ImportRow[];
}

/* ────────────────────────────── Notices ────────────────────────────── */

export type NoticeAudience = 'Everyone' | 'All parents' | 'All staff' | 'Grade' | 'Section';

export interface Notice {
  id: string;
  title: string;
  message: string;
  audience: NoticeAudience;
  gradeId?: string;
  sectionId?: string;
  publishDate: string;
  expiryDate: string;
  status: 'draft' | 'scheduled' | 'published' | 'expired';
  author: string;
  attachment?: string;
  createdAt: string;
  publishedAt?: string;
}

/* ────────────────────────────── Ops ────────────────────────────── */

export interface AuditEvent {
  id: string;
  at: string;
  actor: string;
  role: Role | 'System';
  action: string;
  resource: string;
  resourceId: string;
  result: 'success' | 'denied' | 'failed';
}

export interface ExportJob {
  id: string;
  type: string;
  requestedBy: string;
  requestedAt: string;
  status: 'queued' | 'running' | 'ready' | 'expired';
  expiresAt: string;
  rows?: string[][];
  columns?: string[];
}

export interface OfficeTask {
  id: string;
  from: string;
  studentId: string;
  note: string;
  at: string;
  status: 'open' | 'resolved';
}

export interface Holiday {
  id: string;
  date: string;
  type: 'Holiday' | 'Teaching day';
  name: string;
  appliesTo: string;
}

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'error' | 'info' | 'warning';
}

/* ────────────────────────────── Theme & settings ────────────────────────────── */

export interface ThemeConfig {
  productName: string;
  logoLetter: string;
  schoolName: string;
  campusName: string;
  primary: string;
  primaryDark: string;
  secondary: string;
  cardRadius: number;
}

export interface SchoolSettings {
  timezone: string;
  phone: string;
  email: string;
  address: string;
  receiptPrefix: string;
  importRetentionMonths: number;
  exportRetentionDays: number;
  lastBackupTest: string;
}

/* ────────────────────────────── Root data shape ────────────────────────────── */

export interface ErpData {
  academicYears: AcademicYear[];
  campuses: Campus[];
  grades: Grade[];
  sections: Section[];
  students: Student[];
  guardians: Guardian[];
  enrollments: Enrollment[];
  staff: StaffMember[];
  assignments: StaffAssignment[];
  registers: AttendanceRegister[];
  corrections: CorrectionRequest[];
  feePlans: FeePlan[];
  charges: Charge[];
  payments: Payment[];
  receipts: Receipt[];
  feeRequests: FeeRequest[];
  dayCloses: DayClose[];
  imports: ImportBatch[];
  notices: Notice[];
  audit: AuditEvent[];
  exports: ExportJob[];
  officeTasks: OfficeTask[];
  holidays: Holiday[];
}
