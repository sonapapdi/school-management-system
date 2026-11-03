'use client';

import { Calendar, ChevronLeft, Check, Download, Share2, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fmtDate, fmtINR } from '@/lib/erp/utils';
import { MarkChip } from './primitives';

/* ── Phone top bar ── */

export function PhoneHeader({
  title, subtitle, onBack, right, accent = '#5B5FEF',
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  accent?: string;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-card/95 px-4 pb-3 pt-4 backdrop-blur">
      <div className="flex items-center gap-2">
        {onBack && (
          <button
            type="button" onClick={onBack}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink hover:bg-muted"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-heading text-[17px] font-bold text-ink">{title}</h1>
          {subtitle && <p className="truncate text-[12px] text-muted-foreground">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="mt-2.5 h-0.5 w-10 rounded-full" style={{ backgroundColor: accent }} aria-hidden />
    </header>
  );
}

/* ── Phone card & rows ── */

export function PhoneCard({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn('rounded-[14px] border border-line bg-card p-4 shadow-sm', onClick && 'cursor-pointer transition-colors hover:bg-[#FAFBFF] active:bg-muted', className)}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      {children}
    </div>
  );
}

export function PhoneRow({
  icon: Icon, title, subtitle, right, onClick, danger,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-[12px] border border-line bg-card px-3.5 py-3 text-left transition-colors min-h-[52px]',
        onClick && 'hover:bg-[#FAFBFF] active:bg-muted',
      )}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      {Icon && (
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', danger ? 'bg-danger-soft text-danger' : 'bg-muted text-ink-soft')}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className={cn('block truncate text-[14px] font-semibold', danger ? 'text-danger' : 'text-ink')}>{title}</span>
        {subtitle && <span className="block truncate text-[12px] text-muted-foreground">{subtitle}</span>}
      </span>
      {right}
    </button>
  );
}

/* ── Sticky action bar (above bottom nav) ── */

export function PhoneStickyBar({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 z-20 border-t border-line bg-card/95 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)] pt-3 backdrop-blur">
      <div className="mx-auto flex max-w-md gap-2">{children}</div>
    </div>
  );
}

/* ── Attendance status selector ── */

export type AttStatus = 'P' | 'A' | 'L' | 'unmarked';

