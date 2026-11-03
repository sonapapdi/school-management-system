import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import A01SignIn from '@/components/erp/screens/auth/A01-sign-in';
import W01TodayDashboard from '@/components/erp/screens/web/W01-today-dashboard';
import T01TeacherHome from '@/components/erp/screens/teacher/T01-teacher-home';

export const SCREENS_CORE: Partial<Record<ScreenId, ScreenComponent>> = {
  A01: A01SignIn,
  W01: W01TodayDashboard,
  T01: T01TeacherHome,
};
