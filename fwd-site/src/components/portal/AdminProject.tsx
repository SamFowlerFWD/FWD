import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorText, formatDate, formatDateTime, formatSize, type Item, type ProjectData, type Task } from './api';
import { Button, Card, Field, Notice, Pill, inputClass, useAction } from './ui';
import { BRIEF_QUESTIONS, STAGES } from '../../data/portal';
import { AdminPayments } from './Payments';
import SignaturePad from './SignaturePad';
import { RemindButton, seenText } from './Remind';

type Reload = () => Promise<unknown>;

export default function AdminProject({ id }: { id: string }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api<ProjectData>(`/projects/${id}`).then(setData).catch((err) => setError(errorText(err))), [id]);
  useEffect(() => { load(); }, [load]);

  if (error) return <div className="space-y-3"><Notice tone="error">{error}</Notice><a className="text-violet-700 underline" href="#/">Back to projects</a></div>;
  if (!data) return <p className="py-10 text-center text-slate-600">Loading...</p>;

  return (
    <div className="space-y-6">
      <a className="text-sm text-violet-700 underline" href="#/">&larr; All projects</a>
      <Header id={id} data={data} reload={load} />
      <Contract id={id} data={data} reload={load} />
      <AdminPayments id={id} data={data} reload={load} />
      <BriefAnswers id={id} data={data} reload={load} />
      <Checklist id={id} data={data} reload={load} />
      <Tasks id={id} tasks={data.tasks} reload={load} />
      <Notes id={id} initial={data.project.notes || ''} />
      <Card title="Activity">
        <ul className="space-y-1 text-sm">
          {data.activity.map((row, i) => (
            <li key={i} className="flex flex-wrap gap-x-2">
              <span className="text-slate-500">{formatDateTime(row.created_at)}</span>
              <span className="text-slate-800"><strong>{row.actor}</strong>: {row.action}</span>
            </li>
          ))}
        </ul>
      </Card>
      <DeleteProject id={id} name={data.project.name} />
    </div>
  );
}

function Header({ id, data, reload }: { id: string; data: ProjectData; reload: Reload }) {
  const { busy, error, run } = useAction();
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');
  const { project, client } = data;

  const invite = () =>
    run(async () => {
      const res = await api<{ sent: boolean; devLink?: string }>(`/projects/${id}/invite`, { method: 'POST', body: {} });
      setMessage(res.sent ? `Sign-in link emailed to ${client?.email}.` : 'The email could not be sent. Check the email settings.');
      setDevLink(res.devLink || '');
      await reload();
    });

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
      <p className="text-slate-600">{[client?.name, client?.company, client?.email].filter(Boolean).join(' · ')}</p>
      <p className="text-sm text-slate-600">
        {data.views?.opened ? `${client?.name || 'The client'} last looked at this project ${formatDateTime(data.views.opened.last_at)}.` : `${client?.name || 'The client'} has not opened this project yet.`}
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-800">Stage (the client sees this)</span>
          <select
            className={`${inputClass} w-auto`}
            value={project.stage}
            disabled={busy}
            onChange={(e) => run(async () => { await api(`/projects/${id}`, { method: 'PATCH', body: { stage: e.target.value } }); await reload(); })}
          >
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <Button variant="secondary" disabled={busy} onClick={invite}>Email the client a sign-in link</Button>
      </div>
      {message && <div className="mt-3"><Notice tone="info">{message}</Notice></div>}
      {devLink && <a className="mt-2 block break-all text-sm text-violet-700 underline" data-testid="dev-link" href={devLink}>{devLink}</a>}
      {error && <div className="mt-3"><Notice tone="error">{error}</Notice></div>}
    </div>
  );
}

