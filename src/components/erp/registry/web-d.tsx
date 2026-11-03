import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import W26AcademicYears from '@/components/erp/screens/web/W26-academic-years';
import W27Grades from '@/components/erp/screens/web/W27-grades';
import W28Sections from '@/components/erp/screens/web/W28-sections';
import W29Calendar from '@/components/erp/screens/web/W29-calendar';
import W30ClassTeachers from '@/components/erp/screens/web/W30-class-teachers';
import W31NoticeList from '@/components/erp/screens/web/W31-notice-list';
import W32NoticeEditor from '@/components/erp/screens/web/W32-notice-editor';
import W33NoticeDetail from '@/components/erp/screens/web/W33-notice-detail';

/* Filled by Task 2-d: W26–W33 */
export const SCREENS_WEB_D: Partial<Record<ScreenId, ScreenComponent>> = {
  W26: W26AcademicYears,
  W27: W27Grades,
  W28: W28Sections,
  W29: W29Calendar,
  W30: W30ClassTeachers,
  W31: W31NoticeList,
  W32: W32NoticeEditor,
  W33: W33NoticeDetail,
};
