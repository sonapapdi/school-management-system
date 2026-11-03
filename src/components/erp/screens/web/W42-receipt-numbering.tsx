'use client';

import { useState } from 'react';
import { FlaskConical, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { Money, PageHeader, PermissionState, Section, SkeletonTable } from '@/components/erp/ui/primitives';
import { nextReceiptNo, studentName } from '@/lib/erp/derive';
import { fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';

interface ReceiptRow {
  id: string;
  no: string;
  date: string;
  student: string;
  amount: number;
  mode: string;
}

export default function W42ReceiptNumbering() {
  const data = useErp((s) => s.data);
  const settings = useErp((s) => s.settings);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const updateSettings = useErp((s) => s.updateSettings);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const [prefix, setPrefix] = useState(settings.receiptPrefix);
  const [nextNo, setNextNo] = useState<number>(() => {
    const full = nextReceiptNo(data);
    return Number(full.split('/').pop()) || 1;
  });
  const [yearId, setYearId] = useState(ayId);

  const padded = String(Math.max(0, Math.round(nextNo))).padStart(5, '0');
  const preview = `${prefix}${padded}`;

  const recent = [...data.receipts]
    .sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no))
    .slice(0, 8)
    .map<ReceiptRow>((r) => ({
      id: r.id,
      no: r.no,
      date: r.date,
      student: studentName(data, r.studentId),
      amount: r.amount,
      mode: r.mode,
    }));

  const columns: Column<ReceiptRow>[] = [
    { key: 'no', header: 'Receipt number', sortValue: (r) => r.no, render: (r) => <span className="font-mono text-[12px] font-semibold text-ink">{r.no}</span> },
    { key: 'date', header: 'Date', sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: 'student', header: 'Student', sortValue: (r) => r.student },
    { key: 'amount', header: 'Amount', align: 'right', sortValue: (r) => r.amount, render: (r) => <Money value={r.amount} /> },
    { key: 'mode', header: 'Mode', sortValue: (r) => r.mode },
  ];

  if (!can(role, 'settings', 'view')) return <PermissionState module="Settings" />;

  return (
    <div>
      <PageHeader
        title="Receipt numbering"
        description="Prefix, academic year and next receipt number used by the collection desk."
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Number format">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w42-prefix">Prefix</label>
              <Input id="w42-prefix" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="h-9 rounded-control font-mono text-[13px]" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink-soft">Academic year</label>
              <Select value={yearId} onValueChange={setYearId}>
                <SelectTrigger className="h-9 rounded-control"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {data.academicYears.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w42-next">Next number</label>
              <Input
                id="w42-next" type="number" min={0}
                value={nextNo}
                onChange={(e) => setNextNo(Math.max(0, Number(e.target.value) || 0))}
                className="h-9 rounded-control tabular-nums"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button className="rounded-control" onClick={() => updateSettings({ receiptPrefix: prefix })}>
              <Save className="h-4 w-4" aria-hidden /> Save format
            </Button>
            <Button
              variant="outline" className="rounded-control"
              onClick={() => {
                const full = nextReceiptNo(data);
                setNextNo(Number(full.split('/').pop()) || 1);
                pushToast({ title: 'Preview generated', description: `Next receipt would be ${preview}`, variant: 'info' });
              }}
            >
              <FlaskConical className="h-4 w-4" aria-hidden /> Test preview
            </Button>
          </div>
        </Section>

        <Section title="Format preview" description="Exactly how the next receipt number will print.">
          <div className="flex min-h-[96px] items-center justify-center rounded-card border border-dashed border-brand/40 bg-page p-6">
            <p className="font-mono text-2xl font-bold tracking-wide text-brand-dark sm:text-3xl">{preview}</p>
          </div>
          <p className="mt-3 text-[12px] text-muted-foreground">
            Prefix + next number padded to 5 digits. Current sequence continues from {data.receipts.length} issued receipt{data.receipts.length === 1 ? '' : 's'}.
          </p>
        </Section>
      </div>

      <div className="mt-5">
        <Section title="Recent receipts" description="Last 8 receipts issued" padded={false}>
          {loading ? (
            <div className="p-4"><SkeletonTable rows={6} cols={5} /></div>
          ) : (
            <DataTable rows={recent} columns={columns} rowKey={(r) => r.id} pageSize={8} emptyTitle="No receipts yet" />
          )}
        </Section>
      </div>
    </div>
  );
}
