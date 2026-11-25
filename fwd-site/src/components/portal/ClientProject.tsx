import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorText, formatDate, formatDateTime, formatSize, type Item, type ProjectData } from './api';
import { Button, Card, Field, Notice, Pill, inputClass, useAction } from './ui';
import { BRIEF_QUESTIONS, STAGES } from '../../data/portal';
import { ClientPayments } from './Payments';

export default function ClientProject({ id }: { id: string }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(
    () => api<ProjectData>(`/projects/${id}`).then(setData).catch((err) => setError(errorText(err))),
    [id],
  );
  useEffect(() => {
    load();
    // Just back from Revolut's checkout: the payment can take a few seconds
    // to show as paid, so look again shortly.
    if (sessionStorage.getItem('portal:back-from-checkout')) {
      sessionStorage.removeItem('portal:back-from-checkout');
      const timers = [5000, 15000].map((ms) => window.setTimeout(load, ms));
      return () => timers.forEach(window.clearTimeout);
    }
  }, [load]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <p className="py-10 text-center text-slate-600">Loading...</p>;

  const { project, contract, brief, items } = data;
  const itemsDone = items.filter((i) => i.status === 'done').length;
  const steps = [
    { label: 'Sign the agreement', done: contract?.status === 'signed', href: '#agreement' },
    { label: 'Tell me about the project', done: Boolean(brief.submitted_at), href: '#brief' },
    { label: `Send content and access (${itemsDone} of ${items.length})`, done: items.length > 0 && itemsDone === items.length, href: '#content' },
  ];
  const paymentsDue = data.payments.filter((p) => p.status === 'requested').length;
  if (paymentsDue) steps.splice(1, 0, { label: paymentsDue === 1 ? 'Make a payment' : `Make ${paymentsDue} payments`, done: false, href: '#payments' });
  const todo = steps.filter((s) => !s.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">{project.name}</h1>
        <StageTracker stage={project.stage} />
      </div>

      <Card title={todo ? 'What I need from you' : 'All done, thank you'}>
        <ol className="space-y-2">
          {steps.map((step, i) => (
            <li key={step.label} className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${step.done ? 'bg-green-600 text-white' : 'bg-slate-200 text-slate-700'}`}
              >
                {step.done ? '✓' : i + 1}
              </span>
              <a
                href={step.href}
                onClick={(e) => { e.preventDefault(); document.getElementById(step.href.slice(1))?.scrollIntoView({ behavior: 'smooth' }); }}
                className={step.done ? 'text-slate-500 line-through' : 'font-medium text-violet-700 underline'}
              >
                {step.label}
                <span className="sr-only">{step.done ? ' (done)' : ' (to do)'}</span>
              </a>
            </li>
          ))}
        </ol>
      </Card>

      <Agreement id={id} data={data} reload={load} />
      <ClientPayments data={data} reload={load} />
      <Brief id={id} data={data} reload={load} />

      <Card id="content" title="3. Content and access" status={<Pill tone={itemsDone === items.length && items.length ? 'green' : 'amber'}>{itemsDone} of {items.length} done</Pill>}>
        <p className="mb-4 text-slate-600">Send what you have. It does not need to be perfect, and you can come back and add more at any time.</p>
        <ul className="space-y-4">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} files={data.files.filter((f) => f.item_id === item.id)} reload={load} />
          ))}
        </ul>
      </Card>

      {data.tasks.length > 0 && (
        <Card title="Progress">
          <ul className="space-y-2">
            {data.tasks.map((task) => (
              <li key={task.id} className="flex items-start gap-3">
                <span aria-hidden="true" className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded text-xs font-bold ${task.done ? 'bg-green-600 text-white' : 'border border-slate-400'}`}>
                  {task.done ? '✓' : ''}
                </span>
                <span className={task.done ? 'text-slate-500 line-through' : 'text-slate-900'}>
                  {task.title}
                  <span className="sr-only">{task.done ? ' (done)' : ' (to do)'}</span>
                  {task.due && !task.done && <span className="ml-2 text-sm text-slate-600">by {formatDate(task.due)}</span>}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-center text-sm text-slate-600">
        Stuck, or have a question? Email <a className="text-violet-700 underline" href="mailto:thinking@f-w-d.co.uk">thinking@f-w-d.co.uk</a>.
      </p>
    </div>
  );
}

function StageTracker({ stage }: { stage: string }) {
  const stages = STAGES.filter((s) => s.id !== 'paused');
  const current = stages.findIndex((s) => s.id === stage);
  if (stage === 'paused') return <p className="mt-2"><Pill tone="amber">On hold</Pill></p>;
  return (
    <ol className="mt-3 flex flex-wrap gap-2" aria-label="Project stage">
      {stages.map((s, i) => (
        <li
          key={s.id}
          aria-current={i === current ? 'step' : undefined}
          className={`rounded-full px-3 py-1 text-sm font-medium ${i === current ? 'bg-violet-700 text-white' : i < current ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600'}`}
        >
          {s.label}
        </li>
      ))}
    </ol>
  );
}

function Agreement({ id, data, reload }: { id: string; data: ProjectData; reload: () => Promise<unknown> }) {
  const { contract, client } = data;
  const [name, setName] = useState('');
  const [position, setPosition] = useState('');
  const [agree, setAgree] = useState(false);
  const { busy, error, run } = useAction();

  if (!contract || !contract.sow || !contract.terms) {
    return (
      <Card id="agreement" title="1. Agreement" status={<Pill>Being prepared</Pill>}>
        <p className="text-slate-600">I am putting your Statement of Work together. You will get an email as soon as it is ready to sign.</p>
      </Card>
    );
  }

  const sign = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      try {
        await api(`/projects/${id}/contract/sign`, { method: 'POST', body: { name, position, agree, hash: contract.hash } });
      } finally {
        await reload(); // also picks up a replaced document
      }
    });
  };

  const signed = contract.status === 'signed';
  const documents = [
    { title: 'Statement of Work', detail: 'What I will do for you, when, and what it costs.', href: `/api/portal/projects/${id}/contract/sow.pdf` },
    { title: 'FWD Terms of Business', detail: `${contract.terms.label}. The standard terms behind every Statement of Work.`, href: `/api/portal/terms/${contract.terms.id}` },
  ];
  const onBehalfOf = client?.company || client?.name || 'the client';

  return (
    <Card id="agreement" title="1. Agreement" status={<Pill tone={signed ? 'green' : 'amber'}>{signed ? 'Signed' : 'Waiting for your signature'}</Pill>}>
      {!signed && <p className="mb-4 text-slate-600">There are two documents. Please read both, then sign once at the bottom.</p>}
      <ul className="space-y-3">
        {documents.map((doc) => (
          <li key={doc.title} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div>
              <h3 className="font-semibold text-slate-900">{doc.title}</h3>
              <p className="text-sm text-slate-600">{doc.detail}</p>
            </div>
            <a
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              href={doc.href}
              target="_blank"
              rel="noopener"
            >
              Open<span className="sr-only"> {doc.title} (PDF, opens in a new tab)</span>
            </a>
          </li>
        ))}
      </ul>

      {signed ? (
        <div className="mt-4 space-y-2">
          <Notice tone="success">Signed by {contract.signer_name}, {contract.signer_position}, on {formatDateTime(contract.signed_at)}.</Notice>
          <a className="inline-block font-medium text-violet-700 underline" href={`/api/portal/projects/${id}/contract.pdf`}>Download your signed copy (PDF)</a>
        </div>
      ) : (
        <form onSubmit={sign} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Your full name" hint="Typing your name here is your signature.">
              <input className={inputClass} required minLength={2} autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Your position" hint="For example Director or Owner.">
              <input className={inputClass} required autoComplete="organization-title" value={position} onChange={(e) => setPosition(e.target.value)} />
            </Field>
          </div>
          <label className="flex items-start gap-3">
            <input type="checkbox" className="mt-1 h-5 w-5 shrink-0 accent-violet-700" checked={agree} onChange={(e) => setAgree(e.target.checked)} required />
            <span className="text-slate-800">
              I have read the Statement of Work and the FWD Terms of Business ({contract.terms.label}). I agree to them, and I am authorised to sign on behalf of {onBehalfOf}.
            </span>
          </label>
          {error && <Notice tone="error">{error}</Notice>}
          <Button type="submit" disabled={busy || !agree || name.trim().length < 2 || !position.trim()}>{busy ? 'Signing...' : 'Sign'}</Button>
          <p className="text-sm text-slate-600">When you sign, the date, time and your IP address are recorded, and we both get a signed copy by email.</p>
        </form>
      )}
    </Card>
  );
}

