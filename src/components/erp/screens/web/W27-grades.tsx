'use client';

import { useState } from 'react';
import { Archive, Check, Pencil, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DataTable, type Column } from '@/components/erp/ui/table';
import {
  Field, LockedHint, PageHeader, PermissionState, Section, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { rosterOf } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { useFakeLoad } from '@/lib/erp/utils';
import type { Grade } from '@/lib/erp/types';

export default function W27Grades() {
  const data = useErp((s) => s.data);
  const ayId = useErp((s) => s.ayId);
  const role = useErp((s) => s.session.role);
  const addGrade = useErp((s) => s.addGrade);
  const archiveGrade = useErp((s) => s.archiveGrade);
  const addAuditEvent = useErp((s) => s.addAuditEvent);
  const pushToast = useErp((s) => s.pushToast);
  const loading = useFakeLoad(350);

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [renames, setRenames] = useState<Record<string, string>>({});

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

  const rows: Grade[] = [...data.grades]
    .sort((a, b) => a.order - b.order)
    .map((g) => (renames[g.id] ? { ...g, name: renames[g.id] } : g));

  const sectionCount = (gradeId: string) => data.sections.filter((sc) => sc.gradeId === gradeId && sc.status === 'active').length;
  const studentCount = (gradeId: string) => data.sections
    .filter((sc) => sc.gradeId === gradeId && sc.status === 'active')
    .reduce((t, sc) => t + rosterOf(data, sc.id, ayId).length, 0);

  const startEdit = (g: Grade) => {
    setEditingId(g.id);
    setEditName(g.name);
  };

  const saveEdit = (g: Grade) => {
    const name = editName.trim();
    if (!name) {
      pushToast({ title: 'Grade name is required.', variant: 'error' });
      return;
    }
    setRenames((r) => ({ ...r, [g.id]: name }));
    setEditingId(null);
    addAuditEvent('Updated grade', 'Grade', g.id);
    pushToast({ title: 'Grade updated', description: `${g.name} renamed to ${name}.`, variant: 'success' });
  };

  const submitNew = () => {
    const name = newName.trim();
    if (!name) {
      pushToast({ title: 'Grade name is required.', variant: 'error' });
      return;
    }
    addGrade(name);
    setNewName('');
    setShowForm(false);
  };

  const columns: Column<Grade>[] = [
    {
      key: 'name', header: 'Grade name', render: (g) => (editingId === g.id ? (
        <Input
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="h-8 w-40 rounded-control bg-background"
          aria-label="Grade name"
        />
      ) : (
        <span className="font-semibold text-ink">{g.name}</span>
      )),
    },
    { key: 'order', header: 'Display order', align: 'center', render: (g) => <span className="tabular-nums">{g.order}</span>, sortValue: (g) => g.order },
    { key: 'sections', header: 'Sections', align: 'center', render: (g) => <span className="tabular-nums">{sectionCount(g.id)}</span> },
    { key: 'students', header: 'Students', align: 'center', render: (g) => <span className="tabular-nums">{studentCount(g.id)}</span> },
    { key: 'status', header: 'Status', render: (g) => <StatusChip status={g.status} /> },
    {
      key: 'actions', header: 'Actions', align: 'right', render: (g) => (editingId === g.id ? (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" className="rounded-control" onClick={() => saveEdit(g)}>
            <Check className="h-3.5 w-3.5" aria-hidden /> Save
          </Button>
          <Button size="sm" variant="ghost" className="rounded-control" onClick={() => setEditingId(null)}>
            <X className="h-3.5 w-3.5" aria-hidden /> Cancel
          </Button>
        </div>
      ) : (
        <div className="flex justify-end gap-1.5">
          <Button size="sm" variant="outline" className="rounded-control" disabled={!canUpdate} onClick={() => startEdit(g)}>
            <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
          </Button>
          <Button size="sm" variant="outline" className="rounded-control" disabled={g.status === 'archived' || !canUpdate} onClick={() => archiveGrade(g.id)}>
            <Archive className="h-3.5 w-3.5" aria-hidden /> Archive
          </Button>
        </div>
      )),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Grades"
        actions={!canCreate ? (
          <LockedHint>Adding grades needs create permission</LockedHint>
        ) : (
          <Button className="rounded-control" onClick={() => setShowForm((v) => !v)}>
            <Plus className="h-4 w-4" aria-hidden /> Add grade
          </Button>
        )}
      />

      {loading ? (
        <SkeletonTable rows={6} cols={5} />
      ) : (
        <>
          {showForm && canCreate && (
            <Section title="Add grade" description="New grades appear at the end of the display order.">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Grade name" required>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Grade 11"
                    className="rounded-control bg-background"
                  />
                </Field>
              </div>
              <div className="mt-4 flex gap-2">
                <Button className="rounded-control" onClick={submitNew}>Add grade</Button>
                <Button variant="ghost" className="rounded-control" onClick={() => { setShowForm(false); setNewName(''); }}>Cancel</Button>
              </div>
            </Section>
          )}

          <div className="mt-4">
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(g) => g.id}
              emptyTitle="No grades yet"
              emptyDescription="Add the first grade to start structuring sections."
            />
          </div>
        </>
      )}
    </div>
  );
}
