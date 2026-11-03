import type {
  AttendanceRegister, Charge, CorrectionRequest, DayClose, Enrollment, ErpData, ExportJob,
  FeePlan, FeeRequest, Guardian, Holiday, ImportBatch, ImportRow, MarkCode, Notice, Payment,
  PaymentMode, Receipt, Section, StaffAssignment, StaffMember, Student,
} from './types';
import { mulberry32 } from './utils';

export const SCHOOL_DATE_DEFAULT = '2026-07-21';
export const AY_DEFAULT = 'ay-2026-27';

export const IDS = {
  ananya: 'stu-ananya',
  farah: 'stf-farah',
  meera: 'stf-meera',
  sunita: 'stf-sunita',
  amit: 'stf-amit',
  priya: 'stf-priya',
  rajeshGuardian: 'grd-rajesh',
  snehaGuardian: 'grd-sneha',
  section7A: 's-7a',
  ay2627: 'ay-2026-27',
  ay2526: 'ay-2025-26',
  campusMain: 'main',
  plan2627: 'plan-2026',
} as const;

export const SESSION_USERS: Record<string, { name: string; staffId?: string }> = {
  platform_operator: { name: 'Platform Operations' },
  school_admin: { name: 'Sunita Deshpande', staffId: 'stf-sunita' },
  principal: { name: 'Meera Kulkarni', staffId: 'stf-meera' },
  accountant: { name: 'Amit Joshi', staffId: 'stf-amit' },
  receptionist: { name: 'Priya Nair', staffId: 'stf-priya' },
  teacher: { name: 'Farah Khan', staffId: 'stf-farah' },
  parent: { name: 'Rajesh Patil' },
};

const FEMALE = ['Ananya','Aarohi','Diya','Isha','Ishita','Kavya','Myra','Navya','Pari','Riya','Saanvi','Sara','Shanaya','Siya','Tanvi','Vaishnavi','Zara','Aditi','Ayesha','Gauri','Janhvi','Ketaki','Manasi','Mrunmayi','Nisha','Oviya','Prachi','Radhika','Rhea','Sanika','Shreya','Suhani','Trupti','Urvi','Veda','Aarya','Charvi','Devika','Esha','Kiara','Lavanya','Mira','Nitya','Prisha','Rani','Sai','Tara','Vaidehi'];
const MALE = ['Aarav','Advait','Agastya','Arjun','Aryan','Atharv','Ayaan','Dev','Dhruv','Ishaan','Kabir','Krishna','Mihir','Neel','Om','Parth','Pranav','Reyansh','Rohan','Rudra','Samar','Shaan','Shlok','Vihaan','Vivaan','Yash','Aditya','Akash','Aniket','Ansh','Chinmay','Gaurav','Jay','Kartik','Madhav','Nilesh','Ojas','Prathamesh','Rajveer','Rohit','Sagar','Siddharth','Tanmay','Uday','Varad','Vedant','Vikrant','Zaid'];
const SUR = ['Patil','Deshmukh','Kulkarni','Joshi','Sharma','Khan','Pawar','Jadhav','Kadam','Shinde','Bhosale','More','Salunkhe','Wagh','Thorat','Chavan','Nair','Menon','Iyer','Pillai','Rao','Reddy','Gupta','Agarwal','Mehta','Shah','Singh','Verma','Tiwari','Mishra','Yadav','Kamble','Gaikwad','Rane','Naik','Sawant','Bhoir','Mhatre','Date','Dixit','Bapat','Ranade','Gokhale','Sathe'];

const SECTION_COUNTS: Record<number, number> = { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3, 7: 4, 8: 3, 9: 3, 10: 3 };
const NEW_ADMITS = [120, 205, 240, 300, 310, 355, 390, 425, 460, 495, 530, 560, 590, 610, 625];
const TODAY_PAYERS = [
  { idx: 100, amount: 28300, mode: 'UPI' as PaymentMode },
  { idx: 150, amount: 13700, mode: 'Cash' as PaymentMode },
  { idx: 300, amount: 33300, mode: 'UPI' as PaymentMode },
  { idx: 450, amount: 28300, mode: 'UPI' as PaymentMode },
  { idx: 500, amount: 20900, mode: 'Bank transfer' as PaymentMode },
];

function pad(n: number, w = 4): string {
  return String(n).padStart(w, '0');
}
function refFor(mode: PaymentMode, r: () => number): string | undefined {
  if (mode === 'UPI') return `UPI/${pad(Math.floor(r() * 899999) + 100000, 6)}`;
  if (mode === 'Bank transfer') return `NEFT/AV${pad(Math.floor(r() * 8999) + 1000, 4)}`;
  if (mode === 'Cheque') return `CHQ/00${pad(Math.floor(r() * 899) + 100, 3)}`;
  return undefined;
}

/** Allocate amount across unpaid charges, oldest due first. */
export function allocateCharges(
  open: { id: string; amount: number; dueDate: string }[],
  amount: number,
): { chargeId: string; amount: number }[] {
  const sorted = [...open].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  let left = amount;
  const out: { chargeId: string; amount: number }[] = [];
  for (const c of sorted) {
    if (left <= 0) break;
    const pay = Math.min(left, c.amount);
    if (pay > 0) out.push({ chargeId: c.id, amount: pay });
    left -= pay;
  }
  return out;
}

