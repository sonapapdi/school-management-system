import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import P01ParentHome from '@/components/erp/screens/parent/P01-parent-home';
import P02AttendanceCalendar from '@/components/erp/screens/parent/P02-attendance-calendar';
import P03AttendanceDay from '@/components/erp/screens/parent/P03-attendance-day';
import P04Fees from '@/components/erp/screens/parent/P04-fees';
import P05Installment from '@/components/erp/screens/parent/P05-installment';
import P06Receipts from '@/components/erp/screens/parent/P06-receipts';
import P07ReceiptDetail from '@/components/erp/screens/parent/P07-receipt-detail';
import P08Notices from '@/components/erp/screens/parent/P08-notices';
import P09NoticeDetail from '@/components/erp/screens/parent/P09-notice-detail';
import P10ChildProfile from '@/components/erp/screens/parent/P10-child-profile';
import P11GuardianAccess from '@/components/erp/screens/parent/P11-guardian-access';
import P12Help from '@/components/erp/screens/parent/P12-help';

/* P01–P12 (Task 2-g) */
export const SCREENS_PARENT: Partial<Record<ScreenId, ScreenComponent>> = {
  P01: P01ParentHome, P02: P02AttendanceCalendar, P03: P03AttendanceDay, P04: P04Fees,
  P05: P05Installment, P06: P06Receipts, P07: P07ReceiptDetail, P08: P08Notices,
  P09: P09NoticeDetail, P10: P10ChildProfile, P11: P11GuardianAccess, P12: P12Help,
};
