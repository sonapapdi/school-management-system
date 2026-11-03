'use client';

import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle, Ban, Check, CheckCircle2, ChevronRight, Clock, Info, Lock, ShieldAlert, WifiOff, X,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { fmtINR } from '@/lib/erp/utils';
import { statusMeta, type StatusTone } from '@/lib/erp/tokens';
import { ROUTE_MAP } from '@/lib/erp/routes';
import { useErp } from '@/lib/erp/store';

/* ── Status chip ── */

const TONE_CLASS: Record<StatusTone, string> = {
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-amber-soft text-[#8a5a00] border-amber/25',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-[#E8F4FB] text-[#1f6f9c] border-[#1f6f9c]/20',
  primary: 'bg-brand/10 text-brand-dark border-brand/20',
  teal: 'bg-teal-soft text-teal border-teal/20',
  neutral: 'bg-muted text-muted-foreground border-line',
};

export function StatusChip({ status, className }: { status: string; className?: string }) {
  const meta = statusMeta(status);
  const Icon =
    meta.tone === 'success' ? CheckCircle2 : meta.tone === 'danger' ? Ban
    : meta.tone === 'warning' ? Clock : meta.tone === 'info' ? Info : Check;
  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        TONE_CLASS[meta.tone],
        className,
      )}
    >
      <Icon className="h-3 w-3" aria-hidden />
      {meta.label}
    </span>
  );
}

export function MarkChip({ mark }: { mark: 'P' | 'A' | 'L' | 'unmarked' }) {
  if (mark === 'unmarked') return <StatusChip status="unmarked" />;
  return <StatusChip status={mark} />;
}

export function ComingLater({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-line bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground', className)}>
      <Clock className="h-3 w-3" aria-hidden /> Coming later
    </span>
  );
}

/* ── Money ── */

export function Money({ value, className, signed }: { value: number; className?: string; signed?: boolean }) {
  return (
    <span className={cn('tabular-nums font-semibold', signed && value > 0 ? 'text-success' : value < 0 ? 'text-danger' : '', className)}>
      {signed && value > 0 ? '+' : ''}
      {fmtINR(value)}
    </span>
  );
}

/* ── Page header with auto breadcrumb ── */

