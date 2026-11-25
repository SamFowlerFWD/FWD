import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api, errorText, formatDate, formatDateTime, type BankDetails } from './api';
import { Button, Card, Field, Notice, Pill, inputClass, useAction } from './ui';
import { STAGES } from '../../data/portal';
import PushSwitch, { setBadge } from './PushSwitch';

interface ProjectRow {
  id: string; name: string; stage: string; updated_at: string; client_name: string; company: string;
  contract_status: 'draft' | 'sent' | 'signed' | null; brief_submitted_at: string | null;
  items_total: number; items_done: number; tasks_open: number; next_due: string | null;
  payments_due: number; payments_overdue: number; standing_orders_to_check: number;
}
interface ClientRow { id: string; name: string; company: string; email: string | null; last_login_at: string | null }
interface TermsRow { id: string; label: string; filename: string; created_at: string }
interface BankMatching { enabled: boolean; checkedAt: string | null; dailyAt: string | null }
interface NotificationRow { id: number; project_id: string | null; project_name: string | null; title: string; body: string; tone: 'action' | 'info'; created_at: string }
interface Overview { projects: ProjectRow[]; clients: ClientRow[]; terms: TermsRow | null; bank: BankDetails | null; bankMatching: BankMatching; notifications: NotificationRow[] }

const today = () => new Date().toISOString().slice(0, 10);

