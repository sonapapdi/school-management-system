'use client';

import { useEffect, useState } from 'react';
import { Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/erp/ui/primitives';
import { ErpCodeInput } from '@/components/erp/ui/overlays';
import { useErp } from '@/lib/erp/store';

export default function A03Verification() {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | undefined>(undefined);
  const [seconds, setSeconds] = useState(30);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const signIn = useErp((s) => s.signIn);

  const running = seconds > 0;
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setSeconds((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [running]);

  const submit = () => {
    if (code.length !== 6) {
      setCodeError('Enter the six-digit code from the SMS.');
      return;
    }
    setCodeError(undefined);
    pushToast({ title: 'Mobile verified', variant: 'success' });
    signIn('teacher');
  };

  const resend = () => {
    setSeconds(30);
    pushToast({ title: 'Code resent', variant: 'info' });
  };

  return (
    <div className="rounded-card border border-line bg-card p-6 shadow-sm sm:p-7">
      <h1 className="font-heading text-[22px] font-bold text-ink">Enter verification code</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">Confirm this device with the one-time code sent to you.</p>

      <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
        <Field label="Six-digit code" required error={codeError}>
          <ErpCodeInput value={code} onChange={(v) => { setCode(v); setCodeError(undefined); }} />
        </Field>

        {/* Masked destination */}
        <Field label="Destination">
          <div className="flex items-center gap-2.5 rounded-control border border-line bg-[#FAFBFE] px-3.5 py-2.5">
            <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            <div className="min-w-0">
              <p className="text-[14px] font-bold tabular-nums text-ink">+91 ••••• •4321</p>
              <p className="text-[12px] text-muted-foreground">SMS sent just now</p>
            </div>
          </div>
        </Field>

        {/* Resend timer */}
        <div className="flex items-center justify-between gap-2">
          {running ? (
            <p className="text-[12.5px] text-muted-foreground">
              You can resend the code in <span className="font-semibold tabular-nums text-ink-soft">{seconds}s</span>.
            </p>
          ) : (
            <p className="text-[12.5px] text-muted-foreground">Didn’t receive the code?</p>
          )}
          {!running && (
            <Button type="button" variant="outline" size="sm" className="rounded-control font-semibold" onClick={resend}>
              Resend code
            </Button>
          )}
        </div>

        <Button type="submit" className="h-11 w-full rounded-control font-bold">
          Verify
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => nav('A01')}
          className="h-10 w-full rounded-control font-semibold text-ink-soft"
        >
          Change number
        </Button>
      </form>
    </div>
  );
}
