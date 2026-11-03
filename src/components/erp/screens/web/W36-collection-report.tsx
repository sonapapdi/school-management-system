'use client';

import { useMemo, useState } from 'react';
import { Banknote, FileText, Landmark, Printer, Smartphone } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { Money, PageHeader, PermissionState, Section, SkeletonTable } from '@/components/erp/ui/primitives';
import { collectionsByMode, studentName } from '@/lib/erp/derive';
import { downloadCsv, fmtDate, useFakeLoad } from '@/lib/erp/utils';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import type { PaymentMode } from '@/lib/erp/types';

const MODES: PaymentMode[] = ['Cash', 'UPI', 'Bank transfer', 'Cheque'];
const MODE_ICON: Record<PaymentMode, LucideIcon> = {
  Cash: Banknote, UPI: Smartphone, 'Bank transfer': Landmark, Cheque: FileText,
};

interface PayRow {
  id: string;
  date: string;
  receiptNo: string;
  student: string;
  admNo: string;
  mode: PaymentMode;
  gross: number;
  reversal: number;
  net: number;
}

export default function W36CollectionReport() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const loading = useFakeLoad(350);

  const [from, setFrom] = useState('2026-07-01');
  const [to, setTo] = useState(schoolDate);
  const [mode, setMode] = useState<'all' | PaymentMode>('all');
  const [applied, setApplied] = useState<{ from: string; to: string; mode: 'all' | PaymentMode }>({ from: '2026-07-01', to: schoolDate, mode: 'all' });

  const byMode = useMemo(() => collectionsByMode(data, applied.from, applied.to), [data, applied]);

  const rows = useMemo<PayRow[]>(() => {
    return data.payments
      .filter((p) => p.date >= applied.from && p.date <= applied.to)
      .filter((p) => applied.mode === 'all' || p.mode === applied.mode)
      .map((p) => {
        const reversed = p.status === 'reversed';
        const receipt = data.receipts.find((r) => r.paymentId === p.id);
        const st = data.students.find((x) => x.id === p.studentId);
        return {
          id: p.id,
          date: p.date,
          receiptNo: receipt?.no ?? '—',
          student: studentName(data, p.studentId),
          admNo: st?.admNo ?? '—',
          mode: p.mode,
          gross: p.amount,
          reversal: reversed ? p.amount : 0,
          net: reversed ? 0 : p.amount,
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.receiptNo.localeCompare(b.receiptNo));
  }, [data, applied]);

  const totals = rows.reduce(
    (t, r) => ({ gross: t.gross + r.gross, reversal: t.reversal + r.reversal, net: t.net + r.net }),
    { gross: 0, reversal: 0, net: 0 },
  );

  const columns: Column<PayRow>[] = [
    { key: 'date', header: 'Date', sortValue: (r) => r.date, render: (r) => fmtDate(r.date) },
    { key: 'receiptNo', header: 'Receipt number', sortValue: (r) => r.receiptNo, render: (r) => <span className="font-mono text-[12px]">{r.receiptNo}</span> },
    {
      key: 'student', header: 'Student', sortValue: (r) => r.student,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{r.student}</p>
          <p className="text-[11.5px] text-muted-foreground">{r.admNo}</p>
        </div>
      ),
    },
    { key: 'mode', header: 'Mode', sortValue: (r) => r.mode },
    { key: 'gross', header: 'Gross', align: 'right', sortValue: (r) => r.gross, render: (r) => <Money value={r.gross} /> },
    {
      key: 'reversal', header: 'Reversal', align: 'right', sortValue: (r) => r.reversal,
      render: (r) => (r.reversal > 0 ? <Money value={-r.reversal} /> : <span className="text-muted-foreground">₹0</span>),
    },
    { key: 'net', header: 'Net', align: 'right', sortValue: (r) => r.net, render: (r) => <Money value={r.net} className="font-bold" /> },
  ];

  if (!can(role, 'reports', 'view')) return <PermissionState module="Reports" />;

  return (
    <div>
      <PageHeader
        title="Collection report"
        description="Payments in a date range, grouped by payment mode with reversals and net totals."
      />

      <Section title="Filters" description="Choose a date range and payment mode, then apply.">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w36-from">From</label>
            <input
              id="w36-from" type="date" value={from} max="2026-07-21" min="2026-06-01"
              onChange={(e) => e.target.value && setFrom(e.target.value)}
              className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft" htmlFor="w36-to">To</label>
            <input
              id="w36-to" type="date" value={to} max="2026-07-21" min="2026-06-01"
              onChange={(e) => e.target.value && setTo(e.target.value)}
              className="h-9 rounded-control border border-line bg-background px-2.5 text-[13px] text-ink"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-semibold text-ink-soft">Payment mode</label>
            <Select value={mode} onValueChange={(v) => setMode(v as 'all' | PaymentMode)}>
              <SelectTrigger className="h-9 rounded-control"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All modes</SelectItem>
                {MODES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button className="rounded-control" onClick={() => setApplied({ from, to, mode })}>Apply filters</Button>
            <Button
              variant="outline" className="rounded-control"
              onClick={() => downloadCsv(
                'collection-report.csv',
                ['Date', 'Receipt number', 'Student', 'Mode', 'Gross', 'Reversal', 'Net'],
                rows.map((r) => [fmtDate(r.date), r.receiptNo, r.student, r.mode, String(r.gross), String(r.reversal), String(r.net)]),
              )}
            >
              Export CSV
            </Button>
            <Button variant="outline" className="rounded-control" onClick={() => window.print()}>
              <Printer className="h-4 w-4" aria-hidden /> Print
            </Button>
          </div>
        </div>
      </Section>

      <div className="print-area mt-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {byMode.map((m) => {
            const Icon = MODE_ICON[m.mode];
            return (
              <div key={m.mode} className="rounded-card border border-line bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[12px] font-semibold uppercase tracking-wide text-muted-foreground">{m.mode}</p>
                  <Icon className="h-4 w-4 text-brand-dark" aria-hidden />
                </div>
                <p className="mt-1 font-heading text-lg font-bold tabular-nums text-ink">{m.count} payment{m.count === 1 ? '' : 's'}</p>
                <dl className="mt-2 space-y-1 text-[12.5px]">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Gross</dt>
                    <dd><Money value={m.gross} /></dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Reversal</dt>
                    <dd>{m.reversal > 0 ? <Money value={-m.reversal} /> : <span className="text-muted-foreground">₹0</span>}</dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-line/60 pt-1">
                    <dt className="font-semibold text-ink">Net</dt>
                    <dd><Money value={m.net} className="font-bold" /></dd>
                  </div>
                </dl>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-5"><SkeletonTable rows={8} cols={7} /></div>
        ) : (
          <div className="mt-5">
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(r) => r.id}
              pageSize={12}
              emptyTitle="No payments in range"
              emptyDescription="Try widening the date range or clearing the mode filter."
            />
            <div className="mt-3 flex flex-wrap items-center justify-end gap-x-6 gap-y-1 rounded-card border border-line bg-card px-4 py-3 text-[13px] shadow-sm">
              <span className="text-muted-foreground">Gross <Money value={totals.gross} className="ml-1" /></span>
              <span className="text-muted-foreground">Reversal {totals.reversal > 0 ? <Money value={-totals.reversal} className="ml-1" /> : <span>₹0</span>}</span>
              <span className="font-semibold text-ink">Net <Money value={totals.net} className="ml-1" /></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
