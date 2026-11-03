'use client';

import { useState } from 'react';
import { ImageUp, Palette, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader, PermissionState, Section } from '@/components/erp/ui/primitives';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'America/New_York', 'UTC'];

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-semibold text-ink-soft">{label}</label>
      {children}
      {hint && <p className="text-[12px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export default function W40SchoolProfile() {
  const theme = useErp((s) => s.theme);
  const settings = useErp((s) => s.settings);
  const role = useErp((s) => s.session.role);
  const updateTheme = useErp((s) => s.updateTheme);
  const updateSettings = useErp((s) => s.updateSettings);
  const pushToast = useErp((s) => s.pushToast);

  const [schoolName, setSchoolName] = useState(theme.schoolName);
  const [campusName, setCampusName] = useState(theme.campusName);
  const [logoLetter, setLogoLetter] = useState(theme.logoLetter);
  const [primary, setPrimary] = useState(theme.primary);
  const [primaryDark, setPrimaryDark] = useState(theme.primaryDark);
  const [cardRadius, setCardRadius] = useState(theme.cardRadius);
  const [address, setAddress] = useState(settings.address);
  const [timezone, setTimezone] = useState(settings.timezone);
  const [phone, setPhone] = useState(settings.phone);
  const [email, setEmail] = useState(settings.email);
  const [preview, setPreview] = useState(false);

  if (!can(role, 'settings', 'view')) return <PermissionState module="Settings" />;

  const save = () => {
    updateTheme({
      schoolName: schoolName.trim() || theme.schoolName,
      campusName: campusName.trim() || theme.campusName,
      logoLetter: (logoLetter.trim() || theme.logoLetter).slice(0, 1).toUpperCase(),
      primary,
      primaryDark,
      cardRadius,
    });
    updateSettings({ address, phone, email, timezone });
  };

  return (
    <div>
      <PageHeader
        title="School profile"
        description="School identity, contact details and branding used across the web and mobile apps."
        actions={
          <>
            <Button variant="outline" className="rounded-control" onClick={() => setPreview((p) => !p)}>
              Preview header
            </Button>
            <Button className="rounded-control" onClick={save}>
              <Save className="h-4 w-4" aria-hidden /> Save changes
            </Button>
          </>
        }
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="School identity">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School name">
              <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} className="h-9 rounded-control" />
            </Field>
            <Field label="Campus">
              <Input value={campusName} onChange={(e) => setCampusName(e.target.value)} className="h-9 rounded-control" />
            </Field>
            <Field label="Address" hint="Shown on receipts and the parent app help screen.">
              <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9 rounded-control" />
            </Field>
            <Field label="Timezone">
              <Select value={timezone} onValueChange={setTimezone}>
                <SelectTrigger className="h-9 rounded-control"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Phone">
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-9 rounded-control" />
            </Field>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 rounded-control" />
            </Field>
            <Field label="Logo" hint="One letter is used as the monogram in the sidebar.">
              <div className="flex items-center gap-2">
                <Input
                  value={logoLetter}
                  maxLength={1}
                  onChange={(e) => setLogoLetter(e.target.value)}
                  className="h-9 w-16 rounded-control text-center font-heading text-[15px] font-bold uppercase"
                  aria-label="Logo monogram letter"
                />
                <Button variant="outline" className="rounded-control" onClick={() => pushToast({ title: 'Logo upload is a placeholder in this prototype', variant: 'info' })}>
                  <ImageUp className="h-4 w-4" aria-hidden /> Upload logo
                </Button>
              </div>
            </Field>
          </div>
        </Section>

        <Section title="Branding" description="Colors and corner radius applied live across the prototype.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Primary color">
              <div className="flex items-center gap-2">
                <input
                  type="color" value={primary} onChange={(e) => setPrimary(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-control border border-line bg-background p-1"
                  aria-label="Primary color picker"
                />
                <Input value={primary} onChange={(e) => setPrimary(e.target.value)} className="h-9 w-28 rounded-control font-mono text-[12px]" aria-label="Primary color hex" />
              </div>
            </Field>
            <Field label="Primary dark">
              <div className="flex items-center gap-2">
                <input
                  type="color" value={primaryDark} onChange={(e) => setPrimaryDark(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded-control border border-line bg-background p-1"
                  aria-label="Primary dark color picker"
                />
                <Input value={primaryDark} onChange={(e) => setPrimaryDark(e.target.value)} className="h-9 w-28 rounded-control font-mono text-[12px]" aria-label="Primary dark hex" />
              </div>
            </Field>
            <Field label="Secondary teal" hint="Display only — used for staff accents.">
              <div className="flex items-center gap-2">
                <span className="h-9 w-12 rounded-control border border-line" style={{ backgroundColor: theme.secondary }} aria-hidden />
                <span className="font-mono text-[12px] text-muted-foreground">{theme.secondary}</span>
              </div>
            </Field>
            <Field label={`Card radius — ${cardRadius}px`} hint="Between 8 and 20.">
              <Slider
                min={8} max={20} step={1}
                value={[cardRadius]}
                onValueChange={(v) => setCardRadius(v[0] ?? cardRadius)}
                className="mt-2 w-full max-w-[220px]"
                aria-label="Card radius"
              />
            </Field>
          </div>

          {preview && (
            <div className="mt-5 rounded-card border border-dashed border-line bg-page p-4" style={{ borderRadius: cardRadius }}>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Header preview</p>
              <div className="flex items-center gap-2.5 rounded-card border border-line bg-card p-3" style={{ borderRadius: cardRadius }}>
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] font-heading text-[16px] font-extrabold text-white shadow-sm"
                  style={{ backgroundColor: primary }}
                  aria-hidden
                >
                  {logoLetter.toUpperCase()}
                </span>
                <div className="min-w-0 leading-tight">
                  <p className="truncate font-heading text-[14px] font-bold text-ink">{theme.productName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{schoolName} · {campusName}</p>
                </div>
              </div>
            </div>
          )}
        </Section>
      </div>

      <div className="mt-5 flex items-start gap-2.5 rounded-card border border-line bg-card p-4 text-[13px] shadow-sm">
        <Palette className="mt-0.5 h-4 w-4 shrink-0 text-brand-dark" aria-hidden />
        <p className="text-muted-foreground">
          Changes apply to the prototype UI immediately after saving. The backend enforces the final branding and contact records.
        </p>
      </div>
    </div>
  );
}
