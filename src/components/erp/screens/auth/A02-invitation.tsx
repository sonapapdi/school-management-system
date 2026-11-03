'use client';

import { Clock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InfoRow } from '@/components/erp/ui/primitives';
import { useErp } from '@/lib/erp/store';

export default function A02Invitation() {
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);

  const decline = () => {
    pushToast({ title: 'Invitation declined', description: 'The school office has been notified.', variant: 'info' });
    nav('A01');
  };

  return (
    <>
      <div className="rounded-card border border-line bg-card p-6 shadow-sm sm:p-7">
        <h1 className="font-heading text-[22px] font-bold text-ink">Activate your invitation</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">You were invited to join the school workspace. Review the details below.</p>

        {/* Invitation summary — envelope card */}
        <div className="mt-5 rounded-card border border-line bg-[#FAFBFE] p-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/10" aria-hidden>
              <Mail className="h-4 w-4 text-brand-dark" />
            </span>
            <div className="min-w-0">
              <p className="text-[13.5px] font-bold text-ink">Invitation from the school office</p>
              <p className="text-[12px] text-muted-foreground">One account is waiting for your confirmation.</p>
            </div>
          </div>
          <div className="mt-3">
            <InfoRow label="School name" value="Sunrise Public School" />
            <InfoRow label="Invited name" value="Farah Khan" />
            <InfoRow label="Role" value="Class Teacher" />
            <InfoRow
              label="Invitation expiry"
              value={
                <span className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1">
                  24 Jul 2026
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber/25 bg-amber-soft px-2 py-0.5 text-[11px] font-semibold text-[#8a5a00]">
                    <Clock className="h-3 w-3" aria-hidden /> Expires in 3 days
                  </span>
                </span>
              }
            />
          </div>
        </div>

        <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground">
          Accepting links this invitation to your mobile number. Decline notifies the school office.
        </p>

        <form className="mt-5 space-y-2.5" onSubmit={(e) => { e.preventDefault(); nav('A03'); }}>
          <Button type="submit" className="h-11 w-full rounded-control font-bold">
            Continue
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={decline}
            className="h-11 w-full rounded-control font-bold text-danger hover:bg-danger-soft hover:text-danger"
          >
            Decline
          </Button>
        </form>

        <button
          type="button"
          onClick={() => nav('A01')}
          className="mt-4 block w-full text-center text-[13px] font-semibold text-brand-dark hover:underline"
        >
          Wrong invitation?
        </button>
      </div>

      {/* Prototype tip */}
      <div className="mt-3 rounded-[12px] border border-dashed border-line bg-[#FAFBFE] p-3.5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Prototype tip</p>
        <p className="mt-1 text-[12px] text-muted-foreground">Any role can be explored from the Demo button inside the app.</p>
      </div>
    </>
  );
}
