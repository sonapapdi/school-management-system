'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/erp/ui/primitives';
import { useErp } from '@/lib/erp/store';

export default function A04Recover() {
  const [identity, setIdentity] = useState('');
  const [identityError, setIdentityError] = useState<string | undefined>(undefined);
  const [codeSent, setCodeSent] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>(undefined);
  const [confirmError, setConfirmError] = useState<string | undefined>(undefined);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);

  const sendCode = () => {
    if (!identity.trim()) {
      setIdentityError('Mobile or email is required.');
      return;
    }
    setIdentityError(undefined);
    pushToast({ title: 'Reset code sent', variant: 'success' });
    setCodeSent(true);
  };

  const resetAccess = () => {
    const pwShort = password.length < 8;
    const confirmShort = confirm.length < 8;
    const mismatch = !pwShort && !confirmShort && password !== confirm;
    setPasswordError(pwShort || confirmShort ? 'Password must be at least 8 characters.' : undefined);
    setConfirmError(mismatch ? 'Passwords do not match.' : undefined);
    if (pwShort || confirmShort || mismatch) return;
    pushToast({ title: 'Access reset', description: 'Sign in with your new password.', variant: 'success' });
    nav('A01');
  };

  return (
    <div className="rounded-card border border-line bg-card p-6 shadow-sm sm:p-7">
      <h1 className="font-heading text-[22px] font-bold text-ink">Recover access</h1>
      <p className="mt-1 text-[13px] text-muted-foreground">
        Request a reset code, then set a new password for your account.
      </p>

      <form
        className="mt-6"
        onSubmit={(e) => { e.preventDefault(); if (codeSent) resetAccess(); else sendCode(); }}
      >
        {/* Step 1 — Send code */}
        <section>
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Step 1 · Send code</p>
          <div className="mt-2.5">
            <Field label="Mobile or email" required error={identityError}>
              <div className="relative">
                <Smartphone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                  value={identity}
                  onChange={(e) => { setIdentity(e.target.value); setIdentityError(undefined); }}
                  placeholder="e.g. +91 98765 43210 or you@sunrisepublic.edu.in"
                  className="h-11 rounded-control bg-background pl-9"
                  aria-label="Mobile or email"
                />
              </div>
            </Field>
            <Button
              type="button"
              onClick={sendCode}
              variant={codeSent ? 'outline' : 'default'}
              className="mt-3 h-11 w-full rounded-control font-bold"
            >
              Send code
            </Button>
          </div>
        </section>

        {/* Step 2 — Reset */}
        {codeSent && (
          <section className="mt-6 border-t border-line pt-5">
            <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Step 2 · Reset</p>
            <div className="mt-2.5 space-y-4">
              <Field label="New password" required error={passwordError}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setPasswordError(undefined); }}
                    className="h-11 rounded-control bg-background pl-9 pr-10"
                    aria-label="New password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
                    aria-label={showPw ? 'Hide new password' : 'Show new password'}
                  >
                    {showPw ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </Field>

              <Field label="Confirm password" required error={confirmError}>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => { setConfirm(e.target.value); setConfirmError(undefined); }}
                    className="h-11 rounded-control bg-background pl-9 pr-10"
                    aria-label="Confirm password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
                    aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                  </button>
                </div>
              </Field>
            </div>

            <Button type="submit" className="mt-5 h-11 w-full rounded-control font-bold">
              Reset access
            </Button>
          </section>
        )}
      </form>

      <button
        type="button"
        onClick={() => nav('A01')}
        className="mt-5 block w-full text-center text-[13px] font-semibold text-brand-dark hover:underline"
      >
        Back to sign in
      </button>
    </div>
  );
}
