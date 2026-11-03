'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/erp/ui/primitives';
import { useErp } from '@/lib/erp/store';
import { ROLE_LABEL } from '@/lib/erp/tokens';
import type { Role } from '@/lib/erp/types';

export default function A01SignIn() {
  const [schoolCode, setSchoolCode] = useState('SUN-PUNE-001');
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<{ identity?: string; password?: string }>({});
  const signIn = useErp((s) => s.signIn);
  const nav = useErp((s) => s.nav);
  const setRole = useErp((s) => s.setRole);

  const submit = () => {
    const next: typeof errors = {};
    if (!identity.trim()) next.identity = 'Mobile or email is required.';
    if (!password) next.password = 'Password is required.';
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    const r: Role = identity.toLowerCase().includes('teacher')
      ? 'teacher'
      : identity.toLowerCase().includes('parent') || identity.toLowerCase().includes('rajesh')
        ? 'parent'
        : identity.toLowerCase().includes('account') || identity.toLowerCase().includes('amit')
          ? 'accountant'
          : identity.toLowerCase().includes('principal') || identity.toLowerCase().includes('meera')
            ? 'principal'
            : 'school_admin';
    signIn(r);
  };

  return (
    <div className="rounded-card border border-line bg-card p-6 shadow-sm sm:p-7">
        <h1 className="font-heading text-[22px] font-bold text-ink">Sign in</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">Use your school invitation to reach the right workspace.</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); submit(); }}>
          <Field label="School code or invitation" required hint="Ask your school office if you are unsure.">
            <div className="relative">
              <School className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                value={schoolCode}
                onChange={(e) => setSchoolCode(e.target.value)}
                className="h-11 rounded-control bg-background pl-9"
                aria-label="School code or invitation"
              />
            </div>
          </Field>

          <Field label="Mobile or email" required error={errors.identity}>
            <Input
              value={identity}
              onChange={(e) => { setIdentity(e.target.value); setErrors((x) => ({ ...x, identity: undefined })); }}
              placeholder="e.g. sunita@sunrisepublic.edu.in"
              className="h-11 rounded-control bg-background"
              aria-label="Mobile or email"
            />
          </Field>

          <Field label="Password" required error={errors.password}>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((x) => ({ ...x, password: undefined })); }}
                className="h-11 rounded-control bg-background pl-9 pr-10"
                aria-label="Password"
              />
              <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground" aria-label={showPw ? 'Hide password' : 'Show password'}>
                {showPw ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              </button>
            </div>
          </Field>

          <Button type="submit" className="h-11 w-full rounded-control font-bold">
            Sign in
          </Button>
          <button type="button" onClick={() => nav('A04')} className="w-full text-center text-[13px] font-semibold text-brand-dark hover:underline">
            Forgot access?
          </button>
        </form>

        <div className="mt-6 rounded-[12px] border border-dashed border-line bg-[#FAFBFE] p-3.5">
          <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Prototype — quick sign in</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className="rounded-full border border-line bg-card px-2.5 py-1.5 text-[11.5px] font-semibold text-ink-soft hover:border-brand/40 hover:bg-brand/5"
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Invited staff can <button type="button" className="font-semibold text-brand-dark underline" onClick={() => nav('A02')}>activate an invitation</button>. New device? <button type="button" className="font-semibold text-brand-dark underline" onClick={() => nav('A03')}>Enter verification code</button>.</p>
        </div>
      </div>
  );
}
