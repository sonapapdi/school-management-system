'use client';

import { useRef, useState } from 'react';
import { Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Field, PageHeader, PermissionState, Section, SkeletonTable, StatusChip,
} from '@/components/erp/ui/primitives';
import { gradeLabel, sectionLabel } from '@/lib/erp/derive';
import { can } from '@/lib/erp/permissions';
import { useErp } from '@/lib/erp/store';
import { addDays, fmtDate, useFakeLoad } from '@/lib/erp/utils';
import type { NoticeAudience } from '@/lib/erp/types';

const AUDIENCES: NoticeAudience[] = ['Everyone', 'All parents', 'All staff', 'Grade', 'Section'];

export default function W32NoticeEditor() {
  const data = useErp((s) => s.data);
  const schoolDate = useErp((s) => s.schoolDate);
  const role = useErp((s) => s.session.role);
  const userName = useErp((s) => s.session.userName);
  const schoolName = useErp((s) => s.theme.schoolName);
  const paramsNoticeId = useErp((s) => s.route.params.noticeId);
  const existing = useErp((s) => s.data.notices.find((n) => n.id === s.route.params.noticeId));
  const nav = useErp((s) => s.nav);
  const openDialog = useErp((s) => s.openDialog);
  const pushToast = useErp((s) => s.pushToast);
  const saveNotice = useErp((s) => s.saveNotice);
  const loading = useFakeLoad(350);

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<NoticeAudience>('All parents');
  const [gradeId, setGradeId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [publishDate, setPublishDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [attachment, setAttachment] = useState('');
  const [errors, setErrors] = useState<{ title?: string; message?: string; dates?: string }>({});
  const [previewPulse, setPreviewPulse] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  /* Re-seed the form when switching between create and edit targets (render-time reset) */
  const [resetFor, setResetFor] = useState(paramsNoticeId ?? '');
  if (resetFor !== (paramsNoticeId ?? '')) {
    setResetFor(paramsNoticeId ?? '');
    setTitle(existing?.title ?? '');
    setMessage(existing?.message ?? '');
    setAudience(existing?.audience ?? 'All parents');
    setGradeId(existing?.gradeId ?? '');
    setSectionId(existing?.sectionId ?? '');
    setPublishDate(existing?.publishDate ?? schoolDate);
    setExpiryDate(existing?.expiryDate ?? addDays(schoolDate, 14));
    setAttachment(existing?.attachment ?? '');
    setErrors({});
  }

  if (!can(role, 'notices', 'create')) {
    return (
      <div>
        <PageHeader />
        <PermissionState module="Notices" />
      </div>
    );
  }

  const dirty = (() => {
    const current = [title, message, audience, gradeId, sectionId, publishDate, expiryDate, attachment];
    const initial = existing
      ? [existing.title, existing.message, existing.audience, existing.gradeId ?? '', existing.sectionId ?? '', existing.publishDate, existing.expiryDate, existing.attachment ?? '']
      : ['', '', 'All parents', '', '', schoolDate, addDays(schoolDate, 14), ''];
    return JSON.stringify(current) !== JSON.stringify(initial);
  })();

  const audienceLabel = () => {
    if (audience === 'Grade') return `Grade ${gradeLabel(data, gradeId)}`;
    if (audience === 'Section') return sectionLabel(data, sectionId);
    return audience;
  };

  const payload = () => ({
    title: title.trim(),
    message: message.trim(),
    audience,
    gradeId: audience === 'Grade' ? gradeId || undefined : undefined,
    sectionId: audience === 'Section' ? sectionId || undefined : undefined,
    publishDate,
    expiryDate,
    attachment: attachment.trim() || undefined,
  });

  const validateAll = (): boolean => {
    const errs: { title?: string; message?: string; dates?: string } = {};
    if (!title.trim()) errs.title = 'Title is required.';
    if (!message.trim()) errs.message = 'Message is required.';
    if (!publishDate || !expiryDate || publishDate >= expiryDate) errs.dates = 'Publish date must be before expiry date.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveDraft = () => {
    if (!title.trim() || !message.trim()) {
      setErrors({
        title: title.trim() ? undefined : 'Title is required.',
        message: message.trim() ? undefined : 'Message is required.',
      });
      return;
    }
    saveNotice({ id: existing?.id, ...payload(), author: existing?.author ?? userName, status: 'draft' });
    pushToast({ title: 'Draft saved', description: 'You can publish it from the notice list.', variant: 'info' });
    nav('W31');
  };

  const handlePreview = () => {
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setPreviewPulse(true);
    pushToast({ title: 'Preview updated', description: 'This is how recipients will see the notice.', variant: 'info' });
    setTimeout(() => setPreviewPulse(false), 2200);
  };

  const handlePublish = () => {
    if (!validateAll()) {
      pushToast({ title: 'Please fix the highlighted fields.', variant: 'error' });
      return;
    }
    if (existing) {
      saveNotice({ id: existing.id, ...payload(), author: existing.author, status: 'published' });
      openDialog('D27', { noticeId: existing.id, title: title.trim(), audience: audienceLabel(), publishDate: fmtDate(publishDate) });
    } else {
      const id = saveNotice({ ...payload(), author: userName, status: 'published' });
      openDialog('D27', { noticeId: id, title: title.trim(), audience: audienceLabel(), publishDate: fmtDate(publishDate) });
    }
  };

  const handleCancel = () => {
    if (dirty) openDialog('D02', { discard: () => nav('W31') });
    else nav('W31');
  };

  const previewStatus = existing ? existing.status : publishDate > schoolDate ? 'scheduled' : 'published';

  return (
    <div>
      <PageHeader
        title="Create or edit notice"
        description={existing ? `Editing “${existing.title}” — publishing asks for a final confirmation.` : 'Compose the notice, preview it, then publish to the parent and teacher apps.'}
        status={existing ? <StatusChip status={existing.status} /> : undefined}
      />

      {loading ? (
        <SkeletonTable rows={7} cols={3} />
      ) : (
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Section title="Notice details">
              <div className="space-y-4">
                <Field label="Title" required error={errors.title}>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Term 2 fee payment reminder"
                    className="rounded-control bg-background"
                  />
                </Field>
                <Field label="Message" required error={errors.message}>
                  <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={6}
                    placeholder="Write the message recipients will read in their app…"
                    className="rounded-control bg-background"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Audience">
                    <Select value={audience} onValueChange={(v) => setAudience(v as NoticeAudience)}>
                      <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Audience">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUDIENCES.map((a) => (
                          <SelectItem key={a} value={a}>{a}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                  {audience === 'Grade' && (
                    <Field label="Grade">
                      <Select value={gradeId} onValueChange={setGradeId}>
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
                  )}
                  {audience === 'Section' && (
                    <Field label="Section">
                      <Select value={sectionId} onValueChange={setSectionId}>
                        <SelectTrigger className="h-9 w-full rounded-control bg-background" aria-label="Section">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {data.sections.filter((sc) => sc.status === 'active').map((sc) => (
                            <SelectItem key={sc.id} value={sc.id}>{sectionLabel(data, sc.id)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Publish date" required>
                    <Input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="rounded-control bg-background" aria-label="Publish date" />
                  </Field>
                  <Field label="Expiry date" required error={errors.dates}>
                    <Input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="rounded-control bg-background" aria-label="Expiry date" />
                  </Field>
                </div>
                <Field label="Attachment" hint="Optionally name a file recipients can download.">
                  <div className="flex gap-2">
                    <Input
                      value={attachment}
                      onChange={(e) => setAttachment(e.target.value)}
                      placeholder="e.g. term2-schedule.pdf"
                      className="rounded-control bg-background"
                    />
                    <Button variant="outline" className="rounded-control" onClick={() => {
                      if (!attachment.trim()) {
                        pushToast({ title: 'Enter a file name to attach.', variant: 'error' });
                        return;
                      }
                      pushToast({ title: 'Attachment attached', variant: 'success' });
                    }}>
                      <Paperclip className="h-4 w-4" aria-hidden /> Upload
                    </Button>
                  </div>
                </Field>
                <div className="flex flex-wrap gap-2 border-t border-line pt-4">
                  <Button variant="outline" className="rounded-control" onClick={handleSaveDraft}>Save draft</Button>
                  <Button variant="outline" className="rounded-control" onClick={handlePreview}>Preview</Button>
                  <Button className="rounded-control" onClick={handlePublish}>Publish</Button>
                  <Button variant="ghost" className="rounded-control" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            </Section>
          </div>

          <div ref={previewRef}>
            <Section
              title="Live preview"
              description="How recipients see this notice"
              className={previewPulse ? 'ring-2 ring-brand transition-shadow' : 'transition-shadow'}
            >
              <div className="rounded-card border border-line bg-page p-4">
                <StatusChip status={previewStatus} />
                <h3 className="mt-2 font-heading text-[16px] font-bold text-ink">{title.trim() || 'Untitled notice'}</h3>
                <span className="mt-2 inline-flex items-center rounded-full border border-brand/20 bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                  {audienceLabel()}
                </span>
                <p className="mt-3 whitespace-pre-line text-[13px] leading-relaxed text-ink-soft">
                  {message.trim() || 'Your message will appear here.'}
                </p>
                <div className="mt-4 border-t border-line pt-3 text-[11.5px] text-muted-foreground">
                  <p>By {existing?.author ?? userName} · {schoolName}</p>
                  <p className="mt-0.5">{fmtDate(publishDate)} → {fmtDate(expiryDate)}</p>
                  {attachment.trim() && (
                    <p className="mt-1 inline-flex items-center gap-1 font-semibold text-ink-soft">
                      <Paperclip className="h-3 w-3" aria-hidden /> {attachment.trim()}
                    </p>
                  )}
                </div>
              </div>
            </Section>
          </div>
        </div>
      )}
    </div>
  );
}
