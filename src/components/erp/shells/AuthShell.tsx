'use client';

import { ShieldCheck, Sparkles } from 'lucide-react';
import { useErp } from '@/lib/erp/store';

export function AuthShell({ children, title }: { children: React.ReactNode; title?: string }) {
  const theme = useErp((s) => s.theme);
  return (
    <div className="flex min-h-screen flex-col bg-page lg:flex-row">
      {/* Brand panel */}
      <aside className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-card p-10 lg:flex xl:p-14">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand/5" aria-hidden />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-teal/5" aria-hidden />
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] font-heading text-xl font-extrabold text-white shadow-sm" style={{ backgroundColor: theme.primary }} aria-hidden>
            {theme.logoLetter}
          </span>
          <div>
            <p className="font-heading text-[16px] font-bold text-ink">{theme.productName}</p>
            <p className="text-[12px] text-muted-foreground">for Indian private schools</p>
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="font-heading text-3xl font-extrabold leading-tight text-ink">
            One calm system for attendance, fees and everyday school operations.
          </h1>
          <p className="mt-4 text-[14px] leading-relaxed text-muted-foreground">
            Built for schools of 200–800 students. Role-aware, audit-friendly and fast —
            with a read-only parent app your families can trust.
          </p>
          <ul className="mt-8 space-y-3 text-[13px] font-medium text-ink-soft">
            {['Attendance submitted before 9:15 am, every day', 'Receipts and ledgers that always balance', 'Approvals with a full audit trail'].map((t) => (
              <li key={t} className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-success-soft"><ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden /></span>
                {t}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-[12px] text-muted-foreground">
          Prototype data — {theme.schoolName}, {theme.campusName} · Academic year 2026-27
        </p>
      </aside>

      {/* Form side */}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center gap-3 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-[12px] font-heading text-lg font-extrabold text-white" style={{ backgroundColor: theme.primary }} aria-hidden>
              {theme.logoLetter}
            </span>
            <div>
              <p className="font-heading text-[15px] font-bold text-ink">{theme.productName}</p>
              <p className="text-[11.5px] text-muted-foreground">{theme.schoolName}</p>
            </div>
          </div>
          {title && (
            <div className="mb-5 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wide text-brand-dark lg:hidden">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> {title}
            </div>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