export function AttendanceStatusSelector({
  value, onChange, compact,
}: {
  value: AttStatus;
  onChange: (s: AttStatus) => void;
  compact?: boolean;
}) {
  const opts: { key: AttStatus; label: string; cls: string }[] = [
    { key: 'P', label: 'Present', cls: 'data-[on=true]:bg-success data-[on=true]:text-white data-[on=true]:border-success' },
    { key: 'A', label: 'Absent', cls: 'data-[on=true]:bg-danger data-[on=true]:text-white data-[on=true]:border-danger' },
    { key: 'L', label: 'Leave', cls: 'data-[on=true]:bg-amber data-[on=true]:text-white data-[on=true]:border-amber' },
  ];
  return (
    <div className={cn('grid grid-cols-3 gap-1.5', compact && 'gap-1')} role="radiogroup" aria-label="Attendance status">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          data-on={value === o.key}
          onClick={() => onChange(o.key)}
          className={cn(
            'min-h-[40px] rounded-[10px] border border-line bg-card text-[12.5px] font-semibold text-ink-soft transition-colors',
            o.cls,
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function MarkButtons({
  value, onChange,
}: {
  value: AttStatus;
  onChange: (s: AttStatus) => void;
}) {
  const opts: { key: AttStatus; label: string; onCls: string }[] = [
    { key: 'P', label: 'P', onCls: 'bg-success text-white border-success' },
    { key: 'A', label: 'A', onCls: 'bg-danger text-white border-danger' },
    { key: 'L', label: 'L', onCls: 'bg-amber text-white border-amber' },
  ];
  return (
    <div className="flex gap-1" role="radiogroup" aria-label="Mark">
      {opts.map((o) => (
        <button
          key={o.key}
          type="button"
          role="radio"
          aria-checked={value === o.key}
          aria-label={o.key === 'P' ? 'Present' : o.key === 'A' ? 'Absent' : 'Leave'}
          onClick={() => onChange(o.key)}
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-[9px] border text-[12px] font-bold transition-colors',
            value === o.key ? o.onCls : 'border-line bg-card text-muted-foreground hover:bg-muted',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ── Child switcher (parent app) ── */

export function ChildSwitcher({
  children, current, onSelect,
}: {
  children: { id: string; name: string; className: string }[];
  current: string;
  onSelect: (id: string) => void;
}) {
  if (children.length <= 1) {
    const c = children[0];
    return (
      <div className="flex items-center gap-2.5 rounded-[12px] border border-line bg-card px-3 py-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 font-heading text-[13px] font-bold text-brand-dark">
          {c?.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}
        </span>
        <span>
          <span className="block text-[13.5px] font-bold text-ink">{c?.name}</span>
          <span className="block text-[11.5px] text-muted-foreground">{c?.className}</span>
        </span>
      </div>
    );
  }
  return (
    <div className="erp-scroll flex gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="Switch child">
      {children.map((c) => (
        <button
          key={c.id}
          role="tab"
          aria-selected={current === c.id}
          type="button"
          onClick={() => onSelect(c.id)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors',
            current === c.id ? 'border-brand bg-brand text-white' : 'border-line bg-card text-ink-soft',
          )}
        >
          {c.name.split(' ')[0]} · {c.className}
        </button>
      ))}
    </div>
  );
}

/* ── Class switcher (teacher app) ── */

export function ClassSwitcher({
  sections, current, onSelect,
}: {
  sections: { id: string; label: string }[];
  current: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="erp-scroll flex gap-2 overflow-x-auto pb-0.5" role="tablist" aria-label="Switch class">
      {sections.map((s) => (
        <button
          key={s.id}
          role="tab"
          aria-selected={current === s.id}
          type="button"
          onClick={() => onSelect(s.id)}
          className={cn(
            'shrink-0 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold transition-colors',
            current === s.id ? 'border-teal bg-teal text-white' : 'border-line bg-card text-ink-soft',
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ── Day cell for attendance calendar ── */

export function DayCell({
  day, status, selected, onClick,
}: {
  day: number;
  status: 'P' | 'A' | 'L' | 'unmarked' | 'no_school';
  selected?: boolean;
  onClick?: () => void;
}) {
  const base = 'relative flex h-10 w-10 items-center justify-center rounded-[11px] text-[13px] font-semibold';
  const map = {
    P: 'bg-success-soft text-success',
    A: 'bg-danger-soft text-danger',
    L: 'bg-amber-soft text-[#8a5a00]',
    unmarked: 'bg-muted text-muted-foreground',
    no_school: 'bg-transparent text-[#C4CAD6]',
  } as const;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Day ${day}`}
      className={cn(base, map[status], onClick && 'cursor-pointer hover:ring-2 hover:ring-brand/30', selected && 'ring-2 ring-brand')}
      disabled={status === 'no_school'}
    >
      {day}
      {status !== 'no_school' && (
        <span className={cn('absolute bottom-1 h-1 w-1 rounded-full', status === 'P' ? 'bg-success' : status === 'A' ? 'bg-danger' : status === 'L' ? 'bg-amber' : 'bg-[#C4CAD6]')} aria-hidden />
      )}
    </button>
  );
}

/* ── Receipt (also used for print) ── */

export function ReceiptView({
  receiptNo, date, studentName, classNameLabel, amount, mode, reference, collectedBy, allocations, remaining, orgName,
  compact,
}: {
  receiptNo: string;
  date: string;
  studentName: string;
  classNameLabel: string;
  amount: number;
  mode: string;
  reference?: string;
  collectedBy: string;
  allocations: { head: string; amount: number }[];
  remaining: number;
  orgName: string;
  compact?: boolean;
}) {
  return (
    <div className={cn('rounded-card border border-line bg-card p-5', 'print-area')}>
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-line pb-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand font-heading text-lg font-extrabold text-white">S</span>
          <div>
            <p className="font-heading text-[15px] font-bold text-ink">{orgName}</p>
            <p className="text-[11px] text-muted-foreground">Fee receipt — official copy</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-heading text-[14px] font-bold text-brand-dark tabular-nums">{receiptNo}</p>
          <p className="text-[11px] text-muted-foreground">{fmtDate(date)}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 py-3 text-[12.5px]">
        <div><p className="text-muted-foreground">Student</p><p className="font-semibold text-ink">{studentName}</p></div>
        <div><p className="text-muted-foreground">Class</p><p className="font-semibold text-ink">{classNameLabel}</p></div>
        <div><p className="text-muted-foreground">Payment mode</p><p className="font-semibold text-ink">{mode}</p></div>
        <div><p className="text-muted-foreground">Reference</p><p className="font-semibold text-ink">{reference ?? '—'}</p></div>
        <div><p className="text-muted-foreground">Collected by</p><p className="font-semibold text-ink">{collectedBy}</p></div>
        <div><p className="text-muted-foreground">Amount received</p><p className="font-heading font-bold text-success tabular-nums">{fmtINR(amount)}</p></div>
      </div>
      {!compact && (
        <div className="rounded-[10px] border border-line bg-[#FAFBFE] p-3">
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Allocation</p>
          {allocations.map((a, i) => (
            <div key={i} className="flex justify-between py-0.5 text-[12.5px]">
              <span className="text-ink-soft">{a.head}</span>
              <span className="font-semibold tabular-nums text-ink">{fmtINR(a.amount)}</span>
            </div>
          ))}
          <div className="mt-1 flex justify-between border-t border-line pt-1.5 text-[12.5px] font-bold">
            <span className="text-ink">Remaining due</span>
            <span className={cn('tabular-nums', remaining > 0 ? 'text-danger' : 'text-success')}>{fmtINR(remaining)}</span>
          </div>
        </div>
      )}
      <p className="pt-3 text-center text-[10.5px] text-muted-foreground">
        Computer-generated receipt · This receipt is not valid for tax deduction · Keep for your records
      </p>
    </div>
  );
}

export function ReceiptActions({ onPrint, onDownload, onShare }: { onPrint: () => void; onDownload?: () => void; onShare?: () => void }) {
  return (
    <div className="flex gap-2 print:hidden">
      <Button className="flex-1 rounded-control" onClick={onPrint}>
        <Download className="h-4 w-4" aria-hidden /> Download PDF
      </Button>
      {onShare && (
        <Button variant="outline" className="rounded-control" onClick={onShare} aria-label="Share using phone">
          <Share2 className="h-4 w-4" aria-hidden /> Share
        </Button>
      )}
      <Button variant="outline" className="rounded-control print:hidden" onClick={onPrint} aria-label="Print receipt">
        <Calendar className="hidden" aria-hidden /> Print
      </Button>
    </div>
  );
}

export function DialogIconRow({ icon: Icon, tone }: { icon: LucideIcon; tone: 'danger' | 'warning' | 'info' | 'success' }) {
  const cls = {
    danger: 'bg-danger-soft text-danger',
    warning: 'bg-amber-soft text-[#8a5a00]',
    info: 'bg-brand/10 text-brand-dark',
    success: 'bg-success-soft text-success',
  }[tone];
  return (
    <span className={cn('flex h-10 w-10 items-center justify-center rounded-full', cls)}>
      <Icon className="h-5 w-5" aria-hidden />
    </span>
  );
}

export { Check, X };
