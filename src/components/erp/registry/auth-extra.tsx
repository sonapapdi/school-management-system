import type { ScreenComponent, ScreenId } from '@/lib/erp/types';
import A02Invitation from '@/components/erp/screens/auth/A02-invitation';
import A03Verification from '@/components/erp/screens/auth/A03-verification';
import A04Recover from '@/components/erp/screens/auth/A04-recover';

export const SCREENS_AUTH_EXTRA: Partial<Record<ScreenId, ScreenComponent>> = {
  A02: A02Invitation, A03: A03Verification, A04: A04Recover,
};
