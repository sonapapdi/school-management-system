import type { Role, RouteDef, ScreenId } from './types';

const STAFF_WEB: Role[] = ['school_admin', 'principal', 'receptionist', 'accountant'];
const ADMIN_PRINCIPAL: Role[] = ['school_admin', 'principal'];

export const ROUTES: RouteDef[] = [
  /* ── Shared authentication ── */
  { id: 'A01', path: '/sign-in', title: 'Sign in', app: 'auth', roles: ['platform_operator','school_admin','principal','receptionist','accountant','teacher','parent'], desc: 'Sign in with school code, mobile or email and password.' },
  { id: 'A02', path: '/invitation', title: 'Invitation activation', app: 'auth', roles: ['platform_operator','school_admin','principal','receptionist','accountant','teacher','parent'], desc: 'Activate an invited staff or parent account.' },
  { id: 'A03', path: '/verification', title: 'Verification code', app: 'auth', roles: ['platform_operator','school_admin','principal','receptionist','accountant','teacher','parent'], desc: 'Six-digit verification code entry.' },
  { id: 'A04', path: '/recover', title: 'Recover access', app: 'auth', roles: ['platform_operator','school_admin','principal','receptionist','accountant','teacher','parent'], desc: 'Reset access with a code and new password.' },

  /* ── Dashboard ── */
  { id: 'W01', path: '/dashboard', title: 'Today dashboard', app: 'web', tab: 'Dashboard', roles: STAFF_WEB, desc: 'Academic year, attendance completion, collections, dues and open items.' },
  { id: 'W02', path: '/dashboard/alerts', title: 'Operational alerts', app: 'web', tab: 'Dashboard', roles: ADMIN_PRINCIPAL.concat('accountant'), desc: 'Missing registers, failed imports, fee variances, pending approvals.' },

  /* ── Students ── */
  { id: 'W03', path: '/students', title: 'Student directory', app: 'web', tab: 'Students', roles: STAFF_WEB, desc: 'Searchable directory of all students.' },
  { id: 'W04', path: '/students/new-admission', title: 'New admission', app: 'web', tab: 'Students', roles: ['school_admin', 'receptionist'], desc: 'Multi-step admission with duplicate check and review.' },
  { id: 'W05', path: '/students/profile', title: 'Student profile', app: 'web', tab: 'Students', roles: STAFF_WEB, desc: 'Status, guardians, attendance, ledger, timeline, enrollment history.' },
  { id: 'W06', path: '/students/guardians', title: 'Guardians & app access', app: 'web', tab: 'Students', roles: ['school_admin', 'receptionist'], desc: 'Guardian contacts, verification and parent app access.' },
  { id: 'W07', path: '/students/enrollment-history', title: 'Enrollment history & transfer', app: 'web', tab: 'Students', roles: ['school_admin', 'receptionist'], desc: 'Section transfers, withdrawals and enrollment timeline.' },
  { id: 'W08', path: '/students/import', title: 'Import upload', app: 'web', tab: 'Students', roles: ['school_admin'], desc: 'Bulk upload students or guardians with template.' },
  { id: 'W09', path: '/students/import-review', title: 'Import review & results', app: 'web', tab: 'Students', roles: ['school_admin'], desc: 'Accepted, conflicting and rejected rows before commit.' },

  /* ── Attendance ── */
  { id: 'W10', path: '/attendance', title: 'Submission monitor', app: 'web', tab: 'Attendance', roles: ADMIN_PRINCIPAL.concat('accountant'), desc: 'Which sections submitted their register for the selected date.' },
  { id: 'W11', path: '/attendance/register', title: 'Register detail', app: 'web', tab: 'Attendance', roles: ADMIN_PRINCIPAL.concat('accountant'), desc: 'Read-only register with marks, reasons and corrections.' },
  { id: 'W12', path: '/attendance/corrections', title: 'Correction requests', app: 'web', tab: 'Attendance', roles: ADMIN_PRINCIPAL, desc: 'Approve or reject attendance correction requests.' },
  { id: 'W13', path: '/attendance/report', title: 'Attendance report', app: 'web', tab: 'Attendance', roles: STAFF_WEB.concat('teacher'), desc: 'Filtered attendance percentages by date, grade, section, student.' },

  /* ── Fees ── */
  { id: 'W14', path: '/fees', title: 'Fee plan list', app: 'web', tab: 'Fees', roles: ['school_admin', 'principal', 'accountant'], desc: 'Plans, installments and status.' },
  { id: 'W15', path: '/fees/plan-editor', title: 'Create or edit fee plan', app: 'web', tab: 'Fees', roles: ['school_admin', 'accountant'], desc: 'Heads, installments, due dates and preview.' },
  { id: 'W16', path: '/fees/assessment', title: 'Assessment preview & posting', app: 'web', tab: 'Fees', roles: ['school_admin', 'accountant'], desc: 'Per-student preview before posting charges.' },
  { id: 'W17', path: '/fees/collection-desk', title: 'Collection desk', app: 'web', tab: 'Fees', roles: ['school_admin', 'accountant'], desc: 'Record verified payments against dues.' },
  { id: 'W18', path: '/fees/receipt', title: 'Payment confirmation & receipt', app: 'web', tab: 'Fees', roles: ['school_admin', 'accountant'], desc: 'Receipt with allocation and print/download.' },
  { id: 'W19', path: '/fees/ledger', title: 'Student ledger', app: 'web', tab: 'Fees', roles: STAFF_WEB, desc: 'Charges, payments, balance and status.' },
  { id: 'W20', path: '/fees/adjustments', title: 'Adjustments & reversals', app: 'web', tab: 'Fees', roles: ['school_admin', 'accountant'], desc: 'Request corrections to posted transactions.' },
  { id: 'W21', path: '/fees/day-close', title: 'Day close', app: 'web', tab: 'Fees', roles: ['school_admin', 'accountant'], desc: 'Count cash, verify UPI/bank and close the business day.' },

  /* ── Staff ── */
  { id: 'W22', path: '/staff', title: 'Staff directory', app: 'web', tab: 'Staff', roles: ADMIN_PRINCIPAL, desc: 'All staff with roles and assignments.' },
  { id: 'W23', path: '/staff/new', title: 'Add or edit staff', app: 'web', tab: 'Staff', roles: ['school_admin'], desc: 'Staff record with invite.' },
  { id: 'W24', path: '/staff/profile', title: 'Staff profile', app: 'web', tab: 'Staff', roles: ADMIN_PRINCIPAL, desc: 'Account status, assignments and recent activity.' },
  { id: 'W25', path: '/staff/assignments', title: 'Role & assignment', app: 'web', tab: 'Staff', roles: ['school_admin'], desc: 'Dated class-teacher and subject assignments.' },

  /* ── Academics ── */
  { id: 'W26', path: '/academics/years', title: 'Academic years', app: 'web', tab: 'Academics', roles: ADMIN_PRINCIPAL, desc: 'Create, activate and close academic years.' },
  { id: 'W27', path: '/academics/grades', title: 'Grades', app: 'web', tab: 'Academics', roles: ADMIN_PRINCIPAL, desc: 'Grade list and display order.' },
  { id: 'W28', path: '/academics/sections', title: 'Sections', app: 'web', tab: 'Academics', roles: ADMIN_PRINCIPAL, desc: 'Sections with capacity and class teachers.' },
  { id: 'W29', path: '/academics/calendar', title: 'Calendar & holidays', app: 'web', tab: 'Academics', roles: ADMIN_PRINCIPAL, desc: 'Holidays and teaching days for the year.' },
  { id: 'W30', path: '/academics/class-teachers', title: 'Class-teacher assignments', app: 'web', tab: 'Academics', roles: ADMIN_PRINCIPAL, desc: 'Dated assignments and substitutes.' },

  /* ── Notices ── */
  { id: 'W31', path: '/notices', title: 'Notice list', app: 'web', tab: 'Notices', roles: ['school_admin', 'principal', 'receptionist'], desc: 'All notices with audience and status.' },
  { id: 'W32', path: '/notices/editor', title: 'Create or edit notice', app: 'web', tab: 'Notices', roles: ['school_admin', 'principal', 'receptionist'], desc: 'Compose, preview and publish.' },
  { id: 'W33', path: '/notices/detail', title: 'Notice detail & audience', app: 'web', tab: 'Notices', roles: ['school_admin', 'principal', 'receptionist'], desc: 'Audience, publish info and audit.' },

  /* ── Reports ── */
  { id: 'W34', path: '/reports', title: 'Reports overview', app: 'web', tab: 'Reports', roles: ['school_admin', 'principal', 'accountant'], desc: 'Attendance, dues, collections and export shortcuts.' },
  { id: 'W35', path: '/reports/fee-dues', title: 'Fee dues report', app: 'web', tab: 'Reports', roles: ['school_admin', 'principal', 'accountant'], desc: 'As-of dues with days overdue.' },
  { id: 'W36', path: '/reports/collections', title: 'Collection report', app: 'web', tab: 'Reports', roles: ['school_admin', 'principal', 'accountant'], desc: 'Mode-wise collections with gross, reversal and net.' },
  { id: 'W37', path: '/reports/exports', title: 'Export center', app: 'web', tab: 'Reports', roles: ['school_admin', 'principal', 'accountant'], desc: 'Requested exports with status and downloads.' },

  /* ── Approvals ── */
  { id: 'W38', path: '/approvals', title: 'Approval queue', app: 'web', tab: 'Approvals', roles: ['school_admin', 'principal', 'accountant'], desc: 'All pending requests with age and owner.' },
  { id: 'W39', path: '/approvals/detail', title: 'Approval detail', app: 'web', tab: 'Approvals', roles: ['school_admin', 'principal', 'accountant'], desc: 'Original vs proposed, timeline, approve or reject.' },

  /* ── Settings ── */
  { id: 'W40', path: '/settings/school-profile', title: 'School profile', app: 'web', tab: 'Settings', roles: ['school_admin', 'platform_operator'], desc: 'School identity, contact and branding.' },
  { id: 'W41', path: '/settings/permissions', title: 'Role-permission matrix', app: 'web', tab: 'Settings', roles: ['school_admin', 'platform_operator'], desc: 'Module-level permissions per role.' },
  { id: 'W42', path: '/settings/receipt-numbering', title: 'Receipt numbering', app: 'web', tab: 'Settings', roles: ['school_admin', 'platform_operator'], desc: 'Prefix, year and next number.' },
  { id: 'W43', path: '/settings/data-retention', title: 'Data retention & exports', app: 'web', tab: 'Settings', roles: ['school_admin', 'platform_operator'], desc: 'Retention policy and full school export.' },
  { id: 'W44', path: '/settings/audit-log', title: 'Audit log', app: 'web', tab: 'Settings', roles: ['school_admin', 'platform_operator', 'principal'], desc: 'Every important action with actor and result.' },

  /* ── Teacher mobile app ── */
  { id: 'T01', path: '/teacher/today', title: 'Today', app: 'teacher', phoneTab: 0, roles: ['teacher'], desc: 'Assigned section, attendance status, latest notice.' },
  { id: 'T02', path: '/teacher/attendance/take', title: 'Take attendance', app: 'teacher', phoneTab: 2, roles: ['teacher'], desc: 'Mark the roster; block submission until none unmarked.' },
  { id: 'T03', path: '/teacher/attendance/review', title: 'Review & submit', app: 'teacher', roles: ['teacher'], desc: 'Totals and exceptions before locking the register.' },
  { id: 'T04', path: '/teacher/classes', title: 'My classes', app: 'teacher', phoneTab: 1, roles: ['teacher'], desc: 'Dated assignments for the signed-in teacher.' },
  { id: 'T05', path: '/teacher/roster', title: 'Class roster', app: 'teacher', roles: ['teacher'], desc: 'Students by dated enrollment.' },
  { id: 'T06', path: '/teacher/student-card', title: 'Student card', app: 'teacher', roles: ['teacher'], desc: 'Attendance summary and authorized note.' },
  { id: 'T07', path: '/teacher/attendance-history', title: 'Attendance history', app: 'teacher', phoneTab: 2, roles: ['teacher'], desc: 'Past registers with submission and correction status.' },
  { id: 'T08', path: '/teacher/register-detail', title: 'Submitted register', app: 'teacher', roles: ['teacher'], desc: 'Read-only register view.' },
  { id: 'T09', path: '/teacher/request-correction', title: 'Request correction', app: 'teacher', roles: ['teacher'], desc: 'Ask the office to fix a mark.' },
  { id: 'T10', path: '/teacher/notices', title: 'Notices', app: 'teacher', phoneTab: 3, roles: ['teacher'], desc: 'Published notices for staff.' },
  { id: 'T11', path: '/teacher/notice-detail', title: 'Notice detail', app: 'teacher', roles: ['teacher'], desc: 'Full message with attachment.' },
  { id: 'T12', path: '/teacher/profile', title: 'Profile & assignments', app: 'teacher', phoneTab: 4, roles: ['teacher'], desc: 'Name, code, role, sections, account status.' },
  { id: 'T13', path: '/teacher/settings', title: 'Settings & sign out', app: 'teacher', roles: ['teacher'], desc: 'Language, notifications, app version.' },

  /* ── Parent mobile app (read-only) ── */
  { id: 'P01', path: '/parent/home', title: 'Home', app: 'parent', phoneTab: 0, roles: ['parent'], desc: 'Selected child, today’s attendance, next fee due, latest notice.' },
  { id: 'P02', path: '/parent/attendance', title: 'Attendance calendar', app: 'parent', phoneTab: 1, roles: ['parent'], desc: 'Month view with present, absent, leave, pending.' },
  { id: 'P03', path: '/parent/attendance-day', title: 'Attendance day detail', app: 'parent', roles: ['parent'], desc: 'Status, shared reason, report a possible error.' },
  { id: 'P04', path: '/parent/fees', title: 'Fees summary', app: 'parent', phoneTab: 2, roles: ['parent'], desc: 'Charges, paid, remaining, next due. No Pay Now.' },
  { id: 'P05', path: '/parent/installment', title: 'Installment detail', app: 'parent', roles: ['parent'], desc: 'Fee head, concession, paid, remaining.' },
  { id: 'P06', path: '/parent/receipts', title: 'Receipts', app: 'parent', phoneTab: 2, roles: ['parent'], desc: 'All receipts for the selected child.' },
  { id: 'P07', path: '/parent/receipt-detail', title: 'Receipt detail', app: 'parent', roles: ['parent'], desc: 'Receipt with download and share.' },
  { id: 'P08', path: '/parent/notices', title: 'Notices', app: 'parent', phoneTab: 3, roles: ['parent'], desc: 'Notices for the child’s audience.' },
  { id: 'P09', path: '/parent/notice-detail', title: 'Notice detail', app: 'parent', roles: ['parent'], desc: 'Message with attachment download.' },
  { id: 'P10', path: '/parent/profile', title: 'Child profile', app: 'parent', phoneTab: 4, roles: ['parent'], desc: 'Student identity and school year.' },
  { id: 'P11', path: '/parent/guardian-access', title: 'Guardian access', app: 'parent', roles: ['parent'], desc: 'Linked guardians and access status.' },
  { id: 'P12', path: '/parent/help', title: 'Help & school contact', app: 'parent', roles: ['parent'], desc: 'School phone, email, office hours, sign out.' },
];

