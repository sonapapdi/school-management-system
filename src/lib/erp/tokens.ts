/* ── Design tokens & status language (single source of truth) ── */

export type StatusTone = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'teal' | 'neutral';

export interface StatusMeta {
  label: string;
  tone: StatusTone;
}

const S = (label: string, tone: StatusTone): StatusMeta => ({ label, tone });

/** Canonical status vocabulary — §7 of the spec. Keyed by slug. */
export const STATUS_META: Record<string, StatusMeta> = {
  // Record
  active: S('Active', 'success'),
  inactive: S('Inactive', 'neutral'),
  withdrawn: S('Withdrawn', 'danger'),
  archived: S('Archived', 'neutral'),
  // Workflow
  draft: S('Draft', 'neutral'),
  pending: S('Pending review', 'warning'),
  pending_review: S('Pending review', 'warning'),
  approved: S('Approved', 'success'),
  rejected: S('Rejected', 'danger'),
  submitted: S('Submitted', 'info'),
  closed: S('Closed', 'neutral'),
  // Attendance
  unmarked: S('Unmarked', 'warning'),
  present: S('Present', 'success'),
  absent: S('Absent', 'danger'),
  leave: S('Leave', 'warning'),
  attendance_pending: S('Attendance pending', 'warning'),
  attendancepending: S('Attendance pending', 'warning'),
  // Payment
  posted: S('Posted', 'success'),
  reversal_requested: S('Reversal requested', 'warning'),
  reversalrequested: S('Reversal requested', 'warning'),
  reversed: S('Reversed', 'danger'),
  // Import
  uploaded: S('Uploaded', 'info'),
  validating: S('Validating', 'warning'),
  ready: S('Ready to commit', 'info'),
  ready_to_commit: S('Ready to commit', 'info'),
  partial: S('Partially accepted', 'warning'),
  partially_accepted: S('Partially accepted', 'warning'),
  committed: S('Committed', 'success'),
  failed: S('Failed', 'danger'),
  // Notice
  scheduled: S('Scheduled', 'info'),
  published: S('Published', 'success'),
  expired: S('Expired', 'neutral'),
  // Export
  queued: S('Queued', 'neutral'),
  running: S('Running', 'info'),
  // Office tasks
  open: S('Open', 'warning'),
  resolved: S('Resolved', 'success'),
  // Mark codes
  P: S('Present', 'success'),
  A: S('Absent', 'danger'),
  L: S('Leave', 'warning'),
  // misc
  success: S('Success', 'success'),
  upcoming: S('Upcoming', 'info'),
  locked: S('Locked', 'info'),
};

export function statusMeta(status: string): StatusMeta {
  const key = status.toLowerCase().replace(/\s+/g, '_');
  return (
    STATUS_META[status] ??
    STATUS_META[key] ??
    S(status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()), 'neutral')
  );
}

/** Role display metadata */
export const ROLE_LABEL: Record<string, string> = {
  platform_operator: 'Platform Operator',
  school_admin: 'School Administrator',
  principal: 'Principal',
  receptionist: 'Receptionist',
  accountant: 'Accountant',
  teacher: 'Teacher',
  parent: 'Parent',
};

export const PAYMENT_MODE_ICON_HINT: Record<string, string> = {
  Cash: 'Banknote',
  UPI: 'Smartphone',
  'Bank transfer': 'Landmark',
  Cheque: 'FileText',
};
