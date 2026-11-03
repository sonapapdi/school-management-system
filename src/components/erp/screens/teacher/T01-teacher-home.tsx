'use client';

import { useState } from 'react';
import { ArrowRight, Bell, ClipboardList, FileText, Info, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PhoneHeader, PhoneCard, PhoneRow, PhoneStickyBar } from '@/components/erp/ui/phone';
import { StatusChip, EmptyState } from '@/components/erp/ui/primitives';
import { noticesForRole, rosterOf, sectionLabel, registerFor } from '@/lib/erp/derive';
import { fmtDate } from '@/lib/erp/utils';
import { useErp } from '@/lib/erp/store';

export default function T01TeacherHome() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const nav = useErp((s) => s.nav);
  const session = useErp((s) => s.session);
  const [classId, setClassId] = useState<string>(useErp.getState().route.params.sectionId || 's-7a');

  const assignments = data.assignments.filter((a) => a.staffId === 'stf-farah' && a.sectionId);
  const sectionLabelOf = (id: string) => sectionLabel(data, id);
  const reg = registerFor(data, schoolDate, classId);
  const ayId = useErp((s) => s.ayId);
  const roster = rosterOf(data, classId, ayId);
  const marked = Object.keys(reg?.marks ?? {}).length;
  const notices = noticesForRole(data, 'teacher').slice(0, 3);
  const latest = notices[0];

  return (
    <div className="flex min-h-full flex-col">
      <PhoneHeader
        title={`Good morning, ${session.userName.split(' ')[0]}`}
        subtitle={fmtDate(schoolDate)}
        accent="#0E9F9A"
        right={
          <button type="button" onClick={() => nav('T12')} className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-soft font-heading text-[13px] font-bold text-teal" aria-label="Profile">
            FK
          </button>
        }
      />

      <div className="space-y-3 p-4 pb-6">
        {/* Class selector */}
        <div className="erp-scroll flex gap-2 overflow-x-auto pb-0.5">
          {assignments.map((a) => {
            const id = a.sectionId!;
            const active = id === classId;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setClassId(id)}
                className={`shrink-0 rounded-full border px-3.5 py-2 text-[12.5px] font-semibold ${active ? 'border-teal bg-teal text-white' : 'border-line bg-card text-ink-soft'}`}
              >
                {sectionLabelOf(id)}
              </button>
            );
          })}
        </div>

        {/* Attendance status card */}
        <PhoneCard className="border-teal/30">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-[11.5px] font-bold uppercase tracking-wide text-teal">Today’s attendance</p>
              <p className="mt-0.5 font-heading text-[19px] font-extrabold text-ink">{sectionLabelOf(classId)} · {roster.length} students</p>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">
                {reg?.status === 'submitted' ? `Submitted by ${reg.submittedBy}` : reg?.status === 'draft' ? 'Draft saved — finish marking' : 'Not marked yet'}
              </p>
            </div>
            <StatusChip status={reg?.status === 'submitted' ? 'submitted' : reg?.status === 'draft' ? 'draft' : 'attendance_pending'} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {(['P', 'A', 'L'] as const).map((k) => (
              <div key={k} className="rounded-[10px] bg-[#FAFBFE] py-1.5">
                <p className="font-heading text-[16px] font-bold text-ink">{Object.values(reg?.marks ?? {}).filter((m) => m === k).length}</p>
                <p className="text-[10.5px] font-semibold text-muted-foreground">{k === 'P' ? 'Present' : k === 'A' ? 'Absent' : 'Leave'}</p>
              </div>
            ))}
          </div>
          <PhoneStickyBar>
            <Button className="h-12 flex-1 rounded-control bg-teal font-bold hover:bg-teal/90" onClick={() => nav('T02', { sectionId: classId })}>
              {reg?.status === 'submitted' ? 'View register' : marked > 0 ? 'Continue marking' : 'Take attendance'}
            </Button>
            <Button variant="outline" className="h-12 rounded-control" onClick={() => nav('T04')}>My classes</Button>
          </PhoneStickyBar>
        </PhoneCard>

        {/* Quick actions */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Roster', icon: Users, to: 'T05' as const },
            { label: 'History', icon: ClipboardList, to: 'T07' as const },
            { label: 'Notices', icon: Bell, to: 'T10' as const },
          ].map((q) => (
            <button
              key={q.label}
              type="button"
              onClick={() => nav(q.to, q.to === 'T05' ? { sectionId: classId } : undefined)}
              className="flex min-h-[76px] flex-col items-center justify-center gap-1 rounded-[12px] border border-line bg-card text-[11.5px] font-semibold text-ink-soft hover:bg-[#FAFBFF]"
            >
              <q.icon className="h-4.5 w-4.5 text-teal" aria-hidden />
              {q.label}
            </button>
          ))}
        </div>

        {/* Latest notice */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="font-heading text-[14px] font-bold text-ink">Latest notices</p>
            <button type="button" onClick={() => nav('T10')} className="text-[12px] font-semibold text-teal">See all</button>
          </div>
          {latest ? (
            <div className="space-y-2">
              {notices.map((n) => (
                <PhoneRow
                  key={n.id}
                  icon={FileText}
                  title={n.title}
                  subtitle={`Published ${fmtDate(n.publishDate)} · ${n.author}`}
                  onClick={() => nav('T11', { noticeId: n.id })}
                  right={<ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />}
                />
              ))}
            </div>
          ) : (
            <EmptyState icon={Info} title="No notices yet" description="Notices from the school office will appear here." />
          )}
        </div>
      </div>
    </div>
  );
}
