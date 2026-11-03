import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import W10SubmissionMonitor from '@/components/erp/screens/web/W10-submission-monitor';
import W11RegisterDetail from '@/components/erp/screens/web/W11-register-detail';
import W12CorrectionRequests from '@/components/erp/screens/web/W12-correction-requests';
import W13AttendanceReport from '@/components/erp/screens/web/W13-attendance-report';
import W14FeePlanList from '@/components/erp/screens/web/W14-fee-plan-list';
import W15FeePlanEditor from '@/components/erp/screens/web/W15-fee-plan-editor';
import W16Assessment from '@/components/erp/screens/web/W16-assessment';
import W17CollectionDesk from '@/components/erp/screens/web/W17-collection-desk';

export const SCREENS_WEB_B: Partial<Record<ScreenId, ScreenComponent>> = {
  W10: W10SubmissionMonitor,
  W11: W11RegisterDetail,
  W12: W12CorrectionRequests,
  W13: W13AttendanceReport,
  W14: W14FeePlanList,
  W15: W15FeePlanEditor,
  W16: W16Assessment,
  W17: W17CollectionDesk,
};
