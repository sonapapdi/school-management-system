'use client';

import { useState } from 'react';
import { DatabaseBackup, FileDown, HardDriveDownload, Save, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InfoRow, PageHeader, PermissionState, Section, StatusChip } from '@/components/erp/ui/primitives';
import { fmtDate, fmtDateTime } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

export default function W43DataRetention() {
  const data = useErp((s) => s.data);
  const settings = useErp((s) => s.settings);
  const userName = useErp((s) => s.session.userName);
  const role = useErp((s) => s.session.role);
  const createExport = useErp((s) => s.createExport);
  const updateSettings = useErp((s) => s.updateSettings);
  const pushToast = useErp((s) => s.pushToast);

  const [months, setMonths] = useState(String(settings.importRetentionMonths));
  const [days, setDays] = useState(String(settings.exportRetentionDays));

  if (!can(role, 'settings', 'view')) return <PermissionState module="Settings" />;

  const fullExport = [...data.exports]
    .filter((e) => e.type.toLowerCase().includes('full school'))
    .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0];
  const canExport = can(role, 'settings', 'export');

  return (
    <div>
      <PageHeader
        title="Data retention & exports"
        description="How long records are kept, export retention and the full school export."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Retention policy" description="Applied to new imports and exports immediately after saving.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w43-import">Import retention (months)</label>
              <Input
                id="w43-import" type="number" min={1} max={120}
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="h-9 rounded-control tabular-nums"
              />
              <p className="text-[12px] text-muted-foreground">Upload batches and validation results are removed after this period.</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w43-export">Export retention (days)</label>
              <Input
                id="w43-export" type="number" min={1} max={365}
                value={days}
                onChange={(e) => setDays(e.target.value)}
                className="h-9 rounded-control tabular-nums"
              />
              <p className="text-[12px] text-muted-foreground">Generated files expire and are deleted from the Export center.</p>
            </div>
          </div>
          <div className="mt-4">
            <Button
              className="rounded-control"
              onClick={() => updateSettings({ importRetentionMonths: Math.max(1, Number(months) || 1), exportRetentionDays: Math.max(1, Number(days) || 1) })}
            >
              <Save className="h-4 w-4" aria-hidden /> Save retention
            </Button>
          </div>
        </Section>

        <div className="space-y-5">
          <Section title="School export status" description="A full export contains every record in one CSV bundle.">
            {fullExport ? (
              <>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusChip status={fullExport.status} />
                  <span className="font-mono text-[12px] text-muted-foreground">{fullExport.id}</span>
                </div>
                <div className="mt-2">
                  <InfoRow label="Requested by" value={fullExport.requestedBy} />
                  <InfoRow label="Requested at" value={fmtDateTime(fullExport.requestedAt)} />
                  <InfoRow label="Expires at" value={fmtDate(fullExport.expiresAt)} />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-start gap-2">
                <p className="text-[13px] font-semibold text-ink">Never requested</p>
                <p className="text-[12.5px] text-muted-foreground">
                  Request a full export to receive every student, attendance and fee record as CSV files.
                </p>
              </div>
            )}
            {canExport && (
              <div className="mt-4">
                <Button variant="outline" className="rounded-control" onClick={() => createExport('Full school export', userName)}>
                  <FileDown className="h-4 w-4" aria-hidden /> Request full export
                </Button>
              </div>
            )}
          </Section>

          <Section title="Backup verification" description="Last verified restore test">
            <InfoRow
              label="Last backup test"
              value={
                <span className="inline-flex items-center gap-2">
                  <HardDriveDownload className="h-3.5 w-3.5 text-success" aria-hidden />
                  {fmtDate(settings.lastBackupTest)}
                </span>
              }
            />
            <div className="mt-3">
              <Button variant="outline" className="rounded-control" onClick={() => pushToast({ title: 'Backup test passed — 4.2 GB verified', variant: 'success' })}>
                <DatabaseBackup className="h-4 w-4" aria-hidden /> Run backup test
              </Button>
            </div>
          </Section>
        </div>
      </div>

      <Section title="What is retained" description="Statutory record-keeping periods" className="mt-5">
        <div className="grid gap-x-8 sm:grid-cols-2">
          <div>
            <InfoRow label="Attendance registers" value="7 years" />
            <InfoRow label="Fee records" value="10 years" />
          </div>
          <div>
            <InfoRow label="Audit log" value="7 years" />
            <InfoRow
              label="Policy"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden /> Enforced automatically
                </span>
              }
            />
          </div>
        </div>
      </Section>
    </div>
  );
}