// What has happened since Sam last looked. Things he needs to act on come first.
function Notifications({ items, reload }: { items: NotificationRow[]; reload: () => Promise<unknown> }) {
  const { busy, error, run } = useAction();
  const clear = (path: string) => run(async () => { await api(path, { method: 'POST', body: {} }); await reload(); });
  const sorted = [...items].sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'action' ? -1 : 1));
  const toDo = items.filter((n) => n.tone === 'action').length;
  return (
    <Card
      title="Notifications"
      status={items.length ? <Pill tone={toDo ? 'amber' : 'green'}>{toDo ? `${toDo} to look at` : `${items.length} new`}</Pill> : undefined}
    >
      {items.length === 0 ? (
        <p className="text-slate-600">Nothing new. Payments, signatures and anything that needs you will show here.</p>
      ) : (
        <>
          <ul className="divide-y divide-slate-200">
            {sorted.map((n) => (
              <li key={n.id} className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">
                    <span className={`mr-2 rounded-full px-2 py-0.5 text-xs font-semibold ${n.tone === 'action' ? 'bg-amber-100 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
                      {n.tone === 'action' ? 'Needs you' : 'For info'}
                    </span>
                    {n.project_id ? <a className="text-violet-700 underline" href={`#/p/${n.project_id}`}>{n.title}</a> : n.title}
                  </p>
                  {n.body && <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{n.body}</p>}
                  <p className="mt-1 text-xs text-slate-500">{n.project_name ? `${n.project_name}, ` : ''}{formatDateTime(n.created_at)}</p>
                </div>
                <Button variant="secondary" disabled={busy} onClick={() => clear(`/notifications/${n.id}/done`)}>
                  Done<span className="sr-only">: {n.title}</span>
                </Button>
              </li>
            ))}
          </ul>
          {items.length > 1 && (
            <Button variant="link" className="mt-2 text-sm" disabled={busy} onClick={() => clear('/notifications/done')}>Clear all</Button>
          )}
        </>
      )}
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

export default function AdminHome() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => api<Overview>('/projects').then(setData).catch((err) => setError(errorText(err))), []);
  useEffect(() => { load(); }, [load]);

  // Keep the list fresh when the app has been sitting in the background: reload
  // when it comes back to the front, and when a notification arrives.
  useEffect(() => {
    const onShow = () => { if (document.visibilityState === 'visible') load(); };
    const onMessage = (event: MessageEvent) => { if (event.data?.type === 'portal:push') load(); };
    document.addEventListener('visibilitychange', onShow);
    navigator.serviceWorker?.addEventListener('message', onMessage);
    return () => {
      document.removeEventListener('visibilitychange', onShow);
      navigator.serviceWorker?.removeEventListener('message', onMessage);
    };
  }, [load]);
  useEffect(() => { if (data) setBadge((data.notifications || []).length); }, [data]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <p className="py-10 text-center text-slate-600">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-slate-900">Projects</h1>

      <Notifications items={data.notifications || []} reload={load} />

      {!data.terms && <Notice tone="info">Before you send a Statement of Work, upload your Terms of Business at the bottom of this page.</Notice>}

      {data.projects.length === 0 && (
        <Notice tone="info">No projects yet. Add a client below, then start a project for them.</Notice>
      )}

      {STAGES.map((stage) => {
        const rows = data.projects.filter((p) => p.stage === stage.id);
        if (!rows.length) return null;
        return (
          <section key={stage.id}>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-600">{stage.label} ({rows.length})</h2>
            <ul className="space-y-3">
              {rows.map((p) => (
                <li key={p.id}>
                  <a href={`#/p/${p.id}`} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-violet-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span className="text-lg font-bold text-slate-900">{p.name}</span>
                      <span className="text-sm text-slate-600">{[p.client_name, p.company].filter(Boolean).join(', ')}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Pill tone={p.contract_status === 'signed' ? 'green' : p.contract_status === 'sent' ? 'amber' : 'grey'}>
                        Contract: {p.contract_status === 'signed' ? 'signed' : p.contract_status === 'sent' ? 'waiting' : 'not sent'}
                      </Pill>
                      <Pill tone={p.brief_submitted_at ? 'green' : 'grey'}>Brief: {p.brief_submitted_at ? 'in' : 'waiting'}</Pill>
                      <Pill tone={p.items_total > 0 && p.items_done === p.items_total ? 'green' : 'grey'}>Checklist: {p.items_done}/{p.items_total}</Pill>
                      {p.payments_overdue > 0 && <Pill tone="amber">Payment failed</Pill>}
                      {p.payments_due > 0 && <Pill tone="amber">Payment due</Pill>}
                      {p.standing_orders_to_check > 0 && <Pill tone="amber">Standing order: this month not ticked</Pill>}
                      {p.tasks_open > 0 && <Pill tone="violet">{p.tasks_open} open {p.tasks_open === 1 ? 'task' : 'tasks'}</Pill>}
                      {p.next_due && <Pill tone={p.next_due < today() ? 'amber' : 'grey'}>{p.next_due < today() ? 'Overdue' : 'Next due'} {formatDate(p.next_due)}</Pill>}
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <div className="grid gap-6 md:grid-cols-2">
        <NewClient reload={load} />
        <NewProject clients={data.clients} />
      </div>

      <Card title="Clients">
        {data.clients.length === 0 ? (
          <p className="text-slate-600">No clients yet.</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {data.clients.map((client) => <ClientLine key={client.id} client={client} reload={load} />)}
          </ul>
        )}
      </Card>

      <TermsOfBusiness terms={data.terms} reload={load} />
      <BankDetailsCard bank={data.bank} matching={data.bankMatching} reload={load} />
      <Card title="Notifications on this device"><PushSwitch /></Card>
    </div>
  );
}

function NewClient({ reload }: { reload: () => Promise<unknown> }) {
  const [form, setForm] = useState({ name: '', company: '', email: '' });
  const { busy, error, run } = useAction();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api('/clients', { method: 'POST', body: form });
      setForm({ name: '', company: '', email: '' });
      await reload();
    });
  };
  return (
    <Card title="Add a client">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Name"><input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Business (optional)"><input className={inputClass} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
        <Field label="Email" hint="They sign in with this address."><input type="email" className={inputClass} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" disabled={busy}>Add client</Button>
      </form>
    </Card>
  );
}

function NewProject({ clients }: { clients: ClientRow[] }) {
  const [clientId, setClientId] = useState('');
  const [name, setName] = useState('');
  const { busy, error, run } = useAction();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      const created = await api<{ id: string }>('/projects', { method: 'POST', body: { clientId, name } });
      window.location.hash = `#/p/${created.id}`;
    });
  };
  return (
    <Card title="Start a project">
      <form onSubmit={submit} className="space-y-3">
        <Field label="Client">
          <select className={inputClass} required value={clientId} onChange={(e) => setClientId(e.target.value)}>
            <option value="">Choose a client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{[c.name, c.company].filter(Boolean).join(', ')}</option>)}
          </select>
        </Field>
        <Field label="Project name" hint="The client sees this."><input className={inputClass} required value={name} onChange={(e) => setName(e.target.value)} /></Field>
        {error && <Notice tone="error">{error}</Notice>}
        <Button type="submit" disabled={busy || clients.length === 0}>Start project</Button>
        <p className="text-sm text-slate-600">Nothing is sent to the client until you say so.</p>
      </form>
    </Card>
  );
}

function ClientLine({ client, reload }: { client: ClientRow; reload: () => Promise<unknown> }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: client.name, company: client.company, email: client.email || '' });
  const { busy, error, run } = useAction();

  if (!editing) {
    return (
      <li className="flex flex-wrap items-center justify-between gap-2 py-3">
        <div>
          <span className="font-semibold text-slate-900">{[client.name, client.company].filter(Boolean).join(', ')}</span>
          <span className="block text-sm text-slate-600">
            {client.email} · {client.last_login_at ? `last signed in ${formatDateTime(client.last_login_at)}` : 'has not signed in yet'}
          </span>
        </div>
        <Button variant="link" onClick={() => setEditing(true)} aria-label={`Edit ${client.name}`}>Edit</Button>
      </li>
    );
  }
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api(`/clients/${client.id}`, { method: 'PUT', body: form });
      await reload();
      setEditing(false);
    });
  };
  return (
    <li className="py-3">
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <Field label="Name"><input className={inputClass} required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Business"><input className={inputClass} value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} /></Field>
        <Field label="Email"><input type="email" className={inputClass} required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        {error && <div className="sm:col-span-3"><Notice tone="error">{error}</Notice></div>}
        <div className="flex gap-3 sm:col-span-3">
          <Button type="submit" disabled={busy}>Save</Button>
          <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
        </div>
      </form>
    </li>
  );
}

