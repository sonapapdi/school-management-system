'use client';

import { CalendarDays, ClipboardCheck, Home, Megaphone, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { PARENT_TABS, TEACHER_TABS } from '@/lib/erp/routes';
import { useErp } from '@/lib/erp/store';
import type { ScreenId } from '@/lib/erp/types';

const TAB_ICONS: Record<string, LucideIcon> = {
  Today: Home,
  Classes: ClipboardCheck,
  Attendance: ClipboardCheck,
  Notices: Megaphone,
  Profile: User,
  Home: Home,
  Fees: CalendarDays,
};

/**
 * Renders teacher/parent screens inside a 390×844 device frame on desktop;
 * full-viewport app on real mobile widths.
 */
export function PhoneShell({ app, children }: { app: 'teacher' | 'parent'; children: React.ReactNode }) {
  const screen = useErp((s) => s.route.screen);
  const nav = useErp((s) => s.nav);
  const tabs = app === 'teacher' ? TEACHER_TABS : PARENT_TABS;
  const accent = app === 'teacher' ? '#0E9F9A' : '#5B5FEF';
  const appName = app === 'teacher' ? 'Teacher app' : 'Parent app';

  const screenForTab = (label: string) => tabs.find((t) => t.label === label)?.screen;

  return (
    <div className="flex min-h-screen items-stretch justify-center bg-page sm:items-center sm:p-6 lg:p-10">
      <div className="flex w-full flex-col sm:w-auto sm:items-center sm:gap-4">
        <p className="hidden text-center text-[12px] font-semibold uppercase tracking-wider text-muted-foreground sm:block">
          {appName} · 390 × 844 prototype frame
        </p>
        <div
          className={cn(
            'relative mx-auto flex w-full flex-col overflow-hidden bg-page',
            'h-[100dvh] sm:h-[844px] sm:max-h-[calc(100vh-8rem)] sm:w-[390px] sm:rounded-[38px] sm:border-[10px] sm:border-ink sm:shadow-2xl',
          )}
        >
          {/* status bar */}
          <div className="flex h-9 shrink-0 items-center justify-between bg-card px-6 text-[11px] font-bold text-ink sm:rounded-t-[26px]">
            <span>9:41</span>
            <span className="absolute left-1/2 top-1.5 hidden h-5 w-24 -translate-x-1/2 rounded-full bg-ink sm:block" aria-hidden />
            <span className="flex items-center gap-1">
              <span aria-hidden>▮▮▮</span>
              <span aria-hidden>􀙇</span>
              <span>100%</span>
            </span>
          </div>

          <div className="erp-scroll relative flex-1 overflow-y-auto">
            {children}
          </div>

          {/* bottom navigation */}
          <nav
            className="z-30 shrink-0 border-t border-line bg-card pb-[max(env(safe-area-inset-bottom,0px),6px)] pt-1.5 sm:rounded-b-[26px]"
            aria-label={`${appName} navigation`}
          >
            <div className="mx-auto grid max-w-md grid-cols-5 px-2">
              {tabs.map(({ screen: tabScreen, label }) => {
                const Icon = TAB_ICONS[label] ?? Home;
                const active = screen === tabScreen || (app === 'teacher'
                  ? (label === 'Attendance' && ['T02', 'T03', 'T07', 'T08', 'T09'].includes(screen))
                  : (label === 'Fees' && ['P05', 'P06', 'P07'].includes(screen)));
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => nav(tabScreen as ScreenId)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex min-h-[48px] flex-col items-center justify-center gap-0.5 rounded-[10px] px-1 py-1 text-[10px] font-semibold transition-colors',
                      active ? 'text-[var(--tab-accent)]' : 'text-muted-foreground hover:text-ink-soft',
                    )}
                    style={{ ['--tab-accent' as string]: accent }}
                  >
                    <Icon className="h-[19px] w-[19px]" aria-hidden />
                    {label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export function screenForTabLabel(app: 'teacher' | 'parent', label: string): ScreenId | undefined {
  const tabs = app === 'teacher' ? TEACHER_TABS : PARENT_TABS;
  return tabs.find((t) => t.label === label)?.screen;
}
