'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { ComingLater } from '@/components/erp/ui/primitives';
import { useErp } from '@/lib/erp/store';

export default function T13Settings() {
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);

  const [language, setLanguage] = useState('English');
  const [reminder, setReminder] = useState(true);

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Settings" subtitle="Teacher app preferences" accent="#0E9F9A" />
      <div className="space-y-3 p-4 pb-6">
        <PhoneCard>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">Language</p>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label="App language"
            className="mt-2 h-11 min-h-[44px] w-full rounded-control border border-line bg-card px-3 text-[13.5px] font-semibold text-ink"
          >
            <option value="English">English</option>
            <option value="मराठी">मराठी</option>
          </select>
        </PhoneCard>

        <PhoneCard>
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[13.5px] font-semibold text-ink">Daily attendance reminder 8:00 am</p>
              <p className="text-[11.5px] text-muted-foreground">Reminds you to finish and submit the register.</p>
            </div>
            <Switch
              checked={reminder}
              onCheckedChange={setReminder}
              aria-label="Daily attendance reminder 8:00 am"
              className="data-[state=checked]:bg-teal"
            />
          </div>
        </PhoneCard>

        <PhoneCard>
          <p className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">App version</p>
          <p className="mt-1 font-heading text-[15px] font-bold text-ink">v1.0.0 · MVP build</p>
          <p className="mt-0.5 text-[12px] text-muted-foreground">Exams, homework and timetable come later</p>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {['Homework', 'Timetable', 'Exams & report cards'].map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-card px-2.5 py-1 text-[11.5px] font-semibold text-ink-soft"
              >
                {label}
                <ComingLater />
              </span>
            ))}
          </div>
        </PhoneCard>

        <div className="grid gap-2">
          <Button
            className="h-12 min-h-[44px] rounded-control bg-teal font-bold hover:bg-teal/90"
            onClick={() => pushToast({ title: 'Preferences saved on this device', variant: 'success' })}
          >
            Save preference
          </Button>
          <Button
            variant="outline"
            className="h-12 min-h-[44px] rounded-control border-danger/40 text-danger hover:bg-danger-soft"
            onClick={() => openDialog('D06')}
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