export function buildSeedData(): ErpData {
  const r = mulberry32(20260721);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(r() * arr.length)];

  const grades = Array.from({ length: 10 }, (_, i) => ({
    id: `g${i + 1}`, name: `Grade ${i + 1}`, order: i + 1, status: 'active' as const,
  }));

  const sections: Section[] = [];
  for (let g = 1; g <= 10; g++) {
    for (let s = 0; s < SECTION_COUNTS[g]; s++) {
      sections.push({
        id: `s-${g}${String.fromCharCode(97 + s)}`,
        ayId: IDS.ay2627, gradeId: `g${g}`, name: String.fromCharCode(65 + s),
        capacity: 40, status: 'active',
      });
    }
  }

  /* ── Staff ── */
  const staff: StaffMember[] = [
    { id: IDS.meera, code: 'STF-001', name: 'Meera Kulkarni', role: 'Principal', mobile: '+91 98220 11001', email: 'meera.kulkarni@sunrisepublic.edu.in', startDate: '2015-06-01', status: 'active', lastSignIn: '2026-07-21T07:42' },
    { id: IDS.sunita, code: 'STF-002', name: 'Sunita Deshpande', role: 'Admin Officer', mobile: '+91 98220 11002', email: 'sunita.deshpande@sunrisepublic.edu.in', startDate: '2016-04-11', status: 'active', lastSignIn: '2026-07-21T07:31' },
    { id: IDS.amit, code: 'STF-003', name: 'Amit Joshi', role: 'Accountant', mobile: '+91 98220 11003', email: 'amit.joshi@sunrisepublic.edu.in', startDate: '2018-06-04', status: 'active', lastSignIn: '2026-07-21T08:05' },
    { id: IDS.priya, code: 'STF-004', name: 'Priya Nair', role: 'Receptionist', mobile: '+91 98220 11004', email: 'priya.nair@sunrisepublic.edu.in', startDate: '2021-06-15', status: 'active', lastSignIn: '2026-07-21T07:58' },
    { id: 'stf-vikram', code: 'STF-005', name: 'Vikram Rao', role: 'Coordinator', mobile: '+91 98220 11005', email: 'vikram.rao@sunrisepublic.edu.in', startDate: '2019-06-10', status: 'active', lastSignIn: '2026-07-20T16:12' },
    { id: IDS.farah, code: 'STF-006', name: 'Farah Khan', role: 'Class Teacher', mobile: '+91 98220 11006', email: 'farah.khan@sunrisepublic.edu.in', startDate: '2020-06-01', status: 'active', lastSignIn: '2026-07-21T07:50' },
  ];
  const teacherFirst = FEMALE.concat(MALE);
  const teacherPool: StaffMember[] = [];
  for (let i = 7; i <= 42; i++) {
    const name = `${teacherFirst[(i * 7) % teacherFirst.length]} ${SUR[(i * 11) % SUR.length]}`;
    teacherPool.push({
      id: `stf-t${i}`, code: `STF-${pad(i, 3)}`, name,
      role: i <= 36 ? 'Class Teacher' : 'Subject Teacher',
      mobile: `+91 98220 ${pad(11000 + i, 5)}`,
      email: `${name.toLowerCase().replace(/ /g, '.')}@sunrisepublic.edu.in`,
      startDate: `${2019 + (i % 6)}-06-${pad((i % 20) + 1, 2)}`,
      status: 'active',
      lastSignIn: i % 3 === 0 ? `2026-07-${pad(15 + (i % 6), 2)}T08:${pad(i % 50, 2)}` : '2026-07-21T08:12',
    });
  }
  staff.push(...teacherPool);

  const assignments: StaffAssignment[] = [];
  for (const st of staff) {
    assignments.push({ id: `asg-${st.id}`, staffId: st.id, ayId: IDS.ay2627, type: st.role === 'Class Teacher' ? 'Class Teacher' : 'Subject Teacher', start: st.startDate });
  }
  // Class teachers: Farah → 7-A; pool t7..t36 → remaining 30 sections
  const orderedSections = [...sections];
  let poolIdx = 7;
  for (const sec of orderedSections) {
    if (sec.id === IDS.section7A) {
      sec.classTeacherId = IDS.farah;
      assignments.push({ id: `asg-ct-${sec.id}`, staffId: IDS.farah, ayId: IDS.ay2627, gradeId: sec.gradeId, sectionId: sec.id, type: 'Class Teacher', start: '2026-04-01' });
    } else {
      const t = teacherPool.find((t) => t.id === `stf-t${poolIdx}`);
      poolIdx += 1;
      if (t) {
        sec.classTeacherId = t.id;
        assignments.push({ id: `asg-ct-${sec.id}`, staffId: t.id, ayId: IDS.ay2627, gradeId: sec.gradeId, sectionId: sec.id, type: 'Class Teacher', start: '2026-04-01' });
      }
    }
  }
  assignments.push({ id: 'asg-farah-7b', staffId: IDS.farah, ayId: IDS.ay2627, gradeId: 'g7', sectionId: 's-7b', type: 'Subject Teacher', start: '2026-04-01' });
  assignments.push({ id: 'asg-farah-8a', staffId: IDS.farah, ayId: IDS.ay2627, gradeId: 'g8', sectionId: 's-8a', type: 'Subject Teacher', start: '2026-04-01' });
  assignments.push({ id: 'asg-sub-9a', staffId: 'stf-t40', ayId: IDS.ay2627, gradeId: 'g9', sectionId: 's-9a', type: 'Substitute', start: '2026-07-20', end: '2026-07-31' });

  /* ── Students, guardians, enrollments ── */
  const students: Student[] = [];
  const guardians: Guardian[] = [];
  const enrollments: Enrollment[] = [];
  const charges: Charge[] = [];
  const payments: Payment[] = [];
  const receipts: Receipt[] = [];

  let admSeq = 1;
  let grSeq = 4100;
  let receiptSeq = 1;
  let stuIdx = 0;
  let paySeq = 1;

  const nextAdm = (): string => {
    admSeq += 1;
    if (admSeq === 142) admSeq += 1;
    return `ADM-2026-${pad(admSeq)}`;
  };
  const nextGr = (): string => {
    grSeq += 1;
    if (grSeq === 4521) grSeq += 1;
    return String(grSeq);
  };
  const nextReceiptNo = (): string => {
    receiptSeq += 1;
    if (receiptSeq === 482) receiptSeq += 1;
    return `RCPT/2026/${pad(receiptSeq, 5)}`;
  };
  let ananyaReceiptId = '';

  const extraSections = ['s-1a', 's-1b', 's-1c', 's-2a'];

  for (const sec of orderedSections) {
    const gradeNum = Number(sec.gradeId.slice(1));
    let count = 20;
    if (sec.id === IDS.section7A) count = 24;
    else if (extraSections.includes(sec.id)) count = 21;

    for (let roll = 1; roll <= count; roll++) {
      const isAnanya = sec.id === IDS.section7A && roll === 14;
      const gender: 'Female' | 'Male' = r() < 0.5 ? 'Female' : 'Male';
      const first = isAnanya ? 'Ananya' : pick(gender === 'Female' ? FEMALE : MALE);
      const last = isAnanya ? 'Patil' : pick(SUR);
      const id = isAnanya ? IDS.ananya : `stu-${pad(stuIdx + 1)}`;
      const birthYear = 2026 - (5 + gradeNum);
      const admNo = isAnanya ? 'ADM-2026-0142' : nextAdm();
      const grNo = isAnanya ? '4521' : nextGr();
      const admissionDate = isAnanya
        ? '2020-06-08'
        : NEW_ADMITS.includes(stuIdx)
          ? `2026-06-${pad(3 + (stuIdx % 12))}`
          : `${2026 - (gradeNum - 1) - (stuIdx % 3)}-06-${pad((stuIdx % 25) + 3)}`;

      students.push({
        id, admNo, grNo,
        firstName: first,
        middleName: !isAnanya && r() < 0.3 ? pick(FEMALE.concat(MALE)) : undefined,
        lastName: last,
        displayName: `${first} ${last}`,
        dob: isAnanya ? '2013-11-19' : `${birthYear}-${pad(Math.floor(r() * 12) + 1, 2)}-${pad(Math.floor(r() * 27) + 1, 2)}`,
        gender,
        admissionDate,
        status: 'active',
      });

      const fatherName = isAnanya ? 'Rajesh Patil' : `${pick(MALE)} ${last}`;
      const motherName = isAnanya ? 'Sneha Patil' : `${pick(FEMALE)} ${last}`;
      guardians.push({
        id: isAnanya ? IDS.rajeshGuardian : `grd-${id}-f`,
        studentId: id, name: fatherName, relationship: 'Father',
        mobile: isAnanya ? '+91 98220 44321' : `+91 9${pad(Math.floor(r() * 89999) + 10000, 5)} ${pad(Math.floor(r() * 89999) + 10000, 5)}`,
        email: isAnanya ? 'rajesh.patil@example.com' : `${fatherName.toLowerCase().replace(/ /g, '.')}@example.com`,
        communicationAllowed: true,
        appAccess: isAnanya || r() < 0.62,
        verified: isAnanya || r() < 0.9,
        invitedAt: isAnanya ? '2026-04-05T10:20' : r() < 0.62 ? '2026-04-06T09:30' : undefined,
      });
      if (isAnanya || r() < 0.35) {
        guardians.push({
          id: isAnanya ? IDS.snehaGuardian : `grd-${id}-m`,
          studentId: id, name: motherName, relationship: 'Mother',
          mobile: `+91 9${pad(Math.floor(r() * 89999) + 10000, 5)} ${pad(Math.floor(r() * 89999) + 10000, 5)}`,
          communicationAllowed: true,
          appAccess: isAnanya ? true : r() < 0.5,
          verified: isAnanya || r() < 0.85,
        });
      }

      enrollments.push({
        id: `enr-${id}`, studentId: id, ayId: IDS.ay2627, sectionId: sec.id,
        rollNo: roll, start: admissionDate > '2026-04-01' ? admissionDate : '2026-04-01',
        status: 'active',
      });

      /* Fee charges: 3 installments (+ admission fee for new admits) */
      const planId = IDS.plan2627;
      const inst: [string, string, number, string][] = [
        ['inst-t1', 'Term 1', 28300, '2026-04-10'],
        ['inst-t2', 'Term 2', 28300, '2026-07-10'],
        ['inst-t3', 'Term 3', 28300, '2026-10-10'],
      ];
      for (const [instId, instName, amount, dueDate] of inst) {
        charges.push({
          id: `chg-${id}-${instId}`, studentId: id, ayId: IDS.ay2627, planId,
          installmentId: instId, head: `Annual fee — ${instName}`, amount,
          date: '2026-04-01', dueDate, status: 'posted',
        });
      }
      if (NEW_ADMITS.includes(stuIdx)) {
        charges.push({
          id: `chg-${id}-adm`, studentId: id, ayId: IDS.ay2627, planId,
          head: 'Admission fee', amount: 5000, date: admissionDate,
          dueDate: '2026-07-01', status: 'posted',
        });
      }

      stuIdx += 1;
    }
  }

  // Withdrawn students (extra records; active count stays 628)
  for (const [i, w] of ['Pruthviraj Chavan', 'Sharvari Wagh'].entries()) {
    const id = `stu-w${i + 1}`;
    students.push({
      id, admNo: `ADM-2026-${pad(631 + i)}`, grNo: String(4531 + i),
      firstName: w.split(' ')[0], lastName: w.split(' ')[1], displayName: w,
      dob: `2011-0${3 + i}-1${4 + i}`, gender: i === 0 ? 'Male' : 'Female',
      admissionDate: '2026-04-01', status: 'withdrawn',
    });
    enrollments.push({ id: `enr-${id}`, studentId: id, ayId: IDS.ay2627, sectionId: 's-9a', rollNo: 25 + i, start: '2026-04-01', end: '2026-05-20', status: 'withdrawn', reason: 'Family relocation to Nagpur' });
  }

  /* Enrollment history extras */
  enrollments.push({ id: 'enr-ananya-2526', studentId: IDS.ananya, ayId: IDS.ay2526, sectionId: 's-6b', rollNo: 21, start: '2025-04-01', end: '2026-03-31', status: 'promoted', reason: 'Promoted to Grade 7' });
  enrollments.push({ id: 'enr-hist-60-old', studentId: 'stu-0060', ayId: IDS.ay2627, sectionId: 's-3a', rollNo: 11, start: '2026-04-01', end: '2026-06-10', status: 'transferred', reason: 'Parent request — sibling alignment' });
  enrollments.push({ id: 'enr-hist-60-new', studentId: 'stu-0060', ayId: IDS.ay2627, sectionId: 's-3b', rollNo: 21, start: '2026-06-11', status: 'active' });

  /* ── Payments & receipts ── */
  const chargeFor = (studentId: string, instId: string) =>
    charges.find((c) => c.studentId === studentId && c.installmentId === instId)!;

  const defaulters = new Set<string>();
  let seen = 0;
  let ruleCount = 0;
  const ruleIdx: number[] = [];
  students.forEach((s, i) => {
    if (i % 25 === 17) ruleIdx.push(i);
  });
  const studentsInOrder = students.filter((s) => s.status === 'active');
  // 25 rule-picked defaulters; replace the last with Ananya; first becomes partial payer
  const partialPayerId = studentsInOrder[ruleIdx[0]].id;
  ruleIdx.pop();
  for (const i of ruleIdx) defaulters.add(studentsInOrder[i].id);
  defaulters.add(IDS.ananya);

  for (const s of studentsInOrder) {
    const isDefaulter = defaulters.has(s.id);
    const isPartial = s.id === partialPayerId;
    // Term 1 — everyone paid
    const c1 = chargeFor(s.id, 'inst-t1');
    const d1 = `2026-04-${pad(Math.floor(r() * 8) + 3)}`;
    const m1: PaymentMode = r() < 0.42 ? 'UPI' : r() < 0.72 ? 'Cash' : r() < 0.9 ? 'Bank transfer' : 'Cheque';
    const payId1 = `pay-${pad(paySeq++, 5)}`;
    payments.push({ id: payId1, studentId: s.id, date: d1, amount: 28300, mode: m1, reference: refFor(m1, r), collectedBy: 'Amit Joshi', allocations: [{ chargeId: c1.id, amount: 28300 }], status: 'posted' });
    const rc1: Receipt = { id: `rcp-${s.id}-t1`, no: s.id === IDS.ananya ? 'RCPT/2026/00482' : nextReceiptNo(), paymentId: payId1, studentId: s.id, date: d1, amount: 28300, mode: m1, collectedBy: 'Amit Joshi' };
    if (s.id === IDS.ananya) ananyaReceiptId = rc1.id;
    receipts.push(rc1);

    if (!isDefaulter) {
      const c2 = chargeFor(s.id, 'inst-t2');
      const d2 = `2026-0${r() < 0.5 ? 6 : 7}-${pad(Math.floor(r() * (r() < 0.5 ? 30 : 9)) + 1)}`;
      const m2: PaymentMode = r() < 0.42 ? 'UPI' : r() < 0.72 ? 'Cash' : r() < 0.9 ? 'Bank transfer' : 'Cheque';
      const payId2 = `pay-${pad(paySeq++, 5)}`;
      payments.push({ id: payId2, studentId: s.id, date: d2, amount: 28300, mode: m2, reference: refFor(m2, r), collectedBy: 'Amit Joshi', allocations: [{ chargeId: c2.id, amount: 28300 }], status: 'posted' });
      receipts.push({ id: `rcp-${s.id}-t2`, no: nextReceiptNo(), paymentId: payId2, studentId: s.id, date: d2, amount: 28300, mode: m2, collectedBy: 'Amit Joshi' });
    } else if (isPartial) {
      const c2 = chargeFor(s.id, 'inst-t2');
      payments.push({ id: `pay-${pad(paySeq++, 5)}`, studentId: s.id, date: '2026-07-05', amount: 25500, mode: 'Cash', collectedBy: 'Amit Joshi', allocations: [{ chargeId: c2.id, amount: 25500 }], status: 'posted' });
      receipts.push({ id: `rcp-${s.id}-t2p`, no: nextReceiptNo(), paymentId: `pay-${pad(paySeq - 1, 5)}`, studentId: s.id, date: '2026-07-05', amount: 25500, mode: 'Cash', collectedBy: 'Amit Joshi' });
    }
    // New admits paid admission fee at admission (except stu idx 300 who pays today)
    if (NEW_ADMITS.includes(students.indexOf(s)) && s.id !== 'stu-0300') {
      const ca = charges.find((c) => c.studentId === s.id && c.head === 'Admission fee');
      if (ca) {
        payments.push({ id: `pay-${pad(paySeq++, 5)}`, studentId: s.id, date: s.admissionDate, amount: 5000, mode: 'Cash', collectedBy: 'Priya Nair', allocations: [{ chargeId: ca.id, amount: 5000 }], status: 'posted' });
        receipts.push({ id: `rcp-${s.id}-adm`, no: nextReceiptNo(), paymentId: `pay-${pad(paySeq - 1, 5)}`, studentId: s.id, date: s.admissionDate, amount: 5000, mode: 'Cash', collectedBy: 'Priya Nair' });
      }
    }
  }

  /* Today's five payments — ₹1,24,500 total, ₹42,000 cash */
  for (const tp of TODAY_PAYERS) {
    const s = studentsInOrder[tp.idx];
    const open = charges
      .filter((c) => c.studentId === s.id && c.status === 'posted')
      .filter((c) => {
        const paid = payments.filter((p) => p.studentId === s.id && p.status === 'posted')
          .flatMap((p) => p.allocations).filter((a) => a.chargeId === c.id)
          .reduce((t, a) => t + a.amount, 0);
        return paid < c.amount;
      })
      .map((c) => ({ id: c.id, amount: c.amount - payments.filter((p) => p.studentId === s.id).flatMap((p) => p.allocations).filter((a) => a.chargeId === c.id).reduce((t, a) => t + a.amount, 0), dueDate: c.dueDate }));
    const allocations = allocateCharges(open, tp.amount);
    const payId = `pay-${pad(paySeq++, 5)}`;
    payments.push({ id: payId, studentId: s.id, date: SCHOOL_DATE_DEFAULT, amount: tp.amount, mode: tp.mode, reference: refFor(tp.mode, r), collectedBy: 'Amit Joshi', allocations, status: 'posted' });
    receipts.push({ id: `rcp-today-${s.id}`, no: nextReceiptNo(), paymentId: payId, studentId: s.id, date: SCHOOL_DATE_DEFAULT, amount: tp.amount, mode: tp.mode, collectedBy: 'Amit Joshi' });
  }

  /* ── Fee plans ── */
  const feePlans: FeePlan[] = [
    {
      id: IDS.plan2627, name: 'Annual Fee Plan 2026-27', ayId: IDS.ay2627, appliesTo: 'all',
      heads: [
        { head: 'Tuition fee', amount: 64900 },
        { head: 'Development fee', amount: 12000 },
        { head: 'Activity fee', amount: 8000 },
      ],
      installments: [
        { id: 'inst-t1', name: 'Term 1', amount: 28300, dueDate: '2026-04-10', sequence: 1 },
        { id: 'inst-t2', name: 'Term 2', amount: 28300, dueDate: '2026-07-10', sequence: 2 },
        { id: 'inst-t3', name: 'Term 3', amount: 28300, dueDate: '2026-10-10', sequence: 3 },
      ],
      partialAllowed: true, status: 'active',
    },
    {
      id: 'plan-2025', name: 'Annual Fee Plan 2025-26', ayId: IDS.ay2526, appliesTo: 'all',
      heads: [
        { head: 'Tuition fee', amount: 58900 },
        { head: 'Development fee', amount: 11000 },
        { head: 'Activity fee', amount: 7000 },
      ],
      installments: [
        { id: 'inst25-1', name: 'Term 1', amount: 25633, dueDate: '2025-04-10', sequence: 1 },
        { id: 'inst25-2', name: 'Term 2', amount: 25633, dueDate: '2025-07-10', sequence: 2 },
        { id: 'inst25-3', name: 'Term 3', amount: 25634, dueDate: '2025-10-10', sequence: 3 },
      ],
      partialAllowed: true, status: 'archived',
    },
  ];

  /* ── Attendance ── */
  const registers: AttendanceRegister[] = [];
  const dates: string[] = [];
  for (const d of ['2026-06-22','2026-06-23','2026-06-24','2026-06-25','2026-06-26','2026-06-29','2026-06-30',
    '2026-07-01','2026-07-02','2026-07-03','2026-07-06','2026-07-07','2026-07-08','2026-07-09','2026-07-10',
    '2026-07-13','2026-07-14','2026-07-15','2026-07-16','2026-07-17','2026-07-20','2026-07-21']) dates.push(d);
  const UNMARKED_TODAY = new Set([IDS.section7A, 's-8c', 's-9b', 's-10a']);
  const LEAVE_REASONS = ['Fever', 'Family function', 'Medical check-up', 'Out of town'];

  for (const date of dates) {
    for (const sec of sections) {
      const roster = enrollments
        .filter((e) => e.sectionId === sec.id && e.ayId === IDS.ay2627 && e.status === 'active')
        .map((e) => ({ e, s: students.find((s) => s.id === e.studentId)! }))
        .filter((x) => x.s && x.s.status === 'active')
        .sort((a, b) => a.e.rollNo - b.e.rollNo);
      if (roster.length === 0) continue;

      const isToday = date === SCHOOL_DATE_DEFAULT;
      const unmarked = isToday && UNMARKED_TODAY.has(sec.id);
      const marks: Record<string, MarkCode> = {};
      const reasons: Record<string, string> = {};
      if (!unmarked) {
        const rng = mulberry32(
          date.split('-').join('') .slice(4) !== ''
            ? Number(date.split('-').join('')) + sec.id.split('').reduce((t, c) => t + c.charCodeAt(0), 0)
            : 1,
        );
        for (const { e } of roster) {
          const v = rng();
          if (v < 0.05) {
            marks[e.studentId] = 'A';
            if (rng() < 0.4) reasons[e.studentId] = 'Not reported';
          } else if (v < 0.062) {
            marks[e.studentId] = 'L';
            reasons[e.studentId] = LEAVE_REASONS[Math.floor(rng() * LEAVE_REASONS.length)];
          } else {
            marks[e.studentId] = 'P';
          }
        }
      }
      const ct = staff.find((st) => st.id === sec.classTeacherId);
      registers.push({
        id: `reg-${date}-${sec.id}`, date, sectionId: sec.id,
        marks, reasons,
        status: unmarked ? 'unmarked' : 'submitted',
        submittedAt: unmarked ? undefined : `${date}T0${8 + Math.floor(r() * 2)}:${pad(Math.floor(r() * 50) + 5, 2)}`,
        submittedBy: unmarked ? undefined : ct?.name,
        revision: 1,
      });
    }
  }

  /* Post-pass: pin today's attendance completion to exactly 93.8% */
  {
    const todayRegs = registers.filter((rg) => rg.date === SCHOOL_DATE_DEFAULT && rg.status === 'submitted');
    const flat: { reg: AttendanceRegister; sid: string }[] = [];
    for (const rg of todayRegs) for (const sid of Object.keys(rg.marks)) flat.push({ reg: rg, sid });
    let presentCount = flat.filter((x) => x.reg.marks[x.sid] === 'P').length;
    const targetPresent = Math.round(0.938 * flat.length);
    for (const x of flat) {
      if (presentCount === targetPresent) break;
      const m = x.reg.marks[x.sid];
      if (presentCount < targetPresent && m === 'A') { x.reg.marks[x.sid] = 'P'; delete x.reg.reasons[x.sid]; presentCount += 1; }
      else if (presentCount > targetPresent && m === 'P') { x.reg.marks[x.sid] = 'A'; x.reg.reasons[x.sid] = 'Not reported'; presentCount -= 1; }
    }
  }

  /* ── Correction requests ── */
  const teacherNameFor = (sectionId: string): string => {
    const sec = sections.find((x) => x.id === sectionId);
    return staff.find((st) => st.id === sec?.classTeacherId)?.name ?? 'Class teacher';
  };
  const corrections: CorrectionRequest[] = [
    { id: 'crq-001', no: 'CORR-0031', date: '2026-07-17', sectionId: 's-6a', studentId: 'stu-0185', from: 'A', to: 'P', reason: 'Reached at 9:05, marked absent by mistake — bus log confirms entry.', requestedBy: teacherNameFor('s-6a'), requestedAt: '2026-07-17T14:20', status: 'pending' },
    { id: 'crq-002', no: 'CORR-0032', date: '2026-07-16', sectionId: 's-8b', studentId: 'stu-0262', from: 'P', to: 'L', reason: 'Student left for dental appointment at 11 am; leave applied retroactively.', requestedBy: teacherNameFor('s-8b'), requestedAt: '2026-07-16T15:05', status: 'pending' },
    { id: 'crq-003', no: 'CORR-0029', date: '2026-07-10', sectionId: 's-5c', studentId: 'stu-0155', from: 'A', to: 'P', reason: 'Marked absent due to sync error; corrected register attached.', requestedBy: 'R. Bhosale', requestedAt: '2026-07-10T13:40', status: 'approved', reviewer: 'Sunita Deshpande', resolvedAt: '2026-07-10T17:02', resolutionNote: 'Verified with transport log.' },
    { id: 'crq-004', no: 'CORR-0027', date: '2026-07-08', sectionId: 's-9c', studentId: 'stu-0301', from: 'P', to: 'A', reason: 'Requested without evidence.', requestedBy: 'M. Jadhav', requestedAt: '2026-07-08T12:10', status: 'rejected', reviewer: 'Meera Kulkarni', resolvedAt: '2026-07-08T16:45', resolutionNote: 'No supporting evidence provided.' },
  ];

  /* ── Fee requests ── */
  const partialPayment = payments.find((p) => p.studentId === partialPayerId && p.amount === 25500)!;
  const feeRequests: FeeRequest[] = [
    { id: 'frq-001', type: 'reversal', paymentId: partialPayment.id, studentId: partialPayment.studentId, originalRef: receipts.find((rc) => rc.paymentId === partialPayment.id)?.no ?? '—', amount: 25500, reason: 'Parent paid cash twice for the same installment; second receipt to be reversed.', requestedBy: 'Amit Joshi', requestedAt: '2026-07-20T17:30', status: 'pending' },
    { id: 'frq-002', type: 'adjustment', chargeId: `chg-${'stu-0200'}-inst-t3`, studentId: 'stu-0200', originalRef: 'Annual fee — Term 3', amount: 3300, reason: 'Sibling concession of ₹3,300 approved by Principal for Term 3.', requestedBy: 'Amit Joshi', requestedAt: '2026-07-19T11:15', status: 'pending' },
    { id: 'frq-003', type: 'adjustment', chargeId: `chg-${'stu-0120'}-adm`, studentId: 'stu-0120', originalRef: 'Admission fee', amount: 5000, reason: 'Staff ward — admission fee waived.', requestedBy: 'Amit Joshi', requestedAt: '2026-07-08T10:00', status: 'approved', reviewer: 'Sunita Deshpande', resolvedAt: '2026-07-08T12:30' },
  ];

  /* ── Day close ── */
  const dayCloses: DayClose[] = [
    { id: 'dc-2026-07-20', date: '2026-07-20', cashExpected: 15000, cashCounted: 15000, upiVerified: 8000, bankVerified: 0, variance: 0, reviewer: 'Meera Kulkarni', status: 'closed' },
  ];
  // Two payments on 20 Jul to back the closed day
  const c20a = chargeFor(studentsInOrder[80].id, 'inst-t3');
  payments.push({ id: 'pay-0720a', studentId: studentsInOrder[80].id, date: '2026-07-20', amount: 15000, mode: 'Cash', collectedBy: 'Amit Joshi', allocations: [{ chargeId: c20a.id, amount: 15000 }], status: 'posted' });
  receipts.push({ id: 'rcp-0720a', no: nextReceiptNo(), paymentId: 'pay-0720a', studentId: studentsInOrder[80].id, date: '2026-07-20', amount: 15000, mode: 'Cash', collectedBy: 'Amit Joshi' });
  payments.push({ id: 'pay-0720b', studentId: studentsInOrder[210].id, date: '2026-07-20', amount: 8000, mode: 'UPI', reference: refFor('UPI', r), collectedBy: 'Amit Joshi', allocations: [{ chargeId: chargeFor(studentsInOrder[210].id, 'inst-t3').id, amount: 8000 }], status: 'posted' });
  receipts.push({ id: 'rcp-0720b', no: nextReceiptNo(), paymentId: 'pay-0720b', studentId: studentsInOrder[210].id, date: '2026-07-20', amount: 8000, mode: 'UPI', collectedBy: 'Amit Joshi' });

  /* ── Imports ── */
  const mkRow = (n: number, vals: Record<string, string>, result: ImportRow['result'], extra: Partial<ImportRow> = {}): ImportRow => ({ n, values: vals, result, ...extra });
  const imports: ImportBatch[] = [
    {
      id: 'imp-002', type: 'Students', ayId: IDS.ay2627, fileName: 'grade4_new_joinees_2026.csv',
      headerRow: true, duplicateStrategy: 'skip', uploadedAt: '2026-07-21T09:02', uploadedBy: 'Sunita Deshpande',
      status: 'ready', rows: Array.from({ length: 31 }, (_, i) => {
        const first = pick(r() < 0.5 ? FEMALE : MALE);
        const last = pick(SUR);
        const adm = `ADM-2026-${pad(700 + i)}`;
        const base = { 'Admission number': adm, 'First name': first, 'Last name': last, Grade: '4', Section: i % 3 === 0 ? 'A' : i % 3 === 1 ? 'B' : 'C', 'Date of birth': `2016-${pad((i % 12) + 1, 2)}-${pad((i % 27) + 1, 2)}`, 'Guardian name': `${pick(MALE)} ${last}`, 'Guardian mobile': `9${pad(Math.floor(r() * 899999999) + 100000000, 9)}` };
        if (i === 4) return mkRow(i + 1, base, 'conflict', { match: 'ADM-2026-0104 — Isha Deshmukh (Grade 4-B)' });
        if (i === 17) return mkRow(i + 1, base, 'conflict', { match: 'ADM-2026-0111 — Aarav Kulkarni (Grade 4-C)' });
        if (i === 25) return mkRow(i + 1, { ...base, 'Guardian mobile': '98220' }, 'rejected', { error: 'Guardian mobile must be 10 digits.' });
        return mkRow(i + 1, base, 'accepted');
      }),
    },
    {
      id: 'imp-001', type: 'Students', ayId: IDS.ay2627, fileName: 'bulk_upload_jun2026_v2.csv',
      headerRow: true, duplicateStrategy: 'skip', uploadedAt: '2026-07-19T10:12', uploadedBy: 'Priya Nair',
      status: 'failed', rows: [
        mkRow(1, { 'Admission number': '', 'First name': 'Om', 'Last name': 'Salunkhe', Grade: '6', Section: 'A', 'Date of birth': '2014-02-11', 'Guardian name': 'Ravi Salunkhe', 'Guardian mobile': '9822011223' }, 'rejected', { error: 'Admission number is required.' }),
        mkRow(2, { 'Admission number': 'ADM-2026-0750', 'First name': 'Sara', 'Last name': 'Khan', Grade: '6', Section: 'B', 'Date of birth': '31/11/2015', 'Guardian name': 'Imran Khan', 'Guardian mobile': '9822011334' }, 'rejected', { error: 'Date of birth is not a valid date.' }),
        mkRow(3, { 'Admission number': 'ADM-2026-0751', 'First name': 'Ved', 'Last name': 'Kadam', Grade: '11', Section: 'A', 'Date of birth': '2013-06-21', 'Guardian name': 'Girish Kadam', 'Guardian mobile': '9822011445' }, 'rejected', { error: 'Grade 11 does not exist.' }),
        mkRow(4, { 'Admission number': 'ADM-2026-0752', 'First name': 'Myra', 'Last name': 'Wagh', Grade: '6', Section: 'D', 'Date of birth': '2014-09-02', 'Guardian name': 'Sameer Wagh', 'Guardian mobile': '9822011556' }, 'rejected', { error: 'Section D does not exist in Grade 6.' }),
        mkRow(5, { 'Admission number': 'ADM-2026-0753', 'First name': 'Ishaan', 'Last name': 'Rane', Grade: '6', Section: 'C', 'Date of birth': '2014-12-19', 'Guardian name': 'Ajay Rane', 'Guardian mobile': '9822011667' }, 'rejected', { error: 'Header mismatch — file uses 2025 column names.' }),
      ],
    },
  ];

  /* ── Notices ── */
  const notices: Notice[] = [
    { id: 'not-001', title: 'Term 2 fee payment reminder', message: 'Dear parents, Term 2 fees were due on 10 July 2026. Kindly clear pending dues at the school office between 9:00 am and 2:00 pm on working days. A receipt is issued for every payment. — Accounts office', audience: 'All parents', publishDate: '2026-07-15', expiryDate: '2026-07-31', status: 'published', author: 'Sunita Deshpande', createdAt: '2026-07-15T09:00', publishedAt: '2026-07-15T09:05' },
    { id: 'not-002', title: 'Annual Day rehearsal schedule', message: 'Annual Day rehearsals begin 27 July for participating grades. Students should report to the assembly hall at 1:30 pm with their class teachers. Costume details will be shared by section teachers.', audience: 'Everyone', publishDate: '2026-07-18', expiryDate: '2026-08-15', status: 'published', author: 'Vikram Rao', createdAt: '2026-07-18T11:20', publishedAt: '2026-07-18T11:30' },
    { id: 'not-003', title: 'Grade 7 parent interaction — summary', message: 'Thank you to all Grade 7 parents who attended the interaction on 11 July. Key points: attendance expectations, Term 2 dues and the new parent app. Slides attached in the school diary.', audience: 'Grade', gradeId: 'g7', publishDate: '2026-07-12', expiryDate: '2026-07-26', status: 'published', author: 'Farah Khan', createdAt: '2026-07-12T16:40', publishedAt: '2026-07-12T16:45' },
    { id: 'not-004', title: 'Staff meeting minutes — attendance process', message: 'Minutes of the 18 July staff meeting: registers must be submitted by 9:15 am daily. Correction requests after submission go to the office approval queue. Reminder: do not edit registers after submission.', audience: 'All staff', publishDate: '2026-07-19', expiryDate: '2026-08-19', status: 'published', author: 'Meera Kulkarni', createdAt: '2026-07-19T10:10', publishedAt: '2026-07-19T10:15' },
    { id: 'not-005', title: 'Independence Day celebration', message: 'Independence Day will be celebrated on the school grounds at 8:00 am. Students from Grades 5-10 attend in uniform. Parents are welcome; seating from 7:40 am.', audience: 'Everyone', publishDate: '2026-08-01', expiryDate: '2026-08-16', status: 'scheduled', author: 'Vikram Rao', createdAt: '2026-07-20T12:00' },
    { id: 'not-006', title: 'Summer reading list', message: 'The library summer reading list is available at the front office. Books can be borrowed for the break.', audience: 'All parents', publishDate: '2026-06-20', expiryDate: '2026-07-05', status: 'expired', author: 'Priya Nair', createdAt: '2026-06-20T09:00', publishedAt: '2026-06-20T09:10' },
    { id: 'not-007', title: 'Grade 10 guidance sessions (coming later)', message: 'Draft notice — exam guidance sessions will be scheduled once the exams module is enabled.', audience: 'Grade', gradeId: 'g10', publishDate: '2026-08-05', expiryDate: '2026-08-20', status: 'draft', author: 'Meera Kulkarni', createdAt: '2026-07-20T15:30' },
  ];

  /* ── Holidays ── */
  const holidays: Holiday[] = [
    { id: 'hol-1', date: '2026-08-15', type: 'Holiday', name: 'Independence Day', appliesTo: 'All' },
    { id: 'hol-2', date: '2026-09-14', type: 'Holiday', name: 'Ganesh Chaturthi', appliesTo: 'All' },
    { id: 'hol-3', date: '2026-10-02', type: 'Holiday', name: 'Gandhi Jayanti', appliesTo: 'All' },
    { id: 'hol-4', date: '2026-11-09', type: 'Holiday', name: 'Diwali break', appliesTo: 'All' },
    { id: 'hol-5', date: '2026-11-10', type: 'Holiday', name: 'Diwali break', appliesTo: 'All' },
    { id: 'hol-6', date: '2026-11-11', type: 'Holiday', name: 'Diwali break', appliesTo: 'All' },
    { id: 'hol-7', date: '2026-12-25', type: 'Holiday', name: 'Christmas', appliesTo: 'All' },
    { id: 'hol-8', date: '2026-07-25', type: 'Teaching day', name: 'Compensating day for Diwali break', appliesTo: 'All' },
  ];

  /* ── Exports, office tasks ── */
  const exports: ExportJob[] = [
    { id: 'exp-001', type: 'Fee dues report', requestedBy: 'Amit Joshi', requestedAt: '2026-07-20T16:40', status: 'ready', expiresAt: '2026-08-03', columns: ['Admission number', 'Student', 'Grade', 'Due date', 'Amount due'], rows: [
      ['ADM-2026-0142', 'Ananya Patil', 'Grade 7-A', '10 Jul 2026', '28300'],
      ['ADM-2026-0018', 'Vivaan Shinde', 'Grade 1-A', '10 Jul 2026', '28300'],
      ['ADM-2026-0043', 'Sai Chavan', 'Grade 2-B', '10 Jul 2026', '2800'],
    ] },
    { id: 'exp-000', type: 'Attendance summary', requestedBy: 'Meera Kulkarni', requestedAt: '2026-06-30T15:10', status: 'expired', expiresAt: '2026-07-14' },
  ];

  const officeTasks = [
    { id: 'ot-001', from: 'Rajesh Patil', studentId: IDS.ananya, note: 'Guardian mobile ending 4321 has changed — please update office records.', at: '2026-07-20T18:22', status: 'open' as const },
  ];

  /* ── Audit ── */
  const audit = [
    { id: 'aud-001', at: '2026-07-21T07:31', actor: 'Sunita Deshpande', role: 'school_admin' as const, action: 'Signed in', resource: 'Session', resourceId: '—', result: 'success' as const },
    { id: 'aud-002', at: '2026-07-21T08:05', actor: 'Amit Joshi', role: 'accountant' as const, action: 'Recorded payment', resource: 'Payment', resourceId: 'pay-00611', result: 'success' as const },
    { id: 'aud-003', at: '2026-07-21T09:02', actor: 'Sunita Deshpande', role: 'school_admin' as const, action: 'Uploaded import', resource: 'Import', resourceId: 'imp-002', result: 'success' as const },
    { id: 'aud-004', at: '2026-07-20T17:30', actor: 'Amit Joshi', role: 'accountant' as const, action: 'Requested reversal', resource: 'Fee request', resourceId: 'frq-001', result: 'success' as const },
    { id: 'aud-005', at: '2026-07-20T16:45', actor: 'Meera Kulkarni', role: 'principal' as const, action: 'Closed business day', resource: 'Day close', resourceId: 'dc-2026-07-20', result: 'success' as const },
    { id: 'aud-006', at: '2026-07-20T16:40', actor: 'Amit Joshi', role: 'accountant' as const, action: 'Created export', resource: 'Export', resourceId: 'exp-001', result: 'success' as const },
    { id: 'aud-007', at: '2026-07-19T11:15', actor: 'Amit Joshi', role: 'accountant' as const, action: 'Requested adjustment', resource: 'Fee request', resourceId: 'frq-002', result: 'success' as const },
    { id: 'aud-008', at: '2026-07-19T10:12', actor: 'Priya Nair', role: 'receptionist' as const, action: 'Uploaded import', resource: 'Import', resourceId: 'imp-001', result: 'failed' as const },
    { id: 'aud-009', at: '2026-07-19T09:15', actor: 'Farah Khan', role: 'teacher' as const, action: 'Submitted register', resource: 'Register', resourceId: 'reg-2026-07-19-s-7a', result: 'success' as const },
    { id: 'aud-010', at: '2026-07-18T11:30', actor: 'Vikram Rao', role: 'school_admin' as const, action: 'Published notice', resource: 'Notice', resourceId: 'not-002', result: 'success' as const },
    { id: 'aud-011', at: '2026-07-17T14:30', actor: 'Sunita Deshpande', role: 'school_admin' as const, action: 'Viewed student ledger', resource: 'Student', resourceId: IDS.ananya, result: 'success' as const },
    { id: 'aud-012', at: '2026-07-16T10:05', actor: 'Priya Nair', role: 'receptionist' as const, action: 'Attempted fee edit', resource: 'Fee plan', resourceId: IDS.plan2627, result: 'denied' as const },
  ];

  void ananyaReceiptId;
  return {
    academicYears: [
      { id: IDS.ay2526, name: '2025-26', start: '2025-04-01', end: '2026-03-31', status: 'closed' },
      { id: IDS.ay2627, name: '2026-27', start: '2026-04-01', end: '2027-03-31', status: 'active' },
      { id: 'ay-2027-28', name: '2027-28', start: '2027-04-01', end: '2028-03-31', status: 'upcoming' },
    ],
    campuses: [{ id: IDS.campusMain, name: 'Main Campus' }],
    grades, sections, students, guardians, enrollments, staff, assignments, registers, corrections,
    feePlans, charges, payments, receipts, feeRequests, dayCloses, imports, notices,
    audit, exports, officeTasks, holidays,
  };
}