function Brief({ id, data, reload }: { id: string; data: ProjectData; reload: () => Promise<unknown> }) {
  const [answers, setAnswers] = useState<Record<string, string>>(data.brief.answers);
  const [saved, setSaved] = useState('');
  const { busy, error, run } = useAction();
  const submitted = Boolean(data.brief.submitted_at);

  const save = (submit: boolean) =>
    run(async () => {
      await api(`/projects/${id}/brief`, { method: 'PUT', body: { answers, submit } });
      await reload();
      setSaved(submit && !submitted ? 'Sent. Thank you, I will have a read.' : 'Saved.');
    });

  return (
    <Card id="brief" title="2. About the project" status={<Pill tone={submitted ? 'green' : 'amber'}>{submitted ? `Sent ${formatDate(data.brief.submitted_at)}` : 'Not sent yet'}</Pill>}>
      <p className="mb-4 text-slate-600">Short answers are fine. Skip anything that does not apply.</p>
      <form onSubmit={(e) => { e.preventDefault(); save(true); }} className="space-y-4">
        {BRIEF_QUESTIONS.map((q) => (
          <Field key={q.key} label={q.label} hint={q.hint}>
            {q.long ? (
              <textarea className={inputClass} rows={3} maxLength={5000} value={answers[q.key] || ''} onChange={(e) => { setSaved(''); setAnswers({ ...answers, [q.key]: e.target.value }); }} />
            ) : (
              <input className={inputClass} maxLength={500} value={answers[q.key] || ''} onChange={(e) => { setSaved(''); setAnswers({ ...answers, [q.key]: e.target.value }); }} />
            )}
          </Field>
        ))}
        {error && <Notice tone="error">{error}</Notice>}
        {saved && <Notice tone="success">{saved}</Notice>}
        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={busy}>{submitted ? 'Save changes' : 'Send to Sam'}</Button>
          {!submitted && <Button variant="secondary" disabled={busy} onClick={() => save(false)}>Save and finish later</Button>}
        </div>
      </form>
    </Card>
  );
}

