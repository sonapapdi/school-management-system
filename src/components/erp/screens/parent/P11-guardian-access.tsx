'use client';

import { Check, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneCard, PhoneHeader } from '@/components/erp/ui/phone';
import { EmptyState, StatusChip } from '@/components/erp/ui/primitives';
import { guardiansOf } from '@/lib/erp/derive';
import { useErp } from '@/lib/erp/store';

const CHILD_ID = 'stu-ananya';

export default function P11GuardianAccess() {
  const data = useErp((s) => s.data);
  const userName = useErp((s) => s.session.userName);
  const createOfficeTask = useErp((s) => s.createOfficeTask);
  const pushToast = useErp((s) => s.pushToast);

  const guardians = guardiansOf(data, CHILD_ID);

  const requestReview = () => {
    createOfficeTask({
      studentId: CHILD_ID,
      note: 'Access review requested for guardian list',
      from: userName,
    });
    pushToast({
      title: 'Request sent to the office',
      description: 'The office will review guardian access.',
      variant: 'success',
    });
  };

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader title="Guardian access" accent="#5B5FEF" />

      <div className="space-y-3 p-4 pb-6">
        {guardians.length === 0 ? (
          <EmptyState
            title="No guardians linked"
            description="Guardian records are maintained by the school office."
          />
        ) : (
          guardians.map((g) => (
            <PhoneCard key={g.id}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-[14px] font-bold text-ink">{g.name}</p>
                <span className="rounded-full border border-line bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {g.relationship}
                </span>
              </div>
              <div className="mt-1.5 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-muted-foreground">App access</span>
                  <StatusChip status={g.appAccess ? 'active' : 'inactive'} />
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] text-muted-foreground">Verified mobile</span>
                  {g.verified ? (
                    <span className="flex items-center gap-1 text-[13px] font-semibold text-ink">
                      {g.mobile}
                      <Check className="h-3.5 w-3.5 text-success" aria-label="Verified" />
                    </span>
                  ) : (
                    <span className="text-[13px] font-semibold text-muted-foreground">Not verified</span>
                  )}
                </div>
              </div>
            </PhoneCard>
          ))
        )}

        {/* Access policy note */}
        <PhoneCard className="border-brand/20 bg-[#FAFBFF]">
          <p className="flex items-start gap-2 text-[12.5px] text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
            Access is granted only through an explicit verified relationship. Ask the office to change it.
          </p>
        </PhoneCard>

        <Button variant="outline" className="h-12 w-full rounded-control font-bold" onClick={requestReview}>
          Request access review
        </Button>
      </div>
    </div>
  );
}
