import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import W34ReportsOverview from '@/components/erp/screens/web/W34-reports-overview';
import W35FeeDues from '@/components/erp/screens/web/W35-fee-dues';
import W36CollectionReport from '@/components/erp/screens/web/W36-collection-report';
import W37ExportCenter from '@/components/erp/screens/web/W37-export-center';
import W38ApprovalQueue from '@/components/erp/screens/web/W38-approval-queue';
import W39ApprovalDetail from '@/components/erp/screens/web/W39-approval-detail';
import W40SchoolProfile from '@/components/erp/screens/web/W40-school-profile';
import W41Permissions from '@/components/erp/screens/web/W41-permissions';
import W42ReceiptNumbering from '@/components/erp/screens/web/W42-receipt-numbering';
import W43DataRetention from '@/components/erp/screens/web/W43-data-retention';
import W44AuditLog from '@/components/erp/screens/web/W44-audit-log';

/* Filled by Task 2-e: W34–W44 */
export const SCREENS_WEB_E: Partial<Record<ScreenId, ScreenComponent>> = {
  W34: W34ReportsOverview,
  W35: W35FeeDues,
  W36: W36CollectionReport,
  W37: W37ExportCenter,
  W38: W38ApprovalQueue,
  W39: W39ApprovalDetail,
  W40: W40SchoolProfile,
  W41: W41Permissions,
  W42: W42ReceiptNumbering,
  W43: W43DataRetention,
  W44: W44AuditLog,
};
