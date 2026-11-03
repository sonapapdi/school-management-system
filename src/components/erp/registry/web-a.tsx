import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import W02OperationalAlerts from '@/components/erp/screens/web/W02-operational-alerts';
import W03StudentDirectory from '@/components/erp/screens/web/W03-student-directory';
import W04NewAdmission from '@/components/erp/screens/web/W04-new-admission';
import W05StudentProfile from '@/components/erp/screens/web/W05-student-profile';
import W06Guardians from '@/components/erp/screens/web/W06-guardians';
import W07Enrollment from '@/components/erp/screens/web/W07-enrollment';
import W08ImportUpload from '@/components/erp/screens/web/W08-import-upload';
import W09ImportReview from '@/components/erp/screens/web/W09-import-review';

export const SCREENS_WEB_A: Partial<Record<ScreenId, ScreenComponent>> = {
  W02: W02OperationalAlerts,
  W03: W03StudentDirectory,
  W04: W04NewAdmission,
  W05: W05StudentProfile,
  W06: W06Guardians,
  W07: W07Enrollment,
  W08: W08ImportUpload,
  W09: W09ImportReview,
};