function TermsOfBusiness({ terms, reload }: { terms: TermsRow | null; reload: () => Promise<unknown> }) {
  const [label, setLabel] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [formKey, setFormKey] = useState(0);
  const { busy, error, run } = useAction();

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!file) return;
    run(async () => {
      await api('/terms', { method: 'POST', file, fields: { label } });
      setLabel('');
      setFile(null);
      setFormKey((k) => k + 1); // clears the file picker
      await reload();
    });
  };

  return (
    <Card title="Terms of Business" status={<Pill tone={terms ? 'green' : 'amber'}>{terms ? terms.label : 'Not uploaded'}</Pill>}>
      {terms ? (
        <p className="mb-4 text-slate-700">
          Every Statement of Work you send goes out with{' '}
          <a className="font-medium text-violet-700 underline" href={`/api/portal/terms/${terms.id}`} target="_blank" rel="noopener">{terms.label}</a>{' '}
          (uploaded {formatDate(terms.created_at)}). Ones already sent or signed stay on the version they went out with.
        </p>
      ) : (
        <p className="mb-4 text-slate-700">Upload your Terms of Business once. They are attached to every Statement of Work, and the client signs both together.</p>
      )}
      <form key={formKey} onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Field label={terms ? 'New version name' : 'Version name'}>
          <input className={inputClass} required value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Version 1.0, November 2026" />
        </Field>
        <Field label="PDF file">
          <input type="file" accept="application/pdf,.pdf" required className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:font-semibold" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        </Field>
        <Button type="submit" disabled={busy || !file}>{busy ? 'Uploading...' : terms ? 'Upload new version' : 'Upload'}</Button>
      </form>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </Card>
  );
}

function BankDetailsCard({ bank, matching, reload }: { bank: BankDetails | null; matching: BankMatching; reload: () => Promise<unknown> }) {
  const [checked, setChecked] = useState('');
  const check = useAction();
  const [form, setForm] = useState<BankDetails>(bank || { accountName: 'FWD Thinking Solutions Limited', sortCode: '', accountNumber: '' });
  const [saved, setSaved] = useState(false);
  const { busy, error, run } = useAction();
  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      await api('/settings/bank', { method: 'PUT', body: form });
      await reload();
      setSaved(true);
    });
  };
  const set = (key: keyof BankDetails, value: string) => { setSaved(false); setForm({ ...form, [key]: value }); };
  return (
    <Card title="Bank details" status={<Pill tone={bank ? 'green' : 'amber'}>{bank ? 'Saved' : 'Not added'}</Pill>}>
      <p className="mb-4 text-slate-700">
        For clients who pay by bank transfer or standing order. A client only sees these when they have something to pay.
        {!bank && ' Until you add them, clients are only offered card payment.'}
      </p>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-3">
        <Field label="Account name"><input className={inputClass} required value={form.accountName} onChange={(e) => set('accountName', e.target.value)} /></Field>
        <Field label="Sort code"><input className={inputClass} required inputMode="numeric" autoComplete="off" value={form.sortCode} onChange={(e) => set('sortCode', e.target.value)} placeholder="00-00-00" /></Field>
        <Field label="Account number"><input className={inputClass} required inputMode="numeric" autoComplete="off" value={form.accountNumber} onChange={(e) => set('accountNumber', e.target.value)} placeholder="8 digits" /></Field>
        {error && <div className="sm:col-span-3"><Notice tone="error">{error}</Notice></div>}
        <div className="flex items-center gap-3 sm:col-span-3">
          <Button type="submit" disabled={busy}>Save bank details</Button>
          {saved && <span role="status" className="text-sm text-green-700">Saved.</span>}
        </div>
      </form>
      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="font-semibold text-slate-900">Ticking payments off automatically</h3>
        {matching.enabled ? (
          <>
            <p className="mt-1 text-sm text-slate-700">
              On. When a payment arrives in Revolut with one of your references and the right amount, it is ticked for you.
              {matching.checkedAt ? ` Last checked ${formatDateTime(matching.checkedAt)}.` : ' Not checked yet.'}
              {matching.dailyAt ? ` It also checks by itself every morning (last ran ${formatDateTime(matching.dailyAt)}) and emails you if a standing order payment is late.` : ''}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Button
                variant="secondary"
                disabled={check.busy}
                onClick={() => check.run(async () => {
                  const res = await api<{ looked?: number; ticked?: number; flagged?: number }>('/bank/check', { method: 'POST', body: {} });
                  setChecked(`Checked. ${res.ticked || 0} ticked, ${res.flagged || 0} to look at.`);
                  await reload();
                })}
              >
                {check.busy ? 'Checking...' : 'Check Revolut now'}
              </Button>
              {checked && <span role="status" className="text-sm text-green-700">{checked}</span>}
            </div>
            {check.error && <div className="mt-2"><Notice tone="error">{check.error}</Notice></div>}
          </>
        ) : (
          <p className="mt-1 text-sm text-slate-700">Off. You tick bank payments by hand on each project.</p>
        )}
      </div>
    </Card>
  );
}
