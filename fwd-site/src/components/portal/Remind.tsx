import { useState } from 'react';
import { api, formatDateTime, type ProjectData } from './api';
import { Button, Notice, useAction } from './ui';

// One button that emails the client a nudge with a fresh sign-in link
// (server/portal/followup.ts). `about` finishes the sentence "a reminder to ...".
export function RemindButton({ id, what, paymentId, about, data, reload }: {
  id: string; what: 'sign' | 'brief' | 'items' | 'pay'; paymentId?: string; about: string;
  data: ProjectData; reload: () => Promise<unknown>;
}) {
  const { busy, error, run } = useAction();
  const [note, setNote] = useState('');
  const [devLink, setDevLink] = useState('');
  const email = data.client?.email;
  const last = data.reminders?.[paymentId ? `pay:${paymentId}` : what];

  const send = () => {
    if (!window.confirm(`Email ${email} a reminder to ${about}?`)) return;
    run(async () => {
      const res = await api<{ sent: boolean; devLink?: string }>(`/projects/${id}/remind`, { method: 'POST', body: { what, paymentId } });
      setDevLink(res.devLink || '');
      setNote(res.sent ? `Reminder emailed to ${email}.` : 'The reminder could not be emailed. Check the email settings.');
      await reload();
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Button variant="secondary" disabled={busy || !email} onClick={send}>{busy ? 'Sending...' : 'Send a reminder'}</Button>
        <span className="text-sm text-slate-600">{last ? `Last reminded ${formatDateTime(last)}` : 'No reminder sent yet'}</span>
      </div>
      {note && <Notice tone="info">{note}</Notice>}
      {devLink && <a className="block break-all text-sm text-violet-700 underline" data-testid="dev-link" href={devLink}>{devLink}</a>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

// "Opened 25 Nov 2026, 14:02" or "Not opened yet", for one thing the client can look at.
export function seenText(data: ProjectData, what: 'opened' | 'sow' | 'terms'): string {
  const view = data.views?.[what];
  if (!view) return 'not opened yet';
  return view.last_at.slice(0, 16) === view.first_at.slice(0, 16)
    ? `opened ${formatDateTime(view.first_at)}`
    : `first opened ${formatDateTime(view.first_at)}, last opened ${formatDateTime(view.last_at)}`;
}
