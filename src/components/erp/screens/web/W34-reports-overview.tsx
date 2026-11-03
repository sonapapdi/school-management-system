'use client';

import { BarChart3, Banknote, ClipboardCheck, FileDown, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ComingLater, PageHeader, PermissionState, SkeletonCards } from '@/components/erp/ui/primitives';
import { attendanceSummary, collectionsOn, overdueTotal } from '@/lib/erp/derive';
import { fmtINR, fmtPct, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { ScreenId } from '@/lib/erp/types';

const COMING_LATER = [
  'Exams & report cards', 'Homework & lesson plans', 'Automatic timetable', 'Parent-teacher chat',
  'Online payments', 'Transport & bus tracking', 'Library', 'Payroll', 'Hostel', 'Inventory',
  'Biometrics', 'AI recommendations',
];

interface ReportCard {
  screen: ScreenId;
  icon: LucideIcon;
  title: string;
  desc: string;
  kpi: string;
  kpiLabel: string;
  exportType: string;
  exportLabel: string;
}

export default function W34ReportsOverview() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const loading = useFakeLoad(350);

  const att = attendanceSummary(data, schoolDate);
  const overdue = overdueTotal(data, schoolDate);
  const collections = collectionsOn(data, schoolDate);
  const readyExports = data.exports.filter((e) => e.status === 'ready').length;
  const canExport = can(role, 'reports', 'export');

  if (!can(role, 'reports', 'view')) return <PermissionState module="Reports" />;

  const cards: ReportCard[] = [
    {
      screen: 'W13', icon: ClipboardCheck, title: 'Attendance report',
      desc: 'Attendance percentages by date, grade, section and student.',
      kpi: fmtPct(att.presentPct), kpiLabel: 'Attendance today',
      exportType: 'Attendance report', exportLabel: 'Export',
    },
    {
      screen: 'W35', icon: Wallet, title: 'Fee dues report',
      desc: 'Outstanding installments with days overdue as of any date.',
      kpi: fmtINR(overdue), kpiLabel: 'Overdue fees',
      exportType: 'Fee dues report', exportLabel: 'Export',
    },
    {
      screen: 'W36', icon: Banknote, title: 'Collection report',
      desc: 'Mode-wise collections with gross, reversals and net totals.',
      kpi: fmtINR(collections), kpiLabel: 'Collected today',
      exportType: 'Collection report', exportLabel: 'Export',
    },
    {
      screen: 'W37', icon: FileDown, title: 'Export center',
      desc: 'Generated CSV exports with status, expiry and downloads.',
      kpi: String(readyExports), kpiLabel: 'Ready exports',
      exportType: 'Student directory', exportLabel: 'Create export',
    },
  ];

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Start from a report card, then filter, print or export what you need."
        actions={<Button variant="outline" className="rounded-control" onClick={() => nav('W37')}><FileDown className="h-4 w-4" aria-hidden /> Export center</Button>}
      />

      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((c) => (
            <div
              key={c.screen}
              role="button"
              tabIndex={0}
              onClick={() => nav(c.screen)}
              onKeyDown={(e) => e.key === 'Enter' && nav(c.screen)}
              className="flex cursor-pointer flex-col rounded-card border border-line bg-card p-4 shadow-sm transition-shadow hover:border-brand/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand/10 text-brand-dark" aria-hidden>
                  <c.icon className="h-4.5 w-4.5" />
                </span>
                <BarChart3 className="h-4 w-4 text-line" aria-hidden />
              </div>
              <h2 className="mt-3 font-heading text-[15px] font-bold text-ink">{c.title}</h2>
              <p className="mt-0.5 min-h-[36px] text-[12.5px] leading-snug text-muted-foreground">{c.desc}</p>
              <p className="mt-2 font-heading text-xl font-bold tabular-nums text-ink">{c.kpi}</p>
              <p className="text-[11.5px] text-muted-foreground">{c.kpiLabel}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <Button
                  size="sm" variant="outline" className="rounded-control"
                  onClick={(e) => { e.stopPropagation(); nav(c.screen); }}
                >
                  Open report
                </Button>
                {canExport && (
                  <Button
                    size="sm" variant="ghost" className="rounded-control text-brand-dark hover:text-brand-dark"
                    onClick={(e) => { e.stopPropagation(); openDialog('D28', { type: c.exportType }); }}
                  >
                    {c.exportLabel}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-card border border-line bg-card p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-heading text-[15px] font-bold text-ink">Coming later</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">Not in MVP</span>
        </div>
        <p className="mt-1 text-[12.5px] text-muted-foreground">These are not part of the MVP and stay inactive.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {COMING_LATER.map((f) => <ComingLater key={f} />)}
        </div>
      </div>
    </div>
  );
}
