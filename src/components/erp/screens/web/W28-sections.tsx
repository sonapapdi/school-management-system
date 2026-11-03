'use client';

import { useState } from 'react';
import { Archive, Check, Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column, type TableFilter } from '@/components/erp/ui/table';
import {
  Field, LockedHint, PageHeader, PermissionState, Section, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { gradeLabel, rosterOf } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { useFakeLoad } from '@/lib/erp/utils';
import type { Section as SectionRow } from '@/lib/erp/types';

export default function W28Sections() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const addSection = useErp((s) => s.addSection);
  const updateSection = useErp((s) => s.updateSection);
  const archiveSection = useErp((s) => s.archiveSection);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const [showForm, setShowForm] = useState(false);
  const [formGradeId, setFormGradeId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCapacity, setFormCapacity] = useState('40');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCapacity, setEditCapacity] = useState('');

  if (!can(role, 'academics', 'view')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Academics" />
      </div>
    );
  }

  const canCreate = can(role, 'academics', 'create');
  const canUpdate = can(role, 'academics', 'update');

  const rows: SectionRow[] = [...data.sections].sort(
    (a, b) => Number(a.gradeId.slice(1)) - Number(b.gradeId.slice(1)) || a.name.localeCompare(b.name),
  );

  const staffName = (id: string | undefined) => data.staff.find((st) => st.id === id)?.name;
  const ayName = (id: string) => data.academicYears.find((a) => a.id === id)?.name ?? '—';

  const startEdit = (sec: SectionRow) => {
    setEditingId(sec.id);
    setEditCapacity(String(sec.capacity));
  };

  const saveEdit = (sec: SectionRow) => {
    const cap = Number(editCapacity);
    if (!Number.isFinite(cap) || cap <= 0) {
      pushToast({ title: 'Capacity must be a positive number.', variant: 'error' });
      return;
    }
    updateSection(sec.id, { capacity: cap });
    setEditingId(null);
    pushToast({ title: 'Section updated', description: `${gradeLabel(data, sec.gradeId)}-${sec.name} capacity set to ${cap}.`, variant: 'success' });
  };

  const submitNew = () => {
    const name = formName.trim().toUpperCase();
    if (!formGradeId || !name) {
      pushToast({ title: 'Grade and section name are required.', variant: 'error' });
      return;
    }
    addSection({ gradeId: formGradeId, name, capacity: Number(formCapacity) || 40 });
    setFormGradeId('');
    setFormName('');
    setFormCapacity('40');
    setShowForm(false);
  };

  const filters: TableFilter<SectionRow>[] = [
    {
      key: 'grade',
      label: 'Grade',
      options: data.grades.map((g) => ({ value: g.id, label: g.name })),
      match: (row, value) => row.gradeId === value,
    },
    {
      key: 'status',
      label: 'Status',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'archived', label: 'Archived' },
      ],
      match: (row, value) => row.status === value,
    },
  ];

  const columns: Column<SectionRow>[] = [
    { key: 'ay', header: 'Academic year', render: (sec) => ayName(sec.ayId), hideBelow: 'md' },
    { key: 'grade', header: 'Grade', render: (sec) => gradeLabel(data, sec.gradeId), sortValue: (sec) => gradeLabel(data, sec.gradeId) },
    { key: 'name', header: 'Section name', render: (sec) => <span className="font-semibold text-ink">{sec.name}</span> },
    {
      key: 'capacity', header: 'Capacity', align: 'center', render: (sec) => (editingId === sec.id ? (
        <Input
          type="number"
          min={1}
          value={editCapacity}
          onChange={(e) => setEditCapacity(e.target.value)}
          className="h-8 w-20 rounded-control bg-background"
          aria-label="Capacity"
        />
      ) : (
        <span className="tabular-nums">{sec.capacity}</span>
      )),
    },
    { key: 'enrolled', header: 'Enrolled', align: 'center', render: (sec) => <span className="tabular-nums">{rosterOf(data, sec.id, ayId).length}</span> },
    { key: 'teacher', header: 'Class teacher', render: (sec) => staffName(sec.classTeacherId) ?? <span className="text-muted-foreground">—</span>, hideBelow: 'sm' },
    { key: 'status', header: 'Status', render: (sec) => <StatusChip status={sec.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (sec) => (editingId === sec.id ? (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" className="rounded-control" onClick={() => saveEdit(sec)}>
            <Check className="h-3.5 w-3.5" aria-hidden /> Save
          </Button>
          <Button size="sm" variant="ghost" className="rounded-control" onClick={() => setEditingId(null)}>
            <X className="h-3.5 w-3.5" aria-hidden /> Cancel
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => startEdit(sec)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
          </Button>
          <Button size="sm" variant="outline" className="rounded-control" disabled={sec.status === 'archived' || !canUpdate} onClick={() => archiveSection(sec.id)}>
            <Archive className="h-3.5 w-3.5" aria-hidden /> Archive
          </Button>
        </div>
      )),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Sections"
        actions={!canCreate ? (
          <LockedHint>Adding sections needs create permission</LockedHint>
        ) : (
          <Button className="rounded-control" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden /> Add section
          </Button>
        )}
      />

      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : (
        <>
          {showForm && canCreate && (
            <Section title="Add section" description="New sections are created in the current academic year workspace.">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Grade" required>
                  <Select value={formGradeId} onValueChange={setFormGradeId}>
                    <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Grade">
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {data.grades.map((g) => (
                        <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Section name" required hint="Usually A, B or C.">
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. D"
                    className="rounded-control bg-background"
                  />
                </Field>
                <Field label="Capacity" required>
                  <Input
                    type="number"
                    min={1}
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(e.target.value)}
                    className="rounded-control bg-background"
                  />
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="rounded-control" onClick={submitNew}>Add section</Button>
                <Button variant="ghost" className="rounded-control" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </Section>
          )}

          <div className="mt-4">
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(sec) => sec.id}
              searchable={(sec) => `${gradeLabel(data, sec.gradeId)}-${sec.name} ${staffName(sec.classTeacherId) ?? ''}`}
              searchPlaceholder="Search section or teacher…"
              filters={filters}
              emptyTitle="No sections found"
              emptyDescription="Try changing search or filters."
            />
          </div>
        </>
      )}
    </div>
  );
}