export function PageHeader({
  title, description, status, actions, onBack, className,
}: {
  title?: string;
  description?: string;
  status?: ReactNode;
  actions?: ReactNode;
  onBack?: () => void;
  className?: string;
}) {
  const screen = useErp((s) => s.route.screen);
  const meta = ROUTE_MAP[screen];
  return (
    <header className={cn('mb-5', className)}>
      <nav aria-label="Breadcrumb" className="mb-1 flex items-center gap-1 text-[12px] text-muted-foreground">
        {meta?.tab && <span>{meta.tab}</span>}
        {meta?.tab && <ChevronRight className="h-3 w-3" aria-hidden />}
        <span className="font-medium text-ink-soft">{meta?.title ?? title}</span>
        <span className="ml-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">{screen}</span>
      </nav>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            {onBack && (
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack} aria-label="Back">
                <X className="h-4 w-4 rotate-45" aria-hidden />
              </Button>
            )}
            <h1 className="truncate font-heading text-xl font-bold text-ink sm:text-2xl">{title ?? meta?.title}</h1>
            {status}
          </div>
          {(description || meta?.desc) && (
            <p className="mt-1 max-w-3xl text-[13px] text-muted-foreground">{description ?? meta?.desc}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}

/* ── KPI card ── */

const KPI_TONES = {
  default: 'text-ink',
  primary: 'text-brand-dark',
  success: 'text-success',
  warning: 'text-[#8a5a00]',
  danger: 'text-danger',
  teal: 'text-teal',
} as const;

export function KpiCard({
  label, value, sub, icon: Icon, tone = 'default', onClick, loading,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: LucideIcon;
  tone?: keyof typeof KPI_TONES;
  onClick?: () => void;
  loading?: boolean;
}) {
  return (
    <Card
      className={cn(
        'rounded-card border-line bg-card p-4 shadow-sm transition-shadow',
        onClick && 'cursor-pointer hover:shadow-md hover:border-brand/30',
      )}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        {Icon && <Icon className={cn('h-4 w-4', KPI_TONES[tone])} aria-hidden />}
      </div>
      {loading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className={cn('mt-1 font-heading text-2xl font-bold tabular-nums', KPI_TONES[tone])}>{value}</p>
      )}
      {sub && <p className="mt-0.5 text-[12px] text-muted-foreground">{sub}</p>}
    </Card>
  );
}

/* ── Card section ── */

export function Section({
  title, description, actions, children, className, padded = true,
}: {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <Card className={cn('rounded-card border-line bg-card shadow-sm', className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
          <div>
            {title && <h2 className="font-heading text-[15px] font-bold text-ink">{title}</h2>}
            {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={padded ? 'p-4' : ''}>{children}</div>
    </Card>
  );
}

/* ── Form field ── */

export function Field({
  label, required, error, hint, children, className,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label className="text-[13px] font-semibold text-ink-soft">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {error ? (
        <p className="flex items-center gap-1 text-[12px] font-medium text-danger">
          <AlertTriangle className="h-3 w-3" aria-hidden /> {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function InfoRow({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line/60 py-2 last:border-0">
      <span className="shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className={cn('text-right text-[13px] font-semibold text-ink', mono && 'tabular-nums')}>{value}</span>
    </div>
  );
}

/* ── States ── */

export function EmptyState({
  icon: Icon, title, description, action, className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-2 rounded-card border border-dashed border-line bg-card px-6 py-12 text-center', className)}>
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-muted">
        {Icon ? <Icon className="h-5 w-5 text-muted-foreground" aria-hidden /> : <Info className="h-5 w-5 text-muted-foreground" aria-hidden />}
      </div>
      <p className="font-heading text-[15px] font-bold text-ink">{title}</p>
      {description && <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong', description = 'We could not complete this action. Try again.', onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-card border border-danger/25 bg-danger-soft/40 px-6 py-10 text-center">
      <AlertTriangle className="h-6 w-6 text-danger" aria-hidden />
      <p className="font-heading text-[15px] font-bold text-ink">{title}</p>
      <p className="max-w-sm text-[13px] text-muted-foreground">{description}</p>
      {onRetry && (
        <Button size="sm" className="mt-1" onClick={onRetry}>Try again</Button>
      )}
    </div>
  );
}

export function OfflineState() {
  return (
    <div className="flex items-center justify-center gap-2 rounded-card border border-amber/30 bg-amber-soft px-4 py-3 text-[13px] font-medium text-[#8a5a00]">
      <WifiOff className="h-4 w-4" aria-hidden /> You are offline. Changes will sync when connection returns.
    </div>
  );
}

export function PermissionState({ module, action = 'view' }: { module: string; action?: string }) {
  const role = useErp((s) => s.session.role);
  const setRole = useErp((s) => s.setRole);
  return (
    <Card className="rounded-card border-line bg-card p-8 shadow-sm">
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft">
          <ShieldAlert className="h-6 w-6 text-danger" aria-hidden />
        </div>
        <h2 className="font-heading text-lg font-bold text-ink">Permission denied</h2>
        <p className="text-[13px] text-muted-foreground">
          Your current role does not allow this action. Signing in as a role with
          {' '}<span className="font-semibold text-ink">{action}</span> permission for <span className="font-semibold text-ink">{module}</span> will unlock this screen.
        </p>
        <p className="rounded bg-muted px-2 py-1 text-[12px] font-semibold text-muted-foreground">Signed in as {role.replace('_', ' ')}</p>
        <div className="mt-1 flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setRole('school_admin')}>Switch to School Administrator</Button>
          <Button size="sm" variant="ghost" onClick={() => useErp.getState().nav('W01')}>Back to dashboard</Button>
        </div>
      </div>
    </Card>
  );
}

/* ── Loading skeletons ── */

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-card border border-line bg-card p-4">
      <div className="mb-4 flex gap-3">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="ml-auto h-8 w-24" />
      </div>
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex gap-3">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton key={c} className={cn('h-6 flex-1', c === 0 && 'max-w-[180px]')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="rounded-card p-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="mt-2 h-7 w-24" />
          <Skeleton className="mt-2 h-3 w-16" />
        </Card>
      ))}
    </div>
  );
}

/* ── Stepper ── */

export function Stepper({ steps, current, onStepClick }: { steps: string[]; current: number; onStepClick?: (i: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-1" aria-label="Progress">
      {steps.map((s, i) => {
        const state = i < current ? 'done' : i === current ? 'current' : 'todo';
        return (
          <li key={s} className="flex items-center gap-1">
            <button
              type="button"
              disabled={!onStepClick || i > current}
              onClick={() => onStepClick?.(i)}
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition-colors',
                state === 'done' && 'bg-success-soft text-success',
                state === 'current' && 'bg-brand text-white',
                state === 'todo' && 'bg-muted text-muted-foreground',
                onStepClick && i <= current && 'cursor-pointer',
              )}
            >
              <span className={cn(
                'flex h-4.5 w-4.5 items-center justify-center rounded-full text-[10px]',
                state === 'done' && 'bg-success text-white',
                state === 'current' && 'bg-white/25 text-white',
                state === 'todo' && 'bg-background text-muted-foreground',
              )}>
                {state === 'done' ? <Check className="h-3 w-3" aria-hidden /> : i + 1}
              </span>
              {s}
            </button>
            {i < steps.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-line" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

/* ── Timeline ── */

export interface TimelineItem {
  title: string;
  description?: string;
  time?: string;
  actor?: string;
  tone?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

const TL_DOT = {
  success: 'bg-success',
  warning: 'bg-amber',
  danger: 'bg-danger',
  info: 'bg-brand',
  neutral: 'bg-[#C4CAD6]',
} as const;

export function Timeline({ items }: { items: TimelineItem[] }) {
  if (items.length === 0) return <EmptyState title="Nothing yet" description="Timeline events will appear here." />;
  return (
    <ol className="relative space-y-4 pl-5">
      <span className="absolute left-[5.5px] top-1 h-[calc(100%-8px)] w-px bg-line" aria-hidden />
      {items.map((it, i) => (
        <li key={i} className="relative">
          <span className={cn('absolute -left-5 top-1 h-[11px] w-[11px] rounded-full ring-4 ring-card', TL_DOT[it.tone ?? 'neutral'])} aria-hidden />
          <p className="text-[13px] font-semibold text-ink">{it.title}</p>
          {it.description && <p className="text-[12px] text-muted-foreground">{it.description}</p>}
          {(it.time || it.actor) && (
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              {it.actor && <span className="font-medium">{it.actor}</span>}
              {it.actor && it.time ? ' · ' : ''}
              {it.time}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

/* ── Operational alert card ── */

export function AlertCard({
  severity, title, detail, owner, age, status, action, onReview, reviewed,
}: {
  severity: 'high' | 'medium' | 'low';
  title: string;
  detail: string;
  owner?: string;
  age?: string;
  status?: string;
  action?: ReactNode;
  onReview?: () => void;
  reviewed?: boolean;
}) {
  const tone = severity === 'high' ? TONE_CLASS.danger : severity === 'medium' ? TONE_CLASS.warning : TONE_CLASS.info;
  const Icon = severity === 'high' ? AlertTriangle : Info;
  return (
    <div className={cn('rounded-card border bg-card p-4 shadow-sm', severity === 'high' ? 'border-danger/25' : severity === 'medium' ? 'border-amber/30' : 'border-line')}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className={cn('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full', tone)}>
            <Icon className="h-3.5 w-3.5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[13.5px] font-bold text-ink">{title}</p>
            <p className="text-[12.5px] text-muted-foreground">{detail}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
              {owner && <span>Owner: <span className="font-semibold text-ink-soft">{owner}</span></span>}
              {age && <span>Age: {age}</span>}
              {status && <span className={cn('rounded-full border px-1.5 py-0.5 font-semibold', tone)}>{reviewed ? 'Reviewed' : status}</span>}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {action}
          {onReview && !reviewed && (
            <Button size="sm" variant="outline" onClick={onReview}>Mark reviewed</Button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Search input ── */

export function SearchInput({
  value, onChange, placeholder = 'Search…', className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 rounded-control bg-background pl-8"
        aria-label={placeholder}
      />
      <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
    </div>
  );
}

/* ── Permission-locked button helper ── */

export function LockedHint({ children }: { children?: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Lock className="h-3 w-3" aria-hidden /> {children ?? 'Not permitted for your role'}
    </span>
  );
}
