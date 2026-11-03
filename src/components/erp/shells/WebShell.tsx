'use client';

import { useMemo, useState } from 'react';
import {
  BarChart3, Bell, BookOpen, Briefcase, ChevronDown, ChevronsLeft, ChevronsRight, ClipboardCheck,
  FileCheck, HelpCircle, LayoutDashboard, LogOut, Megaphone, PanelLeft, Search, Settings, Users, Wallet, X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn, initials } from '@/lib/utils';
import { WEB_TABS, ROUTES, ROUTE_MAP, routesForTab } from '@/lib/erp/routes';
import { ROLE_LABEL } from '@/lib/erp/tokens';
import { can } from '@/lib/erp/permissions';
import { operationalAlerts } from '@/lib/erp/derive';
import { fmtDate } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';
import type { Role, ScreenId } from '@/lib/erp/types';

const TAB_ICONS: Record<string, typeof LayoutDashboard> = {
  Dashboard: LayoutDashboard,
  Students: Users,
  Attendance: ClipboardCheck,
  Fees: Wallet,
  Staff: Briefcase,
  Academics: BookOpen,
  Notices: Megaphone,
  Reports: BarChart3,
  Approvals: FileCheck,
  Settings: Settings,
};

function Logo({ collapsed }: { collapsed?: boolean }) {
  const theme = useErp((s) => s.theme);
  return (
    <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-heading text-[16px] font-extrabold text-white shadow-sm"
        style={{ backgroundColor: theme.primary }}
        aria-hidden
      >
        {theme.logoLetter}
      </span>
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate font-heading text-[14px] font-bold text-ink">{theme.productName}</p>
          <p className="truncate text-[11px] text-muted-foreground">{theme.schoolName}</p>
        </div>
      )}
    </div>
  );
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const screen = useErp((s) => s.route.screen);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const currentTab = ROUTE_MAP[screen]?.tab;

  return (
    <nav aria-label="Primary" className={cn('flex flex-col gap-0.5 px-2.5 py-3', collapsed && 'px-2')}>
      {WEB_TABS.map(({ tab, screen: firstScreen }) => {
        const Icon = TAB_ICONS[tab] ?? LayoutDashboard;
        const moduleScreens = routesForTab(tab);
        const allowed = moduleScreens.some((r) => r.roles.includes(role)) || can(role, tab.toLowerCase() as never);
        const active = currentTab === tab;
        return (
          <button
            key={tab}
            type="button"
            onClick={() => { nav(firstScreen); onNavigate?.(); }}
            title={collapsed ? tab : undefined}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'group relative flex min-h-[44px] items-center gap-3 rounded-[10px] px-3 text-[13.5px] font-semibold transition-colors',
              collapsed && 'justify-center px-0',
              active ? 'bg-brand/10 text-brand-dark' : 'text-ink-soft hover:bg-muted',
              !allowed && 'opacity-45',
            )}
          >
            {active && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand" aria-hidden />}
            <Icon className="h-[17px] w-[17px] shrink-0" aria-hidden />
            {!collapsed && <span className="flex-1 text-left">{tab}</span>}
            {!allowed && !collapsed && <span className="text-[10px] font-bold uppercase text-muted-foreground">Restricted</span>}
          </button>
        );
      })}
    </nav>
  );
}