function ItemRow({ item, files, reload }: { item: Item; files: ProjectData['files']; reload: () => Promise<unknown> }) {
  const [note, setNote] = useState(item.note);
  const [progress, setProgress] = useState('');
  const { busy, error, run } = useAction();
  const done = item.status === 'done';

  const update = (body: Record<string, unknown>) =>
    run(async () => {
      await api(`/items/${item.id}`, { method: 'PATCH', body });
      await reload();
    });

  const upload = (list: FileList | null) => {
    if (!list?.length) return;
    const chosen = [...list];
    run(async () => {
      try {
        for (let i = 0; i < chosen.length; i++) {
          setProgress(`Uploading ${i + 1} of ${chosen.length}...`);
          await api(`/items/${item.id}/files`, { method: 'POST', file: chosen[i] });
        }
      } finally {
        setProgress('');
        await reload();
      }
    });
  };

  const inputId = `file-${item.id}`;
  return (
    <li className={`rounded-xl border p-4 ${done ? 'border-green-200 bg-green-50/50' : 'border-slate-200'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-slate-900">{item.label}</h3>
          {item.help && <p className="text-sm text-slate-600">{item.help}</p>}
        </div>
        <label className="flex shrink-0 items-center gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" className="h-5 w-5 accent-green-600" checked={done} disabled={busy} onChange={(e) => update({ status: e.target.checked ? 'done' : 'todo' })} />
          Done
        </label>
      </div>

      {item.kind === 'upload' && (
        <div className="mt-3">
          {files.length > 0 && (
            <ul className="mb-3 space-y-1">
              {files.map((file) => (
                <li key={file.id} className="flex flex-wrap items-center gap-x-3 text-sm">
                  <a className="break-all text-violet-700 underline" href={`/api/portal/files/${file.id}`}>{file.filename}</a>
                  <span className="text-slate-500">{formatSize(file.size)}</span>
                  <Button variant="link" className="text-sm" disabled={busy} aria-label={`Remove ${file.filename}`} onClick={() => run(async () => { await api(`/files/${file.id}`, { method: 'DELETE', body: {} }); await reload(); })}>
                    Remove
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <label htmlFor={inputId} className={`inline-block cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-800 hover:bg-slate-50 focus-within:ring-2 focus-within:ring-violet-400 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
            {progress || (files.length ? 'Add more files' : 'Choose files')}
            <input id={inputId} type="file" multiple className="sr-only" disabled={busy} onChange={(e) => { upload(e.target.files); e.target.value = ''; }} />
          </label>
          <span className="ml-3 text-sm text-slate-500">Up to 25 MB each</span>
        </div>
      )}

      <div className="mt-3">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-800">{item.kind === 'access' ? 'Notes for Sam' : 'Notes (optional)'}</span>
          <textarea
            className={inputClass}
            rows={2}
            maxLength={2000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => { if (note !== item.note) update({ note }); }}
          />
        </label>
        {item.kind === 'access' && <p className="mt-1 text-sm text-slate-600">Please do not type passwords here. If I need a login, I will arrange a safe way to share it.</p>}
      </div>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </li>
  );
}
