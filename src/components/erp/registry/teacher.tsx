import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import T02TakeAttendance from '@/components/erp/screens/teacher/T02-take-attendance';
import T03ReviewSubmit from '@/components/erp/screens/teacher/T03-review-submit';
import T04MyClasses from '@/components/erp/screens/teacher/T04-my-classes';
import T05ClassRoster from '@/components/erp/screens/teacher/T05-class-roster';
import T06StudentCard from '@/components/erp/screens/teacher/T06-student-card';
import T07AttendanceHistory from '@/components/erp/screens/teacher/T07-attendance-history';
import T08RegisterDetail from '@/components/erp/screens/teacher/T08-register-detail';
import T09RequestCorrection from '@/components/erp/screens/teacher/T09-request-correction';
import T10Notices from '@/components/erp/screens/teacher/T10-notices';
import T11NoticeDetail from '@/components/erp/screens/teacher/T11-notice-detail';
import T12Profile from '@/components/erp/screens/teacher/T12-profile';
import T13Settings from '@/components/erp/screens/teacher/T13-settings';

/* Task 2-f: teacher mobile screens T02–T13 (T01 lives in screens/teacher/T01-teacher-home.tsx) */
export const SCREENS_TEACHER: Partial<Record<ScreenId, ScreenComponent>> = {
  T02: T02TakeAttendance,
  T03: T03ReviewSubmit,
  T04: T04MyClasses,
  T05: T05ClassRoster,
  T06: T06StudentCard,
  T07: T07AttendanceHistory,
  T08: T08RegisterDetail,
  T09: T09RequestCorrection,
  T10: T10Notices,
  T11: T11NoticeDetail,
  T12: T12Profile,
  T13: T13Settings,
};