function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const data = useErp((s) => s.data);
  const nav = useErp((s) => s.nav);
  const role = useErp((s) => s.session.role);

  const results = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return { students: [], staff: [], notices: [], screens: [] as typeof ROUTES };
    return {
      students: data.students.filter((s) => `${s.displayName} ${s.admNo}`.toLowerCase().includes(query)).slice(0, 4),
      staff: data.staff.filter((s) => `${s.name} ${s.code}`.toLowerCase().includes(query)).slice(0, 3),
      notices: data.notices.filter((n) => n.title.toLowerCase().includes(query)).slice(0, 3),
      screens: ROUTES.filter((r) => r.roles.includes(role) && r.title.toLowerCase().includes(query)).slice(0, 5),
    };
  }, [q, data, role]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-9 w-full max-w-md items-center gap-2 rounded-[10px] border border-line bg-background px-3 text-[13px] text-muted-foreground transition-colors hover:border-brand/40 hover:text-ink-soft lg:w-72"
        aria-label="Open global search"
      >
        <Search className="h-3.5 w-3.5" aria-hidden />
        <span className="hidden sm:inline">Search students, staff, notices…</span>
        <kbd className="ml-auto hidden rounded border border-line bg-muted px-1.5 py-0.5 text-[10px] font-semibold lg:inline">Ctrl K</kbd>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div
            className="mx-auto mt-[12vh] w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-card border border-line bg-card shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-label="Global search"
          >
            <div className="flex items-center gap-2 border-b border-line p-3">
              <Search className="h-4 w-4 text-muted-foreground" aria-hidden />
              <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search students, staff, notices, screens…" className="h-9 border-0 bg-transparent shadow-none focus-visible:ring-0" aria-label="Search query" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close search"><X className="h-4 w-4 text-muted-foreground" /></button>
            </div>
            <div className="erp-scroll max-h-[55vh] overflow-y-auto p-2 text-[13px]">
              {results.students.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[11px] font-bold uppercase text-muted-foreground">Students</p>
                  {results.students.map((s) => (
                    <button key={s.id} type="button" className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-muted" onClick={() => { setOpen(false); nav('W05', { studentId: s.id }); }}>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand/10 text-[11px] font-bold text-brand-dark">{initials(s.displayName)}</span>
                      <span className="flex-1 truncate font-medium text-ink">{s.displayName}</span>
                      <span className="text-[11px] text-muted-foreground">{s.admNo}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.staff.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[11px] font-bold uppercase text-muted-foreground">Staff</p>
                  {results.staff.map((s) => (
                    <button key={s.id} type="button" className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-muted" onClick={() => { setOpen(false); nav('W24', { staffId: s.id }); }}>
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-soft text-[11px] font-bold text-teal">{initials(s.name)}</span>
                      <span className="flex-1 truncate font-medium text-ink">{s.name}</span>
                      <span className="text-[11px] text-muted-foreground">{s.code}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.notices.length > 0 && (
                <div className="mb-1">
                  <p className="px-2 py-1 text-[11px] font-bold uppercase text-muted-foreground">Notices</p>
                  {results.notices.map((n) => (
                    <button key={n.id} type="button" className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-muted" onClick={() => { setOpen(false); nav('W33', { noticeId: n.id }); }}>
                      <Megaphone className="h-4 w-4 text-muted-foreground" aria-hidden />
                      <span className="flex-1 truncate font-medium text-ink">{n.title}</span>
                    </button>
                  ))}
                </div>
              )}
              {results.screens.length > 0 && (
                <div>
                  <p className="px-2 py-1 text-[11px] font-bold uppercase text-muted-foreground">Go to screen</p>
                  {results.screens.map((r) => (
                    <button key={r.id} type="button" className="flex w-full items-center gap-2 rounded-[8px] px-2 py-2 text-left hover:bg-muted" onClick={() => { setOpen(false); nav(r.id); }}>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">{r.id}</span>
                      <span className="flex-1 truncate font-medium text-ink">{r.title}</span>
                      <span className="text-[11px] text-muted-foreground">{r.tab}</span>
                    </button>
                  ))}
                </div>
              )}
              {q && results.students.length + results.staff.length + results.notices.length + results.screens.length === 0 && (
                <p className="px-3 py-8 text-center text-muted-foreground">No matches for “{q}”.</p>
              )}
              {!q && <p className="px-3 py-8 text-center text-muted-foreground">Type to search across the whole school.</p>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);
  const alerts = operationalAlerts(data, schoolDate).slice(0, 6);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="relative flex h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-card text-ink-soft hover:bg-muted" aria-label={`Notifications (${alerts.length} open items)`}>
          <Bell className="h-4 w-4" aria-hidden />
          {alerts.length > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">{alerts.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 rounded-card p-2">
        <p className="px-2 py-1.5 text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Operational alerts</p>
        {alerts.length === 0 && <p className="px-2 py-4 text-center text-[13px] text-muted-foreground">All clear. No open alerts.</p>}
        {alerts.map((a) => (
          <button key={a.id} type="button" onClick={() => { setOpen(false); if (a.action) nav(a.action.screen, a.action.params); }} className="flex w-full items-start gap-2 rounded-[8px] p-2 text-left hover:bg-muted">
            <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', a.severity === 'high' ? 'bg-danger' : a.severity === 'medium' ? 'bg-amber' : 'bg-brand')} aria-hidden />
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-semibold text-ink">{a.title}</span>
              <span className="block truncate text-[11.5px] text-muted-foreground">{a.detail}</span>
            </span>
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const role = useErp((s) => s.session.role);
  const userName = useErp((s) => s.session.userName);
  const setRole = useErp((s) => s.setRole);
  const openDialog = useErp((s) => s.openDialog);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" className="flex h-9 items-center gap-2 rounded-[10px] border border-line bg-card px-2 hover:bg-muted" aria-label="User menu">
          <span className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-white">{initials(userName)}</span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block max-w-28 truncate text-[12px] font-bold text-ink">{userName}</span>
            <span className="block text-[10px] text-muted-foreground">{ROLE_LABEL[role]}</span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-card">
        <DropdownMenuLabel className="text-[11px] uppercase text-muted-foreground">Role switcher (demo)</DropdownMenuLabel>
        {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
          <DropdownMenuItem key={r} onClick={() => setRole(r)} className={cn('text-[13px]', r === role && 'bg-brand/10 font-semibold text-brand-dark')}>
            {ROLE_LABEL[r]}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => openDialog('D06')} className="text-[13px] text-danger">
          <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CommandBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const schoolDate = useErp((s) => s.schoolDate);
  const setSchoolDate = useErp((s) => s.setSchoolDate);
  const ayId = useErp((s) => s.ayId);
  const setAy = useErp((s) => s.setAy);
  const data = useErp((s) => s.data);
  const campusId = useErp((s) => s.campusId);
  const setCampus = useErp((s) => s.setCampus);
  const openDialog = useErp((s) => s.openDialog);

  return (
    <div className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-line bg-card/95 px-3 backdrop-blur sm:gap-3 sm:px-4 print:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-9 w-9 shrink-0 rounded-control lg:hidden" aria-label="Open navigation">
            <PanelLeft className="h-4 w-4" aria-hidden />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[264px] p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-full flex-col">
            <div className="border-b border-line p-4"><Logo /></div>
            <SidebarNav collapsed={false} />
          </div>
        </SheetContent>
      </Sheet>
      <div className="hidden lg:block"><Logo /></div>

      <div className="mx-auto w-full max-w-xl flex-1 px-1"><GlobalSearch /></div>

      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        <Select value={campusId} onValueChange={setCampus}>
          <SelectTrigger className="hidden h-9 w-[130px] rounded-control bg-card text-[12px] font-semibold md:flex" aria-label="School or campus">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.campuses.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={ayId} onValueChange={(v) => { const ay = data.academicYears.find((a) => a.id === v); openDialog('D05', { ayId: v, ayName: ay?.name }); }}>
          <SelectTrigger className="h-9 w-[104px] rounded-control bg-card text-[12px] font-semibold" aria-label="Academic year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {data.academicYears.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <label className="hidden items-center gap-1.5 rounded-[10px] border border-line bg-card px-2.5 h-9 xl:flex" title="School date">
          <span className="text-[11px] font-bold uppercase text-muted-foreground">School date</span>
          <input
            type="date"
            value={schoolDate}
            max="2026-07-21"
            min="2026-06-01"
            onChange={(e) => e.target.value && setSchoolDate(e.target.value)}
            className="bg-transparent text-[12px] font-semibold text-ink outline-none"
            aria-label="School date"
          />
        </label>

        <NotificationsBell />

        <button
          type="button"
          onClick={() => useErp.getState().pushToast({ title: 'Help & shortcuts', description: 'Press Ctrl+K to search. Demo controls are at the bottom-right.', variant: 'info' })}
          className="hidden h-9 w-9 items-center justify-center rounded-[10px] border border-line bg-card text-ink-soft hover:bg-muted sm:flex"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" aria-hidden />
        </button>

        <UserMenu />
      </div>
    </div>
  );
}

export function WebShell({ children }: { children: React.ReactNode }) {
  const collapsed = useErp((s) => s.sidebarCollapsed);
  const toggle = useErp((s) => s.toggleSidebar);
  const theme = useErp((s) => s.theme);
  const schoolDate = useErp((s) => s.schoolDate);

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <CommandBar onOpenSidebar={() => undefined} />
      <div className="flex flex-1">
        <aside
          className={cn('sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 flex-col border-r border-line bg-card transition-[width] duration-200 lg:flex', collapsed ? 'w-[80px]' : 'w-[264px]')}
          aria-label="Sidebar"
        >
          <SidebarNav collapsed={collapsed} />
          <div className="mt-auto border-t border-line p-2.5">
            <button
              type="button"
              onClick={toggle}
              className={cn('flex min-h-[40px] w-full items-center gap-2.5 rounded-[10px] px-3 text-[12.5px] font-semibold text-muted-foreground hover:bg-muted', collapsed && 'justify-center px-0')}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden /> : <ChevronsLeft className="h-4 w-4" aria-hidden />}
              {!collapsed && 'Collapse'}
            </button>
          </div>
        </aside>

        <main id="main" className="min-w-0 flex-1 p-4 sm:p-5 lg:p-6">
          {children}
        </main>
      </div>
      <footer className="mt-auto border-t border-line bg-card px-4 py-3 text-[11.5px] text-muted-foreground">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-1">
          <span>{theme.productName} · {theme.schoolName}, {theme.campusName}</span>
          <span>School date {fmtDate(schoolDate)} · Academic year {useErp.getState().data.academicYears.find((a) => a.id === useErp.getState().ayId)?.name} · Prototype for demonstration</span>
        </div>
      </footer>
    </div>
  );
}

export { SidebarNav };