export const ROUTE_MAP: Record<ScreenId, RouteDef> = ROUTES.reduce(
  (acc, r) => ({ ...acc, [r.id]: r }),
  {} as Record<ScreenId, RouteDef>,
);

/** The 10 MVP sidebar tabs, in order */
export const WEB_TABS: { tab: string; screen: ScreenId }[] = [
  { tab: 'Dashboard', screen: 'W01' },
  { tab: 'Students', screen: 'W03' },
  { tab: 'Attendance', screen: 'W10' },
  { tab: 'Fees', screen: 'W14' },
  { tab: 'Staff', screen: 'W22' },
  { tab: 'Academics', screen: 'W26' },
  { tab: 'Notices', screen: 'W31' },
  { tab: 'Reports', screen: 'W34' },
  { tab: 'Approvals', screen: 'W38' },
  { tab: 'Settings', screen: 'W40' },
];

export const routesForTab = (tab: string): RouteDef[] => ROUTES.filter((r) => r.app === 'web' && r.tab === tab);

export const TEACHER_TABS: { screen: ScreenId; label: string }[] = [
  { screen: 'T01', label: 'Today' },
  { screen: 'T04', label: 'Classes' },
  { screen: 'T02', label: 'Attendance' },
  { screen: 'T10', label: 'Notices' },
  { screen: 'T12', label: 'Profile' },
];

export const PARENT_TABS: { screen: ScreenId; label: string }[] = [
  { screen: 'P01', label: 'Home' },
  { screen: 'P02', label: 'Attendance' },
  { screen: 'P04', label: 'Fees' },
  { screen: 'P08', label: 'Notices' },
  { screen: 'P10', label: 'Profile' },
];
