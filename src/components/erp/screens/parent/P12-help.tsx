'use client';

import { ChevronRight, Clock, LifeBuoy, LogOut, Mail, MapPin, Phone as PhoneIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { ComingLater } from '@/components/erp/ui/primitives';
import { useErp } from '@/lib/erp/store';

function ContactRow({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 border-b border-line/60 py-2 last:border-0">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="w-20 shrink-0 text-[12px] font-medium text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 break-words text-right text-[12.5px] font-semibold text-ink">{value}</span>
    </div>
  );
}

const COMING_LATER = ['Chat with teachers', 'Online payments', 'Fees via UPI'];

export default function P12Help() {
  const settings = useErp((s) => s.settings);
  const openDialog = useErp((s) => s.openDialog);

  const telHref = `tel:${settings.phone.replace(/[^+\d]/g, '')}`;
  const mailHref = `mailto:${settings.email}`;

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Help & contact" accent="#5B5FEF" />

      <div className="space-y-3 p-4 pb-6">
        {/* School contact */}
        <PhoneCard>
          <p className="text-[13px] font-bold text-ink">School contact</p>
          <div className="mt-1.5">
            <ContactRow icon={PhoneIcon} label="Phone" value={settings.phone} />
            <ContactRow icon={Mail} label="Email" value={settings.email} />
            <ContactRow icon={Clock} label="Office hours" value="Mon–Sat, 9:00 am – 3:00 pm" />
            <ContactRow icon={MapPin} label="Address" value={settings.address} />
          </div>
          <div className="mt-2 space-y-2">
            <a
              href={telHref}
              className="flex min-h-11 items-center gap-2.5 rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:bg-[#FAFBFF]"
            >
              <PhoneIcon className="h-4 w-4 text-brand" aria-hidden />
              Call school
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden />
            </a>
            <a
              href={mailHref}
              className="flex min-h-11 items-center gap-2.5 rounded-[12px] border border-line bg-card px-3.5 py-2.5 text-[13.5px] font-semibold text-ink transition-colors hover:bg-[#FAFBFF]"
            >
              <Mail className="h-4 w-4 text-brand" aria-hidden />
              Email school
              <ChevronRight className="ml-auto h-4 w-4 text-muted-foreground" aria-hidden />
            </a>
          </div>
        </PhoneCard>

        {/* Support */}
        <PhoneCard>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand-dark">
              <LifeBuoy className="h-5 w-5" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-ink">Support</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                Support reference <span className="font-bold text-ink">TKT-2026-0719</span>
              </p>
              <p className="text-[12.5px] text-muted-foreground">Typical reply within 1 school day</p>
            </div>
          </div>
        </PhoneCard>

        {/* Coming later */}
        <PhoneCard>
          <p className="text-[13px] font-bold text-ink">Coming later</p>
          <div className="mt-1">
            {COMING_LATER.map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-between gap-2 border-b border-line/60 py-2.5 last:border-0"
              >
                <span className="text-[13px] font-semibold text-ink-soft">{feature}</span>
                <ComingLater />
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[12px] font-medium text-muted-foreground">
            Payments are collected at the school office. This app is read-only.
          </p>
        </PhoneCard>

        {/* Sign out */}
        <PhoneCard>
          <Button
            variant="outline"
            className="h-12 w-full rounded-control border-danger/40 font-bold text-danger hover:bg-danger-soft hover:text-danger"
            onClick={() => openDialog('D06')}
          >
            <LogOut className="h-4 w-4" aria-hidden /> Sign out
          </Button>
        </PhoneCard>
      </div>
    </div>
  );
}