// The signatures as they were drawn.
function Signatures({ contract }: { contract: NonNullable<ProjectData['contract']> }) {
  const drawn = [
    { who: 'Client', png: contract.signer_signature },
    { who: 'FWD', png: contract.fwd_signature },
  ].filter((s) => s.png);
  if (!drawn.length) return null;
  return (
    <ul className="mb-3 flex flex-wrap gap-4">
      {drawn.map((s) => (
        <li key={s.who} className="rounded-lg border border-slate-200 bg-white p-2">
          <img src={s.png!} alt={`${s.who} signature`} className="h-14 w-auto" />
          <span className="block text-xs text-slate-600">{s.who}</span>
        </li>
      ))}
    </ul>
  );
}

function Contract({ id, data, reload }: { id: string; data: ProjectData; reload: Reload }) {
  const contract = data.contract!;
  const [note, setNote] = useState('');
  const [devLink, setDevLink] = useState('');
  const [fwdName, setFwdName] = useState('Sam Fowler');
  const [fwdPosition, setFwdPosition] = useState('Director');
  const [fwdAgree, setFwdAgree] = useState(false);
  const [fwdSignature, setFwdSignature] = useState('');
  const { busy, error, run } = useAction();
  const sowUrl = `/api/portal/projects/${id}/contract/sow.pdf`;

  const status =
    contract.status === 'signed' ? <Pill tone="green">Signed</Pill>
    : contract.status === 'sent' ? <Pill tone="amber">Waiting for signature</Pill>
    : <Pill>Draft, not sent</Pill>;

  if (contract.status === 'signed') {
    return (
      <Card title="Contract" status={status}>
        <p className="mb-3 text-slate-800">
          Signed by <strong>{contract.signer_name}</strong>, {contract.signer_position} ({contract.signer_email}) on {formatDateTime(contract.signed_at)} from IP {contract.signer_ip || 'unknown'}.
          {contract.fwd_name && <> Signed for FWD by <strong>{contract.fwd_name}</strong>, {contract.fwd_position}, on {formatDateTime(contract.fwd_signed_at)}.</>}
        </p>
        <Signatures contract={contract} />
        <a className="font-medium text-violet-700 underline" href={`/api/portal/projects/${id}/contract.pdf`}>Download the signed copy (PDF)</a>
        <p className="mt-1 text-sm text-slate-600">One file: the Statement of Work, Terms of Business {contract.terms?.label} and the signature record.</p>
      </Card>
    );
  }

  const upload = (file: File | undefined) => {
    if (!file) return;
    run(async () => {
      await api(`/projects/${id}/contract/sow`, { method: 'POST', file });
      await reload();
      setFwdAgree(false);
      setNote(contract.status === 'sent' ? 'Replaced, and taken back from the client. Sign and send the new version below.' : 'Uploaded.');
    });
  };

  return (
    <Card title="Contract" status={status}>
      <ol className="space-y-4">
        <li>
          <h3 className="font-semibold text-slate-900">1. Statement of Work for this client</h3>
          {contract.sow ? (
            <p className="text-slate-700">
              <a className="font-medium text-violet-700 underline" href={sowUrl} target="_blank" rel="noopener">{contract.sow.filename}</a>{' '}
              <span className="text-sm text-slate-500">{formatSize(contract.sow.size)}</span>
            </p>
          ) : (
            <p className="text-slate-600">Not uploaded yet. Save the SOW as a PDF from Word, then upload it here.</p>
          )}
          <label className={`mt-2 inline-block cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-violet-400 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
            {contract.sow ? 'Replace PDF' : 'Upload SOW (PDF)'}
            <input type="file" accept="application/pdf,.pdf" className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        </li>
        <li>
          <h3 className="font-semibold text-slate-900">2. Terms of Business</h3>
          {contract.terms ? (
            <p className="text-slate-700">
              <a className="font-medium text-violet-700 underline" href={`/api/portal/terms/${contract.terms.id}`} target="_blank" rel="noopener">{contract.terms.label}</a>{' '}
              <span className="text-sm text-slate-500">{contract.status === 'sent' ? 'sent with this SOW' : 'added automatically'}</span>
            </p>
          ) : (
            <p className="text-slate-600">Not uploaded yet. Add them once on the <a className="text-violet-700 underline" href="#/">projects page</a>.</p>
          )}
        </li>
      </ol>

      <div className="mt-5 space-y-3">
        {error && <Notice tone="error">{error}</Notice>}
        {note && <Notice tone="success">{note}</Notice>}
        {devLink && <a className="block break-all text-sm text-violet-700 underline" data-testid="dev-link" href={devLink}>{devLink}</a>}
        {contract.status === 'draft' ? (
          <form
            className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!window.confirm(`Sign for FWD and email ${data.client?.email} asking them to sign "${contract.sow?.filename}" and Terms of Business ${contract.terms?.label}?`)) return;
              run(async () => {
                const res = await api<{ sent: boolean; devLink?: string }>(`/projects/${id}/contract/send`, {
                  method: 'POST',
                  body: { name: fwdName, position: fwdPosition, agree: fwdAgree, signature: fwdSignature, hash: contract.hash },
                });
                await reload();
                setDevLink(res.devLink || '');
                setNote(res.sent ? 'Signed and sent. The client has been emailed.' : 'Signed and ready for the client to sign, but the email could not be sent.');
              });
            }}
          >
            <h3 className="font-semibold text-slate-900">3. Sign for FWD, then send</h3>
            <p className="text-sm text-slate-600">You sign first. Nothing goes to the client until you press the button.</p>
            <SignaturePad label="Your signature" onChange={setFwdSignature} disabled={busy} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Your full name">
                <input className={inputClass} required minLength={2} value={fwdName} onChange={(e) => setFwdName(e.target.value)} />
              </Field>
              <Field label="Your position">
                <input className={inputClass} required value={fwdPosition} onChange={(e) => setFwdPosition(e.target.value)} />
              </Field>
            </div>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-violet-700" checked={fwdAgree} onChange={(e) => setFwdAgree(e.target.checked)} required />
              <span className="text-slate-800">I have checked both documents and I sign them for and on behalf of FWD Thinking Solutions Limited.</span>
            </label>
            <Button type="submit" disabled={busy || !contract.sow || !contract.terms || !fwdSignature || !fwdAgree}>Sign and send to client</Button>
            {!fwdSignature && <p className="text-sm text-slate-600">Draw your signature in the box to switch the button on.</p>}
          </form>
        ) : (
          <>
            <p className="text-sm text-slate-600">
              {contract.fwd_name ? `Signed for FWD by ${contract.fwd_name}, ${contract.fwd_position}. ` : ''}Sent {formatDateTime(contract.sent_at)}.
            </p>
            <Signatures contract={contract} />
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold text-slate-900">Has the client read it?</h3>
              <ul className="mt-1 text-sm text-slate-700">
                <li>Statement of Work: {seenText(data, 'sow')}</li>
                <li>Terms of Business: {seenText(data, 'terms')}</li>
              </ul>
              <div className="mt-3"><RemindButton id={id} what="sign" about="sign the agreement" data={data} reload={reload} /></div>
            </div>
            <Button variant="secondary" disabled={busy} onClick={() => run(async () => { await api(`/projects/${id}/contract/unsend`, { method: 'POST', body: {} }); await reload(); setDevLink(''); setNote('Withdrawn. The client can no longer see it.'); })}>
              Withdraw
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}

function BriefAnswers({ id, data, reload }: { id: string; data: ProjectData; reload: Reload }) {
  const { brief } = data;
  const answered = BRIEF_QUESTIONS.filter((q) => brief.answers[q.key]);
  return (
    <Card title="Brief" status={<Pill tone={brief.submitted_at ? 'green' : 'grey'}>{brief.submitted_at ? `Sent ${formatDate(brief.submitted_at)}` : answered.length ? 'Started, not sent' : 'Waiting'}</Pill>}>
      {answered.length === 0 ? (
        <p className="text-slate-600">The client has not filled this in yet.</p>
      ) : (
        <dl className="space-y-3">
          {answered.map((q) => (
            <div key={q.key}>
              <dt className="text-sm font-semibold text-slate-600">{q.label}</dt>
              <dd className="whitespace-pre-wrap text-slate-900">{brief.answers[q.key]}</dd>
            </div>
          ))}
        </dl>
      )}
      {!brief.submitted_at && <div className="mt-4"><RemindButton id={id} what="brief" about="send the brief" data={data} reload={reload} /></div>}
    </Card>
  );
}

function Checklist({ id, data, reload }: { id: string; data: ProjectData; reload: Reload }) {
  const [label, setLabel] = useState('');
  const [help, setHelp] = useState('');
  const [kind, setKind] = useState<'upload' | 'access'>('upload');
  const { busy, error, run } = useAction();
  const done = data.items.filter((i) => i.status === 'done').length;

  const add = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api(`/projects/${id}/items`, { method: 'POST', body: { label, help, kind } });
      setLabel('');
      setHelp('');
      await reload();
    });
  };

  return (
    <Card title="Content and access" status={<Pill tone={data.items.length && done === data.items.length ? 'green' : 'grey'}>{done} of {data.items.length} done</Pill>}>
      <ul className="divide-y divide-slate-200">
        {data.items.map((item) => (
          <ChecklistRow key={item.id} item={item} files={data.files.filter((f) => f.item_id === item.id)} reload={reload} />
        ))}
      </ul>
      {done < data.items.length && (
        <div className="mt-4 border-t border-slate-200 pt-4">
          <RemindButton id={id} what="items" about={`send the ${data.items.length - done} ${data.items.length - done === 1 ? 'thing' : 'things'} still not done`} data={data} reload={reload} />
        </div>
      )}
      <form onSubmit={add} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-[1fr_1fr_auto_auto] sm:items-end">
        <Field label="Ask for something else"><input className={inputClass} required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Team photos" /></Field>
        <Field label="Help text (optional)"><input className={inputClass} value={help} onChange={(e) => setHelp(e.target.value)} /></Field>
        <Field label="Type">
          <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as 'upload' | 'access')}>
            <option value="upload">Files</option>
            <option value="access">Access</option>
          </select>
        </Field>
        <Button type="submit" disabled={busy}>Add</Button>
      </form>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

function ChecklistRow({ item, files, reload }: { item: Item; files: ProjectData['files']; reload: Reload }) {
  const { busy, error, run } = useAction();
  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            className="mt-1 h-5 w-5 accent-green-600"
            checked={item.status === 'done'}
            disabled={busy}
            onChange={(e) => run(async () => { await api(`/items/${item.id}`, { method: 'PATCH', body: { status: e.target.checked ? 'done' : 'todo' } }); await reload(); })}
          />
          <span>
            <span className="font-semibold text-slate-900">{item.label}</span>{' '}
            <span className="text-sm text-slate-500">({item.kind === 'upload' ? 'files' : 'access'})</span>
            {item.note && <span className="mt-1 block whitespace-pre-wrap rounded bg-amber-50 px-2 py-1 text-sm text-slate-800">Client note: {item.note}</span>}
          </span>
        </label>
        <Button
          variant="link"
          className="text-sm"
          disabled={busy}
          aria-label={`Remove ${item.label}`}
          onClick={() => {
            if (window.confirm(`Remove "${item.label}"${files.length ? ` and its ${files.length} file(s)` : ''}?`)) run(async () => { await api(`/items/${item.id}`, { method: 'DELETE', body: {} }); await reload(); });
          }}
        >
          Remove
        </Button>
      </div>
      {files.length > 0 && (
        <ul className="ml-8 mt-2 space-y-1 text-sm">
          {files.map((file) => (
            <li key={file.id} className="flex flex-wrap gap-x-3">
              <a className="break-all text-violet-700 underline" href={`/api/portal/files/${file.id}`}>{file.filename}</a>
              <span className="text-slate-500">{formatSize(file.size)} · {formatDate(file.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </li>
  );
}

function Tasks({ id, tasks, reload }: { id: string; tasks: Task[]; reload: Reload }) {
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [clientVisible, setClientVisible] = useState(false);
  const { busy, error, run } = useAction();
  const open = tasks.filter((t) => !t.done).length;
  const today = new Date().toISOString().slice(0, 10);

  const add = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api(`/projects/${id}/tasks`, { method: 'POST', body: { title, due, clientVisible } });
      setTitle('');
      setDue('');
      await reload();
    });
  };
  const patch = (task: Task, body: Record<string, unknown>) => run(async () => { await api(`/tasks/${task.id}`, { method: 'PATCH', body }); await reload(); });

  return (
    <Card title="Tasks" status={<Pill tone={open ? 'violet' : 'grey'}>{open} open</Pill>}>
      {tasks.length === 0 && <p className="mb-3 text-slate-600">No tasks yet.</p>}
      <ul className="divide-y divide-slate-200">
        {tasks.map((task) => (
          <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-2">
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-5 w-5 accent-green-600" checked={Boolean(task.done)} disabled={busy} onChange={(e) => patch(task, { done: e.target.checked })} />
              <span className={task.done ? 'text-slate-500 line-through' : 'text-slate-900'}>
                {task.title}
                {task.due && <span className={`ml-2 text-sm ${!task.done && task.due < today ? 'font-semibold text-amber-700' : 'text-slate-500'}`}>{!task.done && task.due < today ? 'overdue, ' : ''}{formatDate(task.due)}</span>}
              </span>
            </label>
            <span className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5 text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-violet-700" checked={Boolean(task.client_visible)} disabled={busy} onChange={(e) => patch(task, { clientVisible: e.target.checked })} />
                Client can see
              </label>
              <Button variant="link" disabled={busy} aria-label={`Delete task ${task.title}`} onClick={() => run(async () => { await api(`/tasks/${task.id}`, { method: 'DELETE', body: {} }); await reload(); })}>Delete</Button>
            </span>
          </li>
        ))}
      </ul>
      <form onSubmit={add} className="mt-4 grid gap-3 border-t border-slate-200 pt-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-end">
        <Field label="New task"><input className={inputClass} required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Due (optional)"><input type="date" className={inputClass} value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        <label className="flex items-center gap-2 pb-2 text-sm text-slate-800">
          <input type="checkbox" className="h-4 w-4 accent-violet-700" checked={clientVisible} onChange={(e) => setClientVisible(e.target.checked)} />
          Client can see
        </label>
        <Button type="submit" disabled={busy}>Add task</Button>
      </form>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

function Notes({ id, initial }: { id: string; initial: string }) {
  const [notes, setNotes] = useState(initial);
  const [saved, setSaved] = useState(true);
  const { busy, error, run } = useAction();
  return (
    <Card title="Private notes">
      <label className="block">
        <span className="mb-1 block text-sm text-slate-600">Only you can see these.</span>
        <textarea className={inputClass} rows={5} value={notes} onChange={(e) => { setSaved(false); setNotes(e.target.value); }} />
      </label>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="secondary" disabled={busy || saved} onClick={() => run(async () => { await api(`/projects/${id}`, { method: 'PATCH', body: { notes } }); setSaved(true); })}>Save notes</Button>
        {saved && notes !== initial && <span role="status" className="text-sm text-green-700">Saved.</span>}
      </div>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

function DeleteProject({ id, name }: { id: string; name: string }) {
  const { busy, error, run } = useAction();
  return (
    <div className="border-t border-slate-200 pt-4">
      <Button
        variant="danger"
        disabled={busy}
        onClick={() => {
          if (window.prompt(`This permanently deletes "${name}", including its contract and uploaded files. Type DELETE to confirm.`) === 'DELETE') {
            run(async () => { await api(`/projects/${id}`, { method: 'DELETE', body: {} }); window.location.hash = '#/'; });
          }
        }}
      >
        Delete this project
      </Button>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </div>
  );
}
