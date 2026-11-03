'use client';

import { useEffect } from 'react';
import { Construction } from 'lucide-react';
import { WebShell } from '@/components/erp/shells/WebShell';
import { PhoneShell } from '@/components/erp/shells/PhoneShell';
import { AuthShell } from '@/components/erp/shells/AuthShell';
import { DemoToolbar } from '@/components/erp/shells/DemoToolbar';
import { ErpDialogHost, ErpToaster } from '@/components/erp/ui/overlays';
import { PermissionState, EmptyState } from '@/components/erp/ui/primitives';
import { SCREENS_CORE } from '@/components/erp/registry/core';
import { SCREENS_AUTH_EXTRA } from '@/components/erp/registry/auth-extra';
import { SCREENS_WEB_A } from '@/components/erp/registry/web-a';
import { SCREENS_WEB_B } from '@/components/erp/registry/web-b';
import { SCREENS_WEB_C } from '@/components/erp/registry/web-c';
import { SCREENS_WEB_D } from '@/components/erp/registry/web-d';
import { SCREENS_WEB_E } from '@/components/erp/registry/web-e';
import { SCREENS_TEACHER } from '@/components/erp/registry/teacher';
import { SCREENS_PARENT } from '@/components/erp/registry/parent';
import { ROUTE_MAP } from '@/lib/erp/routes';
import { useErp } from '@/lib/erp/store';
import type { ScreenComponent, ScreenId } from '@/lib/erp/types';

const SCREENS: Partial<Record<ScreenId, ScreenComponent>> = {
  ...SCREENS_CORE,
  ...SCREENS_AUTH_EXTRA,
  ...SCREENS_WEB_A,
  ...SCREENS_WEB_B,
  ...SCREENS_WEB_C,
  ...SCREENS_WEB_D,
  ...SCREENS_WEB_E,
  ...SCREENS_TEACHER,
  ...SCREENS_PARENT,
};

function BootSplash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page">
      <span className="flex h-14 w-14 animate-pulse items-center justify-center rounded-[16px] bg-brand font-heading text-2xl font-extrabold text-white">S</span>
      <p className="font-heading text-[15px] font-bold text-ink">School ERP</p>
      <p className="text-[12.5px] text-muted-foreground">Loading Sunrise Public School workspace…</p>
    </div>
  );
}

export default function Page() {
  const booted = useErp((s) => s.booted);
  const screen = useErp((s) => s.route.screen);
  const role = useErp((s) => s.session.role);
  const signedIn = useErp((s) => s.session.signedIn);

  /* Mark booted on first client render even without persisted state */
  useEffect(() => {
    const t = setTimeout(() => useErp.setState({ booted: true }), 60);
    return () => clearTimeout(t);
  }, []);

  if (!booted) return <BootSplash />;

  const def = ROUTE_MAP[screen];
  const app = def?.app ?? 'web';
  const Comp = SCREENS[screen];

  /* Guard: route role check → explicit permission state (never silent) */
  const allowed = def?.roles.includes(role) ?? false;
  const needsSignIn = !signedIn && screen !== 'A01' && screen !== 'A02' && screen !== 'A03' && screen !== 'A04';

  let content: React.ReactNode;
  if (!Comp) {
    content = (
      <EmptyState
        icon={Construction}
        title="Screen opening shortly"
        description="This route is registered in the manifest but its screen is still being generated."
      />
    );
  } else if (needsSignIn) {
    content = <PermissionState module={def?.tab ?? 'workspace'} action="view" />;
  } else if (!allowed) {
    content = <PermissionState module={def?.tab ?? 'workspace'} action="view" />;
  } else {
    content = <Comp />;
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      {app === 'auth' ? (
        <AuthShell>{content}</AuthShell>
      ) : app === 'web' ? (
        <WebShell>{content}</WebShell>
      ) : (
        <PhoneShell app={app === 'teacher' ? 'teacher' : 'parent'}>{content}</PhoneShell>
      )}
      <DemoToolbar />
      <ErpDialogHost />
      <ErpToaster />
    </div>
  );
}
