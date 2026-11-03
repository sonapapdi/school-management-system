'use client';

import { useState } from 'react';
import { CheckCircle2, Download, FileUp, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { DataTable } from '@/components/erp/ui/table';
import type { Column } from '@/components/erp/ui/table';
import { Field, PageHeader, PermissionState, Section, SkeletonTable, StatusChip } from '@/components/erp/ui/primitives';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { downloadCsv, fmtDateTime, useFakeLoad } from '@/lib/erp/utils';

const SAMPLE_FILES = ['grade4_new_joinees_2026.csv', 'bulk_upload_jun2026.csv'];

export default function W08ImportUpload() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const nav = useErp((s) => s.nav);
  const pushToast = useErp((s) => s.pushToast);
  const createImport = useErp((s) => s.createImport);
  const validateImport = useErp((s) => s.validateImport);
  const loading = useFakeLoad(350);

  const [importType, setImportType] = useState<'Students' | 'Guardians'>('Students');
  const [selectedAy, setSelectedAy] = useState(ayId);
  const [fileName, setFileName] = useState('');
  const [customName, setCustomName] = useState('');
  const [headerRow, setHeaderRow] = useState(true);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update'>('skip');
  const [fileError, setFileError] = useState('');

  if (!can(role, 'students', 'create')) return <PermissionState module="Students" action="create" />;

  const effectiveFile = customName.trim() || fileName;

  const downloadTemplate = () => {
    downloadCsv(
      'import_template.csv',
      ['Admission number', 'First name', 'Last name', 'Grade', 'Section', 'Date of birth', 'Guardian name', 'Guardian mobile'],
      [
        ['ADM-2026-0801', 'Aarav', 'Kulkarni', '4', 'B', '2016-03-14', 'Girish Kulkarni', '9822011223'],
        ['ADM-2026-0802', 'Myra', 'Wagh', '4', 'C', '2016-07-02', 'Sameer Wagh', '9822011334'],
      ],
    );
    pushToast({ title: 'Template downloaded', description: 'Keep the header row exactly as shown.', variant: 'info' });
  };

  const upload = () => {
    if (!effectiveFile) {
      setFileError('Choose a file to upload.');
      return;
    }
    const id = createImport({ type: importType, ayId: selectedAy, fileName: effectiveFile, headerRow, duplicateStrategy });
    pushToast({ title: 'File uploaded', description: 'Validate the batch to see accepted and rejected rows.', variant: 'success' });
    nav('W09', { importId: id });
  };

  const validate = () => {
    if (!effectiveFile) {
      setFileError('Choose a file to upload.');
      return;
    }
    const id = createImport({ type: importType, ayId: selectedAy, fileName: effectiveFile, headerRow, duplicateStrategy });
    validateImport(id);
    pushToast({ title: 'Validation complete', description: 'Accepted, conflicting and rejected rows are marked.', variant: 'success' });
    nav('W09', { importId: id });
  };

  const columns: Column<(typeof data.imports)[number]>[] = [
    { key: 'file', header: 'File', render: (imp) => <span className="font-mono text-[12.5px] font-semibold text-ink">{imp.fileName}</span>, sortValue: (imp) => imp.fileName },
    { key: 'type', header: 'Type', render: (imp) => imp.type, sortValue: (imp) => imp.type },
    { key: 'by', header: 'Uploaded by', render: (imp) => imp.uploadedBy, sortValue: (imp) => imp.uploadedBy },
    { key: 'at', header: 'Uploaded at', render: (imp) => fmtDateTime(imp.uploadedAt), sortValue: (imp) => imp.uploadedAt, hideBelow: 'md' },
    { key: 'rows', header: 'Rows', align: 'right', render: (imp) => <span className="tabular-nums">{imp.rows.length}</span>, sortValue: (imp) => imp.rows.length },
    { key: 'status', header: 'Status', render: (imp) => <StatusChip status={imp.status} />, sortValue: (imp) => imp.status },
  ];

  return (
    <div>
      <PageHeader
        description="Upload a CSV of students or guardians, validate it, then commit accepted rows from the review screen."
      />

      {loading ? (
        <SkeletonTable rows={5} cols={4} />
      ) : (
        <>
          <Section title="New import" description="Only CSV files with the template columns are accepted.">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Import type" required>
                <Select value={importType} onValueChange={(v) => setImportType(v as 'Students' | 'Guardians')}>
                  <SelectTrigger className="rounded-control" aria-label="Import type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Students">Students</SelectItem>
                    <SelectItem value="Guardians">Guardians</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Academic year" required>
                <Select value={selectedAy} onValueChange={setSelectedAy}>
                  <SelectTrigger className="rounded-control" aria-label="Academic year"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {data.academicYears.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}{a.status === 'active' ? ' — active' : ''}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Header row" hint="First row contains column names">
                <div className="flex h-9 items-center gap-2.5">
                  <Switch checked={headerRow} onCheckedChange={setHeaderRow} aria-label="Header row" />
                  <span className="text-[13px] font-semibold text-ink-soft">{headerRow ? 'Included' : 'Not included'}</span>
                </div>
              </Field>

              <Field label="File" required error={fileError} hint="Pick a sample file or type a custom file name" className="sm:col-span-2 lg:col-span-3">
                <div className="flex flex-wrap items-center gap-2">
                  {SAMPLE_FILES.map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => { setFileName(f); setFileError(''); }}
                      aria-pressed={fileName === f && !customName.trim()}
                      className={`flex items-center gap-1.5 rounded-control border px-3 py-2 text-[12.5px] font-semibold transition-colors ${fileName === f && !customName.trim() ? 'border-brand bg-brand/10 text-brand-dark' : 'border-line bg-background text-ink-soft hover:border-brand/40'}`}
                    >
                      {fileName === f && !customName.trim() ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> : <FileUp className="h-3.5 w-3.5" aria-hidden />}
                      {f}
                    </button>
                  ))}
                  <Input
                    value={customName}
                    onChange={(e) => { setCustomName(e.target.value); setFileError(''); }}
                    placeholder="…or type a custom file name"
                    className="h-9 w-full max-w-xs rounded-control bg-background sm:w-64"
                    aria-label="Custom file name"
                  />
                </div>
              </Field>

              <Field label="Duplicate strategy" required className="sm:col-span-2 lg:col-span-3">
                <RadioGroup value={duplicateStrategy} onValueChange={(v) => setDuplicateStrategy(v as 'skip' | 'update')} className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="skip" id="dup-skip" />
                    <Label htmlFor="dup-skip" className="text-[13px] font-semibold text-ink-soft">Skip duplicates</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="update" id="dup-update" />
                    <Label htmlFor="dup-update" className="text-[13px] font-semibold text-ink-soft">Update existing</Label>
                  </div>
                </RadioGroup>
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Button variant="outline" className="rounded-control" onClick={downloadTemplate}>
                <Download className="h-4 w-4" aria-hidden /> Download template
              </Button>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <Button variant="ghost" className="rounded-control" onClick={() => nav('W03')}>Cancel</Button>
                <Button variant="outline" className="rounded-control" onClick={validate}>Validate</Button>
                <Button className="rounded-control" onClick={upload}>
                  <Upload className="h-4 w-4" aria-hidden /> Upload
                </Button>
              </div>
            </div>
          </Section>

          <h2 className="mb-3 mt-6 font-heading text-[15px] font-bold text-ink">Recent imports</h2>
          <DataTable
            rows={data.imports}
            columns={columns}
            rowKey={(imp) => imp.id}
            searchable={(imp) => `${imp.fileName} ${imp.uploadedBy} ${imp.type}`}
            searchPlaceholder="Search imports…"
            pageSize={5}
            onRowClick={(imp) => nav('W09', { importId: imp.id })}
            emptyTitle="No imports yet"
            emptyDescription="Upload a CSV file to see it listed here."
          />
        </>
      )}
    </div>
  );
}
