import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import W18PaymentReceipt from '@/components/erp/screens/web/W18-payment-receipt';
import W19StudentLedger from '@/components/erp/screens/web/W19-student-ledger';
import W20Adjustments from '@/components/erp/screens/web/W20-adjustments';
import W21DayClose from '@/components/erp/screens/web/W21-day-close';
import W22StaffDirectory from '@/components/erp/screens/web/W22-staff-directory';
import W23AddStaff from '@/components/erp/screens/web/W23-add-staff';
import W24StaffProfile from '@/components/erp/screens/web/W24-staff-profile';
import W25RoleAssignment from '@/components/erp/screens/web/W25-role-assignment';

/* Task 2-c: W18–W25 */
export const SCREENS_WEB_C: Partial<Record<ScreenId, ScreenComponent>> = {
  W18: W18PaymentReceipt, W19: W19StudentLedger, W20: W20Adjustments, W21: W21DayClose,
  W22: W22StaffDirectory, W23: W23AddStaff, W24: W24StaffProfile, W25: W25RoleAssignment,
};
