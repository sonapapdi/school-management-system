'use client';

import { useState } from 'react';
import {
  Check, ChevronDown, FlaskConical, ListChecks, RotateCcw, Route as RouteIcon, ShieldUser, X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/lib/erp/routes';
import { ROLE_LABEL, } from '@/lib/erp/tokens';
import { useErp } from '@/lib/erp/store';
import type { DialogId, Role } from '@/lib/erp/types';

const APPS = [
  { key: 'auth', label: 'Sign-in' },
  { key: 'web', label: 'School web' },
  { key: 'teacher', label: 'Teacher app' },
  { key: 'parent', label: 'Parent app' },
] as const;

const SIMULATE: { id: DialogId; label: string }[] = [
  { id: 'D01', label: 'Session expired' },
  { id: 'D02', label: 'Unsaved changes' },
  { id: 'D03', label: 'Permission denied' },
  { id: 'D04', label: 'Network result unknown' },
  { id: 'D17', label: 'Register changed elsewhere' },
];

export function DemoToolbar() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'apps' | 'screens' | 'simulate'>('apps');
  const route = useErp((s) => s.route);
  const role = useErp((s) => s.session.role);
  const visited = useErp((s) => s.visited);
  const nav = useErp((s) => s.nav);
  const setRole = useErp((s) => s.setRole);
  const openDialog = useErp((s) => s.openDialog);
  const resetDemo = useErp((s) => s.resetDemo);
  const [q, setQ] = useState('');

  const filtered = ROUTES.filter((r) => `${r.id} ${r.title}`.toLowerCase().includes(q.toLowerCase()));
  const percent = Math.round((visited.length / ROUTES.length) * 100);

  return (
    <div className="fixed bottom-4 right-4 z-[90] flex flex-col items-end gap-2 print:hidden">
      {open && (
        <div className="flex max-h-[70vh] w-[min(92vw,360px)] flex-col overflow-hidden rounded-card border border-line bg-card shadow-2xl">
          <div className="flex items-center gap-2 border-b border-line px-3 py-2.5">
            <FlaskConical className="h-4 w-4 text-brand" aria-hidden />
            <p className="flex-1 font-heading text-[13px] font-bold text-ink">Prototype controls</p>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-bold text-muted-foreground">{visited.length}/{ROUTES.length} screens seen</span>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close demo panel"><X className="h-4 w-4 text-muted-foreground" /></button>
          </div>

          <div className="flex border-b border-line text-[12px] font-semibold">
            {([['apps', 'Apps & roles'], ['screens', 'All 73 screens'], ['simulate', 'Simulate']] as const).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setTab(k)} className={cn('flex-1 px-2 py-2', tab === k ? 'border-b-2 border-brand text-brand-dark' : 'text-muted-foreground')}>
                {label}
              </button>
            ))}
          </div>

          <div className="erp-scroll flex-1 overflow-y-auto p-3">
            {tab === 'apps' && (
              <div className="space-y-3">
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-foreground">Jump to app</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {APPS.map((a) => (
                      <button
                        key={a.key}
                        type="button"
                        onClick={() => {
                          if (a.key === 'auth') nav('A01');
                          else if (a.key === 'web') { setRole('school_admin'); nav('W01'); }
                          else if (a.key === 'teacher') { setRole('teacher'); nav('T01'); }
                          else { setRole('parent'); nav('P01'); }
                        }}
                        className="rounded-[10px] border border-line bg-card px-2.5 py-2 text-[12.5px] font-semibold text-ink-soft hover:border-brand/40 hover:bg-brand/5"
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="mb-1.5 text-[11px] font-bold uppercase text-muted-foreground">Sign in as role</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r)}
                        className={cn('rounded-full border px-2.5 py-1.5 text-[11.5px] font-semibold', r === role ? 'border-brand bg-brand text-white' : 'border-line bg-card text-ink-soft hover:bg-muted')}
                      >
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={resetDemo}
                  className="flex w-full items-center justify-center gap-1.5 rounded-[10px] border border-danger/30 bg-danger-soft px-2.5 py-2 text-[12.5px] font-semibold text-danger"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden /> Reset demo data
                </button>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Changes persist in this browser (localStorage). Current screen: <span className="font-bold text-ink-soft">{route.screen}</span> · Role: <span className="font-bold text-ink-soft">{ROLE_LABEL[role]}</span>
                </p>
              </div>
            )}

            {tab === 'screens' && (
              <div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Filter screens…"
                  className="mb-2 h-8 w-full rounded-[8px] border border-line bg-background px-2.5 text-[12.5px] outline-none focus:border-brand"
                  aria-label="Filter screens"
                />
                <div className="space-y-0.5">
                  {filtered.map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => { nav(r.id, r.id === 'W05' ? { studentId: 'stu-ananya' } : r.id === 'W11' ? { date: '2026-07-21', sectionId: 's-7a' } : undefined); }}
                      className="flex w-full items-center gap-2 rounded-[8px] px-2 py-1.5 text-left hover:bg-muted"
                    >
                      <span className={cn('w-9 shrink-0 rounded px-1 py-0.5 text-center text-[10px] font-bold', r.app === 'web' ? 'bg-brand/10 text-brand-dark' : r.app === 'teacher' ? 'bg-teal-soft text-teal' : r.app === 'parent' ? 'bg-brand/10 text-brand-dark' : 'bg-muted text-muted-foreground')}>
                        {r.id}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[12.5px] font-semibold text-ink">{r.title}</span>
                        <span className="block truncate text-[10.5px] text-muted-foreground">{r.path}</span>
                      </span>
                      {visited.includes(r.id) && <Check className="h-3.5 w-3.5 shrink-0 text-success" aria-label="Visited" />}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'simulate' && (
              <div className="space-y-1.5">
                <p className="mb-1 text-[11px] leading-relaxed text-muted-foreground">Trigger global prototype states to demo edge cases.</p>
                {SIMULATE.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openDialog(s.id)}
                    className="flex w-full items-center justify-between rounded-[10px] border border-line bg-card px-2.5 py-2 text-[12.5px] font-semibold text-ink-soft hover:bg-muted"
                  >
                    {s.label}
                    <span className="rounded bg-muted px-1.5 text-[10px] font-bold text-muted-foreground">{s.id}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-line px-3 py-2">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full border border-brand/30 bg-ink px-4 py-2.5 text-[12.5px] font-bold text-white shadow-xl hover:bg-ink-soft"
        aria-expanded={open}
        aria-label="Toggle prototype controls"
      >
        <FlaskConical className="h-4 w-4 text-[#9FA4FF]" aria-hidden />
        Demo
        <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
    </div>
  );
}
