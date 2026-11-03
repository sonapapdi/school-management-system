'use client';

import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import type {
  DialogId, ErpData, FeeRequest, MarkCode, PaymentMode, Role, ScreenId, SchoolSettings,
  ScreenId as ScreenIdT, ThemeConfig, ToastItem,
} from './types';
import { buildSeedData, IDS, SCHOOL_DATE_DEFAULT, SESSION_USERS } from './seed';
import { allocateCharges } from './seed';
import { nowIso, uid } from './utils';
import { chargePaid, getSection, rosterOf } from './derive';

type ErpStore = {
  booted: boolean;
  session: { signedIn: boolean; role: Role; userName: string };
  route: { screen: ScreenIdT; params: Record<string, string> };
  schoolDate: string;
  ayId: string;
  campusId: string;
  sidebarCollapsed: boolean;
  readNotices: Record<string, boolean>;
  reviewedAlerts: string[];
  visited: ScreenIdT[];
  theme: ThemeConfig;
  settings: SchoolSettings;
  data: ErpData;
  toasts: ToastItem[];
  dialog: { id: DialogId; payload?: Record<string, unknown> } | null;

  /* navigation & session */
  nav: (screen: ScreenIdT, params?: Record<string, string>) => void;
  setRole: (role: Role) => void;
  signIn: (role?: Role) => void;
  signOut: () => void;
  setSchoolDate: (date: string) => void;
  setAy: (ayId: string) => void;
  setCampus: (campusId: string) => void;
  toggleSidebar: () => void;

  /* ui */
  openDialog: (id: DialogId, payload?: Record<string, unknown>) => void;
  closeDialog: () => void;
  pushToast: (t: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;

  /* students */
  addStudent: (input: {
    firstName: string; middleName?: string; lastName: string; dob: string; gender: 'Female' | 'Male';
    admissionDate: string; ayId: string; sectionId: string; rollNo: number;
    guardianName: string; relationship: 'Father' | 'Mother' | 'Guardian'; guardianMobile: string;
    guardianEmail?: string; communicationAllowed: boolean; appAccess: boolean;
  }) => string;
  updateStudent: (studentId: string, patch: Partial<ErpData['students'][number]>) => void;
  transferStudent: (input: { studentId: string; toSectionId: string; effectiveDate: string; rollNo: number; reason: string }) => void;
  withdrawStudent: (input: { studentId: string; reason: string; date: string }) => void;
  addGuardian: (input: { studentId: string; name: string; relationship: 'Father' | 'Mother' | 'Guardian'; mobile: string; email?: string; communicationAllowed: boolean; appAccess: boolean }) => void;
  verifyGuardian: (guardianId: string) => void;
  inviteParent: (guardianId: string) => void;
  revokeParentAccess: (guardianId: string) => void;

  /* imports */
  createImport: (input: { type: 'Students' | 'Guardians'; ayId: string; fileName: string; headerRow: boolean; duplicateStrategy: 'skip' | 'update' }) => string;
  validateImport: (importId: string) => void;
  commitImport: (importId: string) => void;
  discardImport: (importId: string) => void;

  /* staff */
  upsertStaff: (input: { id?: string; code: string; name: string; mobile: string; email: string; startDate: string; role: ErpData['staff'][number]['role']; status: 'active' | 'inactive'; invite?: boolean }) => string;
  deactivateStaff: (staffId: string) => void;
  resetStaffAccess: (staffId: string) => void;
  addAssignment: (input: { staffId: string; gradeId?: string; sectionId?: string; type: 'Class Teacher' | 'Subject Teacher' | 'Substitute'; start: string; end?: string }) => void;
  endAssignment: (assignmentId: string, end: string) => void;

  /* attendance */
  saveRegisterDraft: (input: { date: string; sectionId: string; marks: Record<string, MarkCode>; reasons: Record<string, string> }) => void;
  markRemainingPresent: (input: { date: string; sectionId: string }) => void;
  submitRegister: (input: { date: string; sectionId: string; actorRole?: Role | 'System' }) => void;
  requestCorrection: (input: { date: string; sectionId: string; studentId: string; from: MarkCode; to: MarkCode; reason: string; note?: string; requestedBy: string }) => string;
  resolveCorrection: (correctionId: string, approve: boolean, note?: string) => void;
  bumpRegisterRevision: (date: string, sectionId: string) => void;

  /* fees */
  postCharges: (input: { planId: string; studentIds: string[]; actorName: string }) => number;
  recordPayment: (input: { studentId: string; amount: number; mode: PaymentMode; reference?: string; notes?: string; collectedBy: string }) => { paymentId: string; receiptId: string; receiptNo: string } | null;
  requestReversal: (input: { paymentId: string; reason: string; requestedBy: string }) => void;
  requestAdjustment: (input: { chargeId: string; amount: number; reason: string; requestedBy: string }) => void;
  resolveFeeRequest: (feeRequestId: string, approve: boolean, reviewer: string, note?: string) => void;
  saveDayClose: (input: { date: string; cashCounted: number; upiVerified: number; bankVerified: number; explanation?: string }) => void;
  submitDayClose: (input: { date: string; reviewer: string }) => void;

  /* notices */
  saveNotice: (input: { id?: string; title: string; message: string; audience: ErpData['notices'][number]['audience']; gradeId?: string; sectionId?: string; publishDate: string; expiryDate: string; attachment?: string; author: string; status?: 'draft' | 'scheduled' | 'published' }) => string;
  publishNotice: (noticeId: string) => void;
  expireNotice: (noticeId: string) => void;
  duplicateNotice: (noticeId: string) => string;
  markNoticeRead: (noticeId: string) => void;

  /* ops */
  createExport: (type: string, requestedBy: string) => void;
  deleteExport: (exportId: string) => void;
  createOfficeTask: (input: { studentId: string; note: string; from: string }) => void;
  resolveOfficeTask: (taskId: string) => void;
  markAlertReviewed: (alertId: string) => void;
  addAuditEvent: (action: string, resource: string, resourceId: string, result?: 'success' | 'denied' | 'failed') => void;

  /* settings & theme */
  updateSettings: (patch: Partial<SchoolSettings>) => void;
  updateTheme: (patch: Partial<ThemeConfig>) => void;
  resetDemo: () => void;

  /* fee plans & academics setup */
  upsertFeePlan: (input: { id?: string; name: string; ayId: string; appliesTo: string; heads: { head: string; amount: number }[]; installments: { id: string; name: string; amount: number; dueDate: string; sequence: number }[]; partialAllowed: boolean; status: 'draft' | 'active' | 'archived' }) => string;
  addGrade: (name: string) => void;
  archiveGrade: (gradeId: string) => void;
  addSection: (input: { gradeId: string; name: string; capacity: number }) => void;
  updateSection: (sectionId: string, patch: { capacity?: number; classTeacherId?: string }) => void;
  archiveSection: (sectionId: string) => void;
  addHoliday: (input: { date: string; type: 'Holiday' | 'Teaching day'; name: string; appliesTo: string }) => void;
  activateYear: (ayId: string) => void;
  closeYear: (ayId: string) => void;
};

const safeStorage: StateStorage = {
  getItem: (name) => {
    try {
      return localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    try {
      localStorage.setItem(name, value);
    } catch {
      /* quota exceeded — prototype continues in memory */
    }
  },
  removeItem: (name) => {
    try {
      localStorage.removeItem(name);
    } catch {
      /* noop */
    }
  },
};

function homeFor(role: Role): ScreenIdT {
  if (role === 'teacher') return 'T01';
  if (role === 'parent') return 'P01';
  return 'W01';
}

function applyThemeVars(theme: ThemeConfig) {
  if (typeof document === 'undefined') return;
  document.documentElement.style.setProperty('--erp-primary', theme.primary);
  document.documentElement.style.setProperty('--erp-primary-dark', theme.primaryDark);
}

export const initialData: ErpData = buildSeedData();

export const useErp = create<ErpStore>()(
  persist(
    (set, get) => {
      const audit = (action: string, resource: string, resourceId: string, result: 'success' | 'denied' | 'failed' = 'success') => {
        const s = get();
        set((st) => ({
          data: {
            ...st.data,
            audit: [
              { id: uid('aud'), at: nowIso().slice(0, 16), actor: st.session.userName, role: st.session.role, action, resource, resourceId, result },
              ...st.data.audit,
            ].slice(0, 400),
          },
        }));
        void s;
      };
      const toast = (title: string, variant: ToastItem['variant'] = 'success', description?: string) => {
        const id = uid('t');
        set((st) => ({ toasts: [...st.toasts, { id, title, description, variant }] }));
        setTimeout(() => {
          set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }));
        }, 4200);
      };

      return {
        booted: false,
        session: { signedIn: false, role: 'school_admin', userName: 'Sunita Deshpande' },
        route: { screen: 'A01', params: {} },
        schoolDate: SCHOOL_DATE_DEFAULT,
        ayId: IDS.ay2627,
        campusId: IDS.campusMain,
        sidebarCollapsed: false,
        readNotices: {},
        reviewedAlerts: [],
        visited: [],
        theme: {
          productName: 'School ERP', logoLetter: 'S', schoolName: 'Sunrise Public School',
          campusName: 'Main Campus', primary: '#5B5FEF', primaryDark: '#3438B8',
          secondary: '#0E9F9A', cardRadius: 14,
        },
        settings: {
          timezone: 'Asia/Kolkata', phone: '+91 20 4075 1200', email: 'office@sunrisepublic.edu.in',
          address: 'Survey 21, Baner Road, Pune 411045, Maharashtra',
          receiptPrefix: 'RCPT/2026/', importRetentionMonths: 36, exportRetentionDays: 14,
          lastBackupTest: '2026-07-15',
        },
        data: initialData,
        toasts: [],
        dialog: null,

        /* ── navigation & session ── */
        nav: (screen, params = {}) => {
          set((st) => ({
            route: { screen, params },
            dialog: null,
            visited: st.visited.includes(screen) ? st.visited : [...st.visited, screen],
          }));
        },
        setRole: (role) => {
          set((st) => ({
            session: { signedIn: true, role, userName: SESSION_USERS[role]?.name ?? st.session.userName },
          }));
          get().nav(homeFor(role));
        },
        signIn: (role) => {
          const r = role ?? get().session.role;
          set((st) => ({ session: { signedIn: true, role: r, userName: SESSION_USERS[r]?.name ?? st.session.userName } }));
          audit('Signed in', 'Session', '—');
          get().nav(homeFor(r));
        },
        signOut: () => {
          audit('Signed out', 'Session', '—');
          set({ session: { signedIn: false, role: get().session.role, userName: SESSION_USERS[get().session.role]?.name ?? '' } });
          get().nav('A01');
        },
        setSchoolDate: (date) => set({ schoolDate: date }),
        setAy: (ayId) => set({ ayId }),
        setCampus: (campusId) => set({ campusId }),
        toggleSidebar: () => set((st) => ({ sidebarCollapsed: !st.sidebarCollapsed })),

        /* ── ui ── */
        openDialog: (id, payload) => set({ dialog: { id, payload } }),
        closeDialog: () => set({ dialog: null }),
        pushToast: (t) => {
          const id = uid('t');
          set((st) => ({ toasts: [...st.toasts, { ...t, id }] }));
          setTimeout(() => {
            set((st) => ({ toasts: st.toasts.filter((x) => x.id !== id) }));
          }, 4200);
        },
        dismissToast: (id) => set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) })),

        /* ── students ── */
        addStudent: (input) => {
          const id = uid('stu');
          set((st) => {
            const admNos = st.data.students.map((s) => Number(s.admNo.split('-').pop())).filter((n) => !isNaN(n));
            const grNos = st.data.students.map((s) => Number(s.grNo)).filter((n) => !isNaN(n));
            const student: ErpData['students'][number] = {
              id,
              admNo: `ADM-2026-${String(Math.max(0, ...admNos) + 1).padStart(4, '0')}`,
              grNo: String(Math.max(0, ...grNos) + 1),
              firstName: input.firstName,
              middleName: input.middleName,
              lastName: input.lastName,
              displayName: `${input.firstName} ${input.lastName}`.trim(),
              dob: input.dob,
              gender: input.gender,
              admissionDate: input.admissionDate,
              status: 'active',
            };
            const guardian: ErpData['guardians'][number] = {
              id: uid('grd'), studentId: id, name: input.guardianName, relationship: input.relationship,
              mobile: input.guardianMobile, email: input.guardianEmail,
              communicationAllowed: input.communicationAllowed, appAccess: input.appAccess, verified: false,
            };
            const enrollment: ErpData['enrollments'][number] = {
              id: uid('enr'), studentId: id, ayId: input.ayId, sectionId: input.sectionId,
              rollNo: input.rollNo, start: input.admissionDate, status: 'active',
            };
            return { data: { ...st.data, students: [...st.data.students, student], guardians: [...st.data.guardians, guardian], enrollments: [...st.data.enrollments, enrollment] } };
          });
          audit('Admitted student', 'Student', id);
          toast('Student admitted', 'success', `${input.firstName} ${input.lastName} was added to the directory.`);
          return id;
        },
        updateStudent: (studentId, patch) => {
          set((st) => ({
            data: { ...st.data, students: st.data.students.map((s) => (s.id === studentId ? { ...s, ...patch, displayName: `${patch.firstName ?? s.firstName} ${patch.lastName ?? s.lastName}`.trim() } : s)) },
          }));
          audit('Updated student profile', 'Student', studentId);
        },
        transferStudent: ({ studentId, toSectionId, effectiveDate, rollNo, reason }) => {
          set((st) => ({
            data: {
              ...st.data,
              enrollments: [
                ...st.data.enrollments.map((e) =>
                  e.studentId === studentId && e.ayId === st.ayId && e.status === 'active'
                    ? { ...e, status: 'transferred' as const, end: effectiveDate, reason }
                    : e,
                ),
                { id: uid('enr'), studentId, ayId: st.ayId, sectionId: toSectionId, rollNo, start: effectiveDate, status: 'active' as const },
              ],
            },
          }));
          audit('Transferred student', 'Enrollment', studentId);
          toast('Student transferred', 'success');
        },
        withdrawStudent: ({ studentId, reason, date }) => {
          set((st) => ({
            data: {
              ...st.data,
              students: st.data.students.map((s) => (s.id === studentId ? { ...s, status: 'withdrawn' as const } : s)),
              enrollments: st.data.enrollments.map((e) =>
                e.studentId === studentId && e.status === 'active' ? { ...e, status: 'withdrawn' as const, end: date, reason } : e,
              ),
            },
          }));
          audit('Withdrew student', 'Student', studentId);
          toast('Student withdrawn', 'info', reason);
        },
        addGuardian: (input) => {
          set((st) => ({
            data: { ...st.data, guardians: [...st.data.guardians, { id: uid('grd'), verified: false, invitedAt: undefined, appAccessEnd: undefined, ...input }] },
          }));
          audit('Added guardian', 'Guardian', input.studentId);
          toast('Guardian added', 'success');
        },
        verifyGuardian: (guardianId) => {
          set((st) => ({ data: { ...st.data, guardians: st.data.guardians.map((g) => (g.id === guardianId ? { ...g, verified: true } : g)) } }));
          audit('Verified guardian contact', 'Guardian', guardianId);
          toast('Contact verified', 'success');
        },
        inviteParent: (guardianId) => {
          set((st) => ({ data: { ...st.data, guardians: st.data.guardians.map((g) => (g.id === guardianId ? { ...g, appAccess: true, invitedAt: nowIso().slice(0, 16) } : g)) } }));
          audit('Invited parent', 'Guardian', guardianId);
          toast('Invitation sent', 'success', 'The guardian will receive an activation link on their mobile.');
        },
        revokeParentAccess: (guardianId) => {
          set((st) => ({ data: { ...st.data, guardians: st.data.guardians.map((g) => (g.id === guardianId ? { ...g, appAccess: false, appAccessEnd: nowIso().slice(0, 10) } : g)) } }));
          audit('Revoked parent access', 'Guardian', guardianId);
          toast('App access revoked', 'info');
        },

        /* ── imports ── */
        createImport: ({ type, ayId, fileName, headerRow, duplicateStrategy }) => {
          const id = uid('imp');
          const rows: ErpData['imports'][number]['rows'] = Array.from({ length: 12 }, (_, i) => ({
            n: i + 1,
            values: {
              'Admission number': `ADM-2026-${String(800 + i)}`,
              'First name': `Student${i + 1}`,
              'Last name': 'Imported',
              Grade: '4',
              Section: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C',
              'Date of birth': `2016-${String((i % 12) + 1).padStart(2, '0')}-1${i % 9}`,
              'Guardian name': 'Guardian Import',
              'Guardian mobile': `9${String(800000000 + i * 137)}`,
            },
            result: 'accepted' as const,
          }));
          set((st) => ({
            data: {
              ...st.data,
              imports: [{ id, type, ayId, fileName, headerRow, duplicateStrategy, uploadedAt: nowIso().slice(0, 16), uploadedBy: st.session.userName, status: 'uploaded', rows }, ...st.data.imports],
            },
          }));
          audit('Uploaded import', 'Import', id);
          return id;
        },
        validateImport: (importId) => {
          set((st) => ({
            data: {
              ...st.data,
              imports: st.data.imports.map((imp) => {
                if (imp.id !== importId) return imp;
                const rows = imp.rows.map((row, i) => {
                  if (i === 3) return { ...row, result: 'conflict' as const, match: `${row.values['Admission number']} — ${row.values['First name']} ${row.values['Last name']} (already in directory)` };
                  if (i === 7) return { ...row, result: 'rejected' as const, error: 'Guardian mobile must be 10 digits.' };
                  return row;
                });
                const rejected = rows.filter((r) => r.result === 'rejected').length;
                const status = rejected === rows.length ? 'failed' as const : rejected > 0 ? 'partial' as const : 'ready' as const;
                return { ...imp, rows, status };
              }),
            },
          }));
          audit('Validated import', 'Import', importId);
        },
        commitImport: (importId) => {
          const st = get();
          const imp = st.data.imports.find((i) => i.id === importId);
          if (!imp) return;
          const accepted = imp.rows.filter((r) => r.result === 'accepted');
          const newStudents: ErpData['students'][number][] = [];
          const newGuardians: ErpData['guardians'][number][] = [];
          const newEnrollments: ErpData['enrollments'][number][] = [];
          const sectionsFor = (g: string, sec: string) => st.data.sections.find((s) => s.gradeId === `g${g}` && s.name === sec)?.id;
          accepted.forEach((row, i) => {
            const id = uid('stu');
            const sectionId = sectionsFor(row.values['Grade'], row.values['Section']) ?? IDS.section7A;
            newStudents.push({
              id,
              admNo: row.values['Admission number'],
              grNo: String(4600 + i),
              firstName: row.values['First name'],
              lastName: row.values['Last name'],
              displayName: `${row.values['First name']} ${row.values['Last name']}`,
              dob: row.values['Date of birth'],
              gender: i % 2 === 0 ? 'Female' : 'Male',
              admissionDate: imp.uploadedAt.slice(0, 10),
              status: 'active',
            });
            newGuardians.push({
              id: uid('grd'), studentId: id, name: row.values['Guardian name'], relationship: 'Father',
              mobile: `+91 ${row.values['Guardian mobile']}`, communicationAllowed: true, appAccess: false, verified: false,
            });
            newEnrollments.push({ id: uid('enr'), studentId: id, ayId: imp.ayId, sectionId, rollNo: 30 + i, start: imp.uploadedAt.slice(0, 10), status: 'active' });
          });
          set((s2) => ({
            data: {
              ...s2.data,
              students: [...s2.data.students, ...newStudents],
              guardians: [...s2.data.guardians, ...newGuardians],
              enrollments: [...s2.data.enrollments, ...newEnrollments],
              imports: s2.data.imports.map((x) => (x.id === importId ? { ...x, status: 'committed' as const } : x)),
            },
          }));
          audit('Committed import', 'Import', importId);
          toast('Import committed', 'success', `${accepted.length} students added to the directory.`);
        },
        discardImport: (importId) => {
          set((st) => ({ data: { ...st.data, imports: st.data.imports.filter((i) => i.id !== importId) } }));
          audit('Discarded import', 'Import', importId);
          toast('Import batch discarded', 'info');
        },

        /* ── staff ── */
        upsertStaff: (input) => {
          const id = input.id ?? uid('stf');
          set((st) => {
            const exists = st.data.staff.some((s) => s.id === id);
            const member: ErpData['staff'][number] = {
              id, code: input.code, name: input.name, role: input.role, mobile: input.mobile,
              email: input.email, startDate: input.startDate, status: input.status,
              lastSignIn: input.invite ? undefined : st.data.staff.find((s) => s.id === id)?.lastSignIn,
            };
            return {
              data: {
                ...st.data,
                staff: exists ? st.data.staff.map((s) => (s.id === id ? member : s)) : [...st.data.staff, member],
                assignments: exists ? st.data.assignments : [...st.data.assignments, { id: uid('asg'), staffId: id, ayId: st.ayId, type: input.role === 'Class Teacher' ? 'Class Teacher' : 'Subject Teacher', start: input.startDate }],
              },
            };
          });
          audit(input.invite ? 'Saved staff and sent invite' : 'Saved staff', 'Staff', id);
          toast(input.invite ? 'Staff saved — invite sent' : 'Staff saved', 'success');
          return id;
        },
        deactivateStaff: (staffId) => {
          set((st) => ({ data: { ...st.data, staff: st.data.staff.map((s) => (s.id === staffId ? { ...s, status: 'inactive' as const } : s)) } }));
          audit('Deactivated staff', 'Staff', staffId);
          toast('Staff deactivated', 'info');
        },
        resetStaffAccess: (staffId) => {
          audit('Reset access', 'Staff', staffId);
          toast('Reset link sent', 'success', 'The staff member will set a new password on next sign-in.');
        },
        addAssignment: (input) => {
          set((st) => ({ data: { ...st.data, assignments: [...st.data.assignments, { id: uid('asg'), ayId: st.ayId, ...input }] } }));
          audit('Added assignment', 'Assignment', input.staffId);
          toast('Assignment added', 'success');
        },
        endAssignment: (assignmentId, end) => {
          set((st) => ({ data: { ...st.data, assignments: st.data.assignments.map((a) => (a.id === assignmentId ? { ...a, end } : a)) } }));
          audit('Ended assignment', 'Assignment', assignmentId);
          toast('Assignment ended', 'info');
        },

        /* ── attendance ── */
        saveRegisterDraft: ({ date, sectionId, marks, reasons }) => {
          set((st) => {
            const existing = st.data.registers.find((r) => r.date === date && r.sectionId === sectionId);
            if (existing) {
              return {
                data: {
                  ...st.data,
                  registers: st.data.registers.map((r) =>
                    r.id === existing.id ? { ...r, marks, reasons, status: 'draft' as const } : r,
                  ),
                },
              };
            }
            return {
              data: {
                ...st.data,
                registers: [...st.data.registers, { id: `reg-${date}-${sectionId}`, date, sectionId, marks, reasons, status: 'draft', revision: 1 }],
              },
            };
          });
          toast('Draft saved', 'info', 'You can finish marking later.');
        },
        markRemainingPresent: ({ date, sectionId }) => {
          set((st) => {
            const roster = rosterOf(st.data, sectionId, st.ayId);
            const reg = st.data.registers.find((r) => r.date === date && r.sectionId === sectionId);
            const marks = { ...(reg?.marks ?? {}) };
            for (const { student } of roster) {
              if (!marks[student.id]) marks[student.id] = 'P';
            }
            return {
              data: {
                ...st.data,
                registers: reg
                  ? st.data.registers.map((r) => (r.id === reg.id ? { ...r, marks, status: r.status === 'unmarked' ? 'draft' : r.status } : r))
                  : [...st.data.registers, { id: `reg-${date}-${sectionId}`, date, sectionId, marks, reasons: {}, status: 'draft', revision: 1 }],
              },
            };
          });
          toast('Remaining students marked present', 'success');
        },
        submitRegister: ({ date, sectionId, actorRole }) => {
          const st = get();
          const reg = st.data.registers.find((r) => r.date === date && r.sectionId === sectionId);
          if (!reg) return;
          const who = actorRole === 'teacher' ? st.session.userName : st.session.userName;
          set((s2) => ({
            data: {
              ...s2.data,
              registers: s2.data.registers.map((r) =>
                r.id === reg.id
                  ? { ...r, status: 'submitted' as const, submittedAt: nowIso().slice(0, 16), submittedBy: who, revision: r.revision + 1 }
                  : r,
              ),
            },
          }));
          audit('Submitted register', 'Register', `reg-${date}-${sectionId}`);
          toast('Register submitted', 'success', `${getSection(st.data, sectionId)?.name ?? ''} register is now locked for the day.`);
        },
        requestCorrection: ({ date, sectionId, studentId, from, to, reason, note, requestedBy }) => {
          const id = uid('crq');
          set((st) => {
            const no = `CORR-${String(st.data.corrections.length + 33).padStart(4, '0')}`;
            return {
              data: {
                ...st.data,
                corrections: [
                  { id, no, date, sectionId, studentId, from, to, reason, note, requestedBy, requestedAt: nowIso().slice(0, 16), status: 'pending' },
                  ...st.data.corrections,
                ],
              },
            };
          });
          audit('Requested attendance correction', 'Correction', id);
          toast('Correction requested', 'success', 'The office will review this request.');
          return id;
        },
        resolveCorrection: (correctionId, approve, note) => {
          const st = get();
          const c = st.data.corrections.find((x) => x.id === correctionId);
          if (!c) return;
          set((s2) => ({
            data: {
              ...s2.data,
              corrections: s2.data.corrections.map((x) =>
                x.id === correctionId
                  ? { ...x, status: approve ? 'approved' as const : 'rejected' as const, reviewer: s2.session.userName, resolvedAt: nowIso().slice(0, 16), resolutionNote: note }
                  : x,
              ),
              registers: approve
                ? s2.data.registers.map((r) =>
                    r.date === c.date && r.sectionId === c.sectionId
                      ? { ...r, marks: { ...r.marks, [c.studentId]: c.to }, revision: r.revision + 1 }
                      : r,
                  )
                : s2.data.registers,
            },
          }));
          audit(approve ? 'Approved correction' : 'Rejected correction', 'Correction', correctionId);
          toast(approve ? 'Correction approved' : 'Correction rejected', approve ? 'success' : 'info');
        },
        bumpRegisterRevision: (date, sectionId) => {
          set((st) => ({
            data: {
              ...st.data,
              registers: st.data.registers.map((r) => (r.date === date && r.sectionId === sectionId ? { ...r, revision: r.revision + 1 } : r)),
            },
          }));
        },

        /* ── fees ── */
        postCharges: ({ planId, studentIds, actorName }) => {
          const st = get();
          const plan = st.data.feePlans.find((p) => p.id === planId);
          if (!plan) return 0;
          let created = 0;
          const newCharges: ErpData['charges'][number][] = [];
          for (const sid of studentIds) {
            for (const inst of plan.installments) {
              const exists = st.data.charges.some((c) => c.studentId === sid && c.installmentId === inst.id && c.status === 'posted');
              if (!exists) {
                newCharges.push({
                  id: uid('chg'), studentId: sid, ayId: plan.ayId, planId: plan.id,
                  installmentId: inst.id, head: `Annual fee — ${inst.name}`, amount: inst.amount,
                  date: st.schoolDate, dueDate: inst.dueDate, status: 'posted',
                });
                created += 1;
              }
            }
          }
          set((s2) => ({ data: { ...s2.data, charges: [...s2.data.charges, ...newCharges] } }));
          audit('Posted fee charges', 'Charge batch', planId);
          toast('Charges posted', 'success', `${created} charge${created === 1 ? '' : 's'} posted by ${actorName}.`);
          return created;
        },
        recordPayment: ({ studentId, amount, mode, reference, notes, collectedBy }) => {
          const st = get();
          const open = st.data.charges
            .filter((c) => c.studentId === studentId && c.status === 'posted')
            .map((c) => ({ id: c.id, amount: Math.max(0, c.amount - chargePaid(st.data, c.id)), dueDate: c.dueDate }))
            .filter((c) => c.amount > 0);
          const due = open.reduce((t, c) => t + c.amount, 0);
          if (amount <= 0 || amount > due) {
            toast('Payment not confirmed', 'error', 'Amount must be greater than ₹0.00 and not exceed the outstanding dues.');
            return null;
          }
          const allocations = allocateCharges(open, amount);
          const paymentId = uid('pay');
          const receiptId = uid('rcp');
          const receiptNo = st.settings.receiptPrefix + String(st.data.receipts.length + 1240).padStart(5, '0');
          set((s2) => ({
            data: {
              ...s2.data,
              payments: [...s2.data.payments, { id: paymentId, studentId, date: s2.schoolDate, amount, mode, reference, notes, collectedBy, allocations, status: 'posted' }],
              receipts: [...s2.data.receipts, { id: receiptId, no: receiptNo, paymentId, studentId, date: s2.schoolDate, amount, mode, collectedBy }],
            },
          }));
          audit('Recorded payment', 'Payment', receiptNo);
          toast('Payment confirmed', 'success', `Receipt ${receiptNo} issued.`);
          return { paymentId, receiptId, receiptNo };
        },
        requestReversal: ({ paymentId, reason, requestedBy }) => {
          const st = get();
          const pay = st.data.payments.find((p) => p.id === paymentId);
          if (!pay) return;
          const id = uid('frq');
          set((s2) => ({
            data: {
              ...s2.data,
              payments: s2.data.payments.map((p) => (p.id === paymentId ? { ...p, status: 'reversal_requested' as const } : p)),
              feeRequests: [
                {
                  id, type: 'reversal', paymentId, studentId: pay.studentId,
                  originalRef: s2.data.receipts.find((r) => r.paymentId === paymentId)?.no ?? paymentId,
                  amount: pay.amount, reason, requestedBy, requestedAt: nowIso().slice(0, 16), status: 'pending',
                } as FeeRequest,
                ...s2.data.feeRequests,
              ],
            },
          }));
          audit('Requested payment reversal', 'Fee request', id);
          toast('Reversal requested', 'info', 'Awaiting approval.');
        },
        requestAdjustment: ({ chargeId, amount, reason, requestedBy }) => {
          const st = get();
          const ch = st.data.charges.find((c) => c.id === chargeId);
          if (!ch) return;
          const id = uid('frq');
          set((s2) => ({
            data: {
              ...s2.data,
              feeRequests: [
                { id, type: 'adjustment', chargeId, studentId: ch.studentId, originalRef: ch.head, amount, reason, requestedBy, requestedAt: nowIso().slice(0, 16), status: 'pending' } as FeeRequest,
                ...s2.data.feeRequests,
              ],
            },
          }));
          audit('Requested fee adjustment', 'Fee request', id);
          toast('Adjustment requested', 'info', 'Awaiting approval.');
        },
        resolveFeeRequest: (feeRequestId, approve, reviewer, note) => {
          const st = get();
          const fr = st.data.feeRequests.find((f) => f.id === feeRequestId);
          if (!fr) return;
          set((s2) => ({
            data: {
              ...s2.data,
              feeRequests: s2.data.feeRequests.map((f) =>
                f.id === feeRequestId ? { ...f, status: approve ? 'approved' as const : 'rejected' as const, reviewer, resolvedAt: nowIso().slice(0, 16) } : f,
              ),
              payments: fr.type === 'reversal' && fr.paymentId && approve
                ? s2.data.payments.map((p) => (p.id === fr.paymentId ? { ...p, status: 'reversed' as const } : p))
                : s2.data.payments,
              charges: fr.type === 'adjustment' && fr.chargeId && approve
                ? s2.data.charges.map((c) => (c.id === fr.chargeId ? { ...c, amount: Math.max(0, c.amount - fr.amount) } : c))
                : s2.data.charges,
            },
          }));
          audit(approve ? 'Approved fee request' : 'Rejected fee request', 'Fee request', feeRequestId, note === 'denied' ? 'denied' : 'success');
          toast(approve ? 'Request approved' : 'Request rejected', approve ? 'success' : 'info');
        },
        saveDayClose: ({ date, cashCounted, upiVerified, bankVerified, explanation }) => {
          const st = get();
          const cashExpected = st.data.payments.filter((p) => p.date === date && p.mode === 'Cash' && p.status === 'posted').reduce((t, p) => t + p.amount, 0);
          const upi = st.data.payments.filter((p) => p.date === date && p.mode === 'UPI' && p.status === 'posted').reduce((t, p) => t + p.amount, 0);
          const bank = st.data.payments.filter((p) => p.date === date && p.mode === 'Bank transfer' && p.status === 'posted').reduce((t, p) => t + p.amount, 0);
          const variance = cashExpected - cashCounted;
          set((s2) => ({
            data: {
              ...s2.data,
              dayCloses: [
                ...s2.data.dayCloses.filter((dc) => dc.date !== date),
                { id: `dc-${date}`, date, cashExpected, cashCounted, upiVerified: upiVerified || upi, bankVerified: bankVerified || bank, variance, explanation, status: 'draft' as const },
              ],
            },
          }));
          audit('Saved day-close count', 'Day close', date);
          toast('Count saved', 'info', variance === 0 ? 'No variance.' : `Variance ₹${Math.abs(variance).toLocaleString('en-IN')}.`);
        },
        submitDayClose: ({ date, reviewer }) => {
          set((st) => ({
            data: { ...st.data, dayCloses: st.data.dayCloses.map((dc) => (dc.date === date ? { ...dc, status: 'closed' as const, reviewer } : dc)) },
          }));
          audit('Closed business day', 'Day close', date);
          toast('Day closed', 'success', `Business day ${date} is closed.`);
        },

        /* ── notices ── */
        saveNotice: ({ id, title, message, audience, gradeId, sectionId, publishDate, expiryDate, attachment, author, status: forcedStatus }) => {
          const st = get();
          const nid = id ?? uid('not');
          const computed: ErpData['notices'][number]['status'] = forcedStatus
            ?? (id ? st.data.notices.find((n) => n.id === id)?.status ?? 'draft' : publishDate > st.schoolDate ? 'scheduled' : 'published');
          set((s2) => ({
            data: {
              ...s2.data,
              notices: id
                ? s2.data.notices.map((n) => (n.id === id ? { ...n, title, message, audience, gradeId, sectionId, publishDate, expiryDate, attachment } : n))
                : [...s2.data.notices, { id: nid, title, message, audience, gradeId, sectionId, publishDate, expiryDate, attachment, status: computed, author, createdAt: nowIso().slice(0, 16) }],
            },
          }));
          audit(id ? 'Saved notice draft' : 'Created notice', 'Notice', nid);
          if (!id) toast('Notice created', 'success');
          return nid;
        },
        publishNotice: (noticeId) => {
          set((st) => ({
            data: { ...st.data, notices: st.data.notices.map((n) => (n.id === noticeId ? { ...n, status: 'published' as const, publishedAt: nowIso().slice(0, 16), publishDate: st.schoolDate } : n)) },
          }));
          audit('Published notice', 'Notice', noticeId);
          toast('Notice published', 'success', 'Parents and teachers can now see it in their apps.');
        },
        expireNotice: (noticeId) => {
          set((st) => ({ data: { ...st.data, notices: st.data.notices.map((n) => (n.id === noticeId ? { ...n, status: 'expired' as const } : n)) } }));
          audit('Expired notice', 'Notice', noticeId);
          toast('Notice expired', 'info');
        },
        duplicateNotice: (noticeId) => {
          const st = get();
          const n = st.data.notices.find((x) => x.id === noticeId);
          if (!n) return '';
          const id = uid('not');
          set((s2) => ({
            data: {
              ...s2.data,
              notices: [...s2.data.notices, { ...n, id, title: `${n.title} (copy)`, status: 'draft', author: s2.session.userName, createdAt: nowIso().slice(0, 16), publishedAt: undefined }],
            },
          }));
          toast('Notice duplicated as draft', 'success');
          return id;
        },
        markNoticeRead: (noticeId) => {
          set((st) => ({ readNotices: { ...st.readNotices, [noticeId]: true } }));
        },

        /* ── ops ── */
        createExport: (type, requestedBy) => {
          const st = get();
          const id = uid('exp');
          const expires = new Date(Date.now() + st.settings.exportRetentionDays * 86400000).toISOString().slice(0, 10);
          set((s2) => ({
            data: {
              ...s2.data,
              exports: [{ id, type, requestedBy, requestedAt: nowIso().slice(0, 16), status: 'running', expiresAt: expires }, ...s2.data.exports],
            },
          }));
          audit('Created export', 'Export', id);
          toast('Export queued', 'info', `${type} is being generated.`);
          setTimeout(() => {
            const s3 = get();
            const columns = ['Admission number', 'Student', 'Grade-Section', 'Value'];
            let rows: string[][] = [];
            if (type.toLowerCase().includes('dues')) {
              rows = s3.data.students.filter((s) => s.status === 'active').slice(0, 40).map((s) => {
                const due = s3.data.charges.filter((c) => c.studentId === s.id);
                const unpaid = due.reduce((t, c) => t + Math.max(0, c.amount - chargePaid(s3.data, c.id)), 0);
                return [s.admNo, s.displayName, '—', String(unpaid)];
              });
            } else if (type.toLowerCase().includes('collection')) {
              rows = s3.data.payments.slice(0, 40).map((p) => [p.id, p.date, p.mode, String(p.amount)]);
            } else {
              rows = s3.data.students.slice(0, 40).map((s) => [s.admNo, s.displayName, '—', s.status]);
            }
            set((s4) => ({
              data: { ...s4.data, exports: s4.data.exports.map((e) => (e.id === id ? { ...e, status: 'ready', rows, columns } : e)) },
            }));
          }, 2500);
        },
        deleteExport: (exportId) => {
          set((st) => ({ data: { ...st.data, exports: st.data.exports.filter((e) => e.id !== exportId) } }));
          toast('Expired copy deleted', 'info');
        },
        createOfficeTask: ({ studentId, note, from }) => {
          set((st) => ({
            data: { ...st.data, officeTasks: [{ id: uid('ot'), from, studentId, note, at: nowIso().slice(0, 16), status: 'open' }, ...st.data.officeTasks] },
          }));
          toast('Office task created', 'success', 'The school office will review your report.');
        },
        resolveOfficeTask: (taskId) => {
          set((st) => ({ data: { ...st.data, officeTasks: st.data.officeTasks.map((t) => (t.id === taskId ? { ...t, status: 'resolved' as const } : t)) } }));
        },
        markAlertReviewed: (alertId) => {
          set((st) => ({ reviewedAlerts: st.reviewedAlerts.includes(alertId) ? st.reviewedAlerts : [...st.reviewedAlerts, alertId] }));
          toast('Marked reviewed', 'success');
        },

        addAuditEvent: (action, resource, resourceId, result = 'success') => audit(action, resource, resourceId, result),

        /* ── settings & theme ── */
        updateSettings: (patch) => {
          set((st) => ({ settings: { ...st.settings, ...patch } }));
          audit('Updated settings', 'Settings', Object.keys(patch).join(','));
          toast('Settings saved', 'success');
        },
        upsertFeePlan: (input) => {
          const id = input.id ?? uid('plan');
          set((st) => ({
            data: {
              ...st.data,
              feePlans: st.data.feePlans.some((p) => p.id === id)
                ? st.data.feePlans.map((p) => (p.id === id ? { ...p, ...input } : p))
                : [...st.data.feePlans, { ...input, id }],
            },
          }));
          audit('Saved fee plan', 'Fee plan', id);
          toast('Fee plan saved', 'success', input.status === 'draft' ? 'Saved as draft.' : undefined);
          return id;
        },
        addGrade: (name) => {
          set((st) => ({
            data: { ...st.data, grades: [...st.data.grades, { id: uid('g'), name, order: st.data.grades.length + 1, status: 'active' }] },
          }));
          audit('Added grade', 'Grade', name);
          toast('Grade added', 'success');
        },
        archiveGrade: (gradeId) => {
          set((st) => ({ data: { ...st.data, grades: st.data.grades.map((g) => (g.id === gradeId ? { ...g, status: 'archived' as const } : g)) } }));
          audit('Archived grade', 'Grade', gradeId);
          toast('Grade archived', 'info');
        },
        addSection: (input) => {
          set((st) => ({
            data: { ...st.data, sections: [...st.data.sections, { id: uid('s'), ayId: st.ayId, status: 'active' as const, ...input }] },
          }));
          audit('Added section', 'Section', input.name);
          toast('Section added', 'success');
        },
        updateSection: (sectionId, patch) => {
          set((st) => ({ data: { ...st.data, sections: st.data.sections.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)) } }));
          audit('Updated section', 'Section', sectionId);
        },
        archiveSection: (sectionId) => {
          set((st) => ({ data: { ...st.data, sections: st.data.sections.map((s) => (s.id === sectionId ? { ...s, status: 'archived' as const } : s)) } }));
          audit('Archived section', 'Section', sectionId);
          toast('Section archived', 'info');
        },
        addHoliday: (input) => {
          set((st) => ({ data: { ...st.data, holidays: [...st.data.holidays, { id: uid('hol'), ...input }] } }));
          audit('Updated calendar', 'Holiday', input.date);
          toast('Calendar updated', 'success');
        },
        activateYear: (ayId) => {
          set((st) => ({
            data: {
              ...st.data,
              academicYears: st.data.academicYears.map((a) => (a.id === ayId ? { ...a, status: 'active' as const } : a.status === 'active' ? { ...a, status: 'closed' as const } : a)),
            },
          }));
          set({ ayId });
          audit('Activated academic year', 'Academic year', ayId);
          toast('Academic year activated', 'success');
        },
        closeYear: (ayId) => {
          set((st) => ({ data: { ...st.data, academicYears: st.data.academicYears.map((a) => (a.id === ayId ? { ...a, status: 'closed' as const } : a)) } }));
          audit('Closed academic year', 'Academic year', ayId);
          toast('Academic year closed', 'info');
        },
        updateTheme: (patch) => {
          const theme = { ...get().theme, ...patch };
          set({ theme });
          applyThemeVars(theme);
        },
        resetDemo: () => {
          try {
            localStorage.removeItem('school-erp-proto-v1');
          } catch {
            /* noop */
          }
          set({
            session: { signedIn: false, role: 'school_admin', userName: 'Sunita Deshpande' },
            route: { screen: 'A01', params: {} },
            schoolDate: SCHOOL_DATE_DEFAULT,
            ayId: IDS.ay2627,
            data: buildSeedData(),
            readNotices: {},
            reviewedAlerts: [],
            visited: [],
            toasts: [],
            dialog: null,
          });
          applyThemeVars(get().theme);
          location.reload();
        },
      };
    },
    {
      name: 'school-erp-proto-v1',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (st) => ({
        session: st.session,
        route: st.route,
        schoolDate: st.schoolDate,
        ayId: st.ayId,
        campusId: st.campusId,
        sidebarCollapsed: st.sidebarCollapsed,
        readNotices: st.readNotices,
        reviewedAlerts: st.reviewedAlerts,
        visited: st.visited,
        theme: st.theme,
        settings: st.settings,
        data: st.data,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.booted = true;
          applyThemeVars(state.theme);
          setTimeout(() => {
            useErp.setState({ booted: true });
          }, 0);
        }
      },
    },
  ),
);

/** Convenience selector */
export const useData = () => useErp((s) => s.data);
