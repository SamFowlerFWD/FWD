import { useState, type FormEvent } from 'react';
import { api, formatDate, formatMoney, type PaymentLine, type ProjectData } from './api';
import { Button, Card, Field, Notice, Pill, inputClass, useAction } from './ui';

type Reload = () => Promise<unknown>;

const perMonth = (line: PaymentLine) => `${formatMoney(line.amount)}${line.kind === 'monthly' ? ' a month' : ''}`;

// "Rolls on until cancelled, minimum 18 months" / "12 monthly payments, then it stops"
function termText(line: PaymentLine): string {
  if (line.kind !== 'monthly') return '';
  if (line.months) return `${line.months} monthly ${line.months === 1 ? 'payment' : 'payments'}, then it stops`;
  return `Carries on each month until cancelled${line.min_months ? `, with a minimum of ${line.min_months} months` : ''}`;
}

function minimumTermEnds(line: PaymentLine): Date | null {
  if (!line.min_months || !line.paid_at) return null;
  const end = new Date(line.paid_at);
  end.setMonth(end.getMonth() + line.min_months);
  return end;
}

function StatusPill({ line }: { line: PaymentLine }) {
  switch (line.status) {
    case 'planned': return <Pill>{line.due_on === 'signing' ? 'Due on signing' : 'Not requested yet'}</Pill>;
    case 'requested': return <Pill tone="amber">{line.kind === 'monthly' ? 'Waiting to be set up' : 'Due now'}</Pill>;
    case 'paid': return <Pill tone="green">Paid {formatDate(line.paid_at)}</Pill>;
    case 'active': return <Pill tone="green">Running since {formatDate(line.paid_at)}</Pill>;
    case 'overdue': return <Pill tone="amber">Payment failed, retrying</Pill>;
    case 'finished': return <Pill tone="green">Finished {formatDate(line.ended_at)}</Pill>;
    default: return <Pill>Cancelled {formatDate(line.ended_at)}</Pill>;
  }
}

const InvoiceLink = ({ line }: { line: PaymentLine }) =>
  line.invoice_no ? (
    <a className="text-sm text-violet-700 underline" href={`/api/portal/payments/${line.id}/invoice.pdf`} target="_blank" rel="noopener">
      Invoice {line.invoice_no}<span className="sr-only"> (PDF, opens in a new tab)</span>
    </a>
  ) : null;

// ---------- Sam's view ----------

export function AdminPayments({ id, data, reload }: { id: string; data: ProjectData; reload: Reload }) {
  const due = data.payments.filter((p) => p.status === 'requested' || p.status === 'overdue').length;
  return (
    <Card title="Payments" status={due ? <Pill tone="amber">{due} waiting</Pill> : undefined}>
      {!data.paymentsEnabled && (
        <div className="mb-4">
          <Notice tone="info">Revolut is not connected yet, so clients cannot pay online. You can still set payments up and mark them as paid.</Notice>
        </div>
      )}
      {data.payments.length === 0 ? (
        <p className="text-slate-600">No payments set up for this project.</p>
      ) : (
        <ul className="divide-y divide-slate-200">
          {data.payments.map((line) => <AdminLine key={line.id} line={line} clientEmail={data.client?.email} reload={reload} />)}
        </ul>
      )}
      <AddPayment id={id} reload={reload} />
    </Card>
  );
}

function AdminLine({ line, clientEmail, reload }: { line: PaymentLine; clientEmail?: string; reload: Reload }) {
  const { busy, error, run } = useAction();
  const [devLink, setDevLink] = useState('');
  const post = (path: string, body: unknown = {}) => run(async () => {
    const res = await api<{ devLink?: string }>(`/payments/${line.id}/${path}`, { method: 'POST', body });
    setDevLink(res.devLink || '');
    await reload();
  });
  const open = line.status === 'planned' || line.status === 'requested';
  const minEnd = minimumTermEnds(line);

  return (
    <li className="py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <span className="font-semibold text-slate-900">{line.label}</span>{' '}
          <span className="text-slate-800">{perMonth(line)}</span>
          {line.kind === 'monthly' && <span className="block text-sm text-slate-600">{termText(line)}</span>}
          {minEnd && line.status === 'active' && <span className="block text-sm text-slate-600">Minimum term ends {formatDate(minEnd.toISOString())}</span>}
          {line.status === 'paid' && line.paid_how && <span className="block text-sm text-slate-600">Paid by {line.paid_how === 'Revolut' ? 'card through Revolut' : line.paid_how}</span>}
        </div>
        <StatusPill line={line} />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {line.status === 'planned' && (
          <Button variant="secondary" disabled={busy} onClick={() => { if (window.confirm(`Email ${clientEmail} asking them to ${line.kind === 'monthly' ? 'set up' : 'pay'} ${line.label}, ${perMonth(line)}?`)) post('request'); }}>
            Ask for this now
          </Button>
        )}
        {open && line.kind === 'one_off' && (
          <Button variant="link" className="text-sm" disabled={busy} onClick={() => { if (window.confirm(`Mark ${line.label} (${formatMoney(line.amount)}) as paid by bank transfer?`)) post('mark-paid', { how: 'bank transfer' }); }}>
            Mark as paid
          </Button>
        )}
        {open && (
          <Button variant="link" className="text-sm" disabled={busy} aria-label={`Remove ${line.label}`} onClick={() => { if (window.confirm(`Remove ${line.label}?`)) run(async () => { await api(`/payments/${line.id}`, { method: 'DELETE', body: {} }); await reload(); }); }}>
            Remove
          </Button>
        )}
        {(line.status === 'active' || line.status === 'overdue') && (
          <Button
            variant="link"
            className="text-sm"
            disabled={busy}
            onClick={() => {
              const early = minEnd && minEnd > new Date() ? ` The minimum term runs until ${formatDate(minEnd.toISOString())}.` : '';
              if (window.confirm(`Stop taking ${perMonth(line)} for ${line.label}? This cannot be undone: to start again the client would have to set it up afresh.${early}`)) post('cancel');
            }}
          >
            Cancel monthly payment
          </Button>
        )}
        <InvoiceLink line={line} />
      </div>
      {devLink && <a className="mt-2 block break-all text-sm text-violet-700 underline" data-testid="dev-link" href={devLink}>{devLink}</a>}
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </li>
  );
}

type FormKind = 'build' | 'one_off' | 'monthly';

function AddPayment({ id, reload }: { id: string; reload: Reload }) {
  const [kind, setKind] = useState<FormKind>('monthly');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [deposit, setDeposit] = useState('50');
  const [runs, setRuns] = useState<'rolling' | 'fixed'>('rolling');
  const [months, setMonths] = useState('');
  const [minMonths, setMinMonths] = useState('');
  const [dueOn, setDueOn] = useState<'signing' | 'manual'>('signing');
  const { busy, error, run, setError } = useAction();

  const add = (body: Record<string, unknown>) => api(`/projects/${id}/payments`, { method: 'POST', body });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    run(async () => {
      if (kind === 'build') {
        const total = Math.round(Number(amount.replace(/[£,\s]/g, '')) * 100);
        const percent = Number(deposit);
        if (!Number.isFinite(total) || total < 200 || !(percent > 0 && percent < 100)) {
          setError('Enter the build fee and a deposit between 1 and 99 per cent.');
          return;
        }
        const depositPence = Math.round((total * percent) / 100);
        await add({ kind: 'one_off', label: `Deposit (${percent}% of ${formatMoney(total)})`, amount: depositPence / 100, dueOn: 'signing' });
        await add({ kind: 'one_off', label: 'Balance', amount: (total - depositPence) / 100, dueOn: 'manual' });
      } else if (kind === 'one_off') {
        await add({ kind, label, amount, dueOn });
      } else {
        await add({ kind, label, amount, dueOn, months: runs === 'fixed' ? months : null, minMonths: runs === 'rolling' ? minMonths : null });
      }
      setLabel('');
      setAmount('');
      setMonths('');
      setMinMonths('');
      await reload();
    });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
      <Field label="Add a payment">
        <select className={inputClass} value={kind} onChange={(e) => setKind(e.target.value as FormKind)}>
          <option value="monthly">Monthly payment</option>
          <option value="build">Build fee, split into a deposit and a balance</option>
          <option value="one_off">Single payment</option>
        </select>
      </Field>

      {kind === 'build' ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Build fee (£)"><input className={inputClass} inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="3000" /></Field>
          <Field label="Deposit (%)"><input className={inputClass} inputMode="numeric" required value={deposit} onChange={(e) => setDeposit(e.target.value)} /></Field>
          <p className="text-sm text-slate-600 sm:col-span-2">The deposit is due when the client signs. You ask for the balance when the work is accepted.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="What it is for" hint="The client sees this."><input className={inputClass} required value={label} onChange={(e) => setLabel(e.target.value)} placeholder={kind === 'monthly' ? 'Monthly services' : 'Setup fee'} /></Field>
          <Field label={kind === 'monthly' ? 'Amount each month (£)' : 'Amount (£)'} hint="No VAT is added."><input className={inputClass} inputMode="decimal" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="450" /></Field>
          {kind === 'monthly' && (
            <>
              <Field label="How long it runs">
                <select className={inputClass} value={runs} onChange={(e) => setRuns(e.target.value as 'rolling' | 'fixed')}>
                  <option value="rolling">Rolling: keeps going until cancelled</option>
                  <option value="fixed">Fixed: stops after a set number of months</option>
                </select>
              </Field>
              {runs === 'rolling' ? (
                <Field label="Minimum term in months (optional)" hint="For your records and the client's. Payments carry on after it.">
                  <input className={inputClass} inputMode="numeric" value={minMonths} onChange={(e) => setMinMonths(e.target.value)} placeholder="18" />
                </Field>
              ) : (
                <Field label="Number of monthly payments">
                  <input className={inputClass} inputMode="numeric" required value={months} onChange={(e) => setMonths(e.target.value)} placeholder="12" />
                </Field>
              )}
            </>
          )}
          <Field label="When it is due">
            <select className={inputClass} value={dueOn} onChange={(e) => setDueOn(e.target.value as 'signing' | 'manual')}>
              <option value="signing">As soon as the client signs</option>
              <option value="manual">Later, when I ask for it</option>
            </select>
          </Field>
        </div>
      )}
      {error && <Notice tone="error">{error}</Notice>}
      <Button type="submit" disabled={busy}>Add</Button>
    </form>
  );
}

// ---------- the client's view ----------

export function ClientPayments({ data, reload }: { data: ProjectData; reload: Reload }) {
  if (data.payments.length === 0) return null;
  const due = data.payments.filter((p) => p.status === 'requested').length;
  return (
    <Card id="payments" title="Payments" status={due ? <Pill tone="amber">{due} due</Pill> : undefined}>
      <ul className="space-y-3">
        {data.payments.map((line) => <ClientLine key={line.id} line={line} enabled={data.paymentsEnabled} reload={reload} />)}
      </ul>
      <p className="mt-4 text-sm text-slate-600">Payments are taken securely by Revolut. Your card details go straight to them and are never seen or stored by FWD.</p>
    </Card>
  );
}

function ClientLine({ line, enabled, reload }: { line: PaymentLine; enabled: boolean; reload: Reload }) {
  const { busy, error, run } = useAction();
  const pay = () => run(async () => {
    const res = await api<{ url?: string; paid?: boolean }>(`/payments/${line.id}/checkout`, { method: 'POST', body: {} });
    if (res.url) window.location.assign(res.url);
    else await reload(); // already paid, in another tab for example
  });

  return (
    <li className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">{line.label}</h3>
          <p className="text-slate-800">{perMonth(line)}</p>
          {line.kind === 'monthly' && <p className="text-sm text-slate-600">{termText(line)}.</p>}
        </div>
        <StatusPill line={line} />
      </div>
      {line.status === 'requested' && (
        <div className="mt-3">
          {enabled ? (
            <>
              <Button disabled={busy} onClick={pay}>
                {busy ? 'Opening Revolut...' : line.kind === 'monthly' ? 'Set up monthly payment' : `Pay ${formatMoney(line.amount)}`}
              </Button>
              {line.kind === 'monthly' && <p className="mt-2 text-sm text-slate-600">The first payment is taken when you set it up, then on the same day each month.</p>}
            </>
          ) : (
            <p className="text-sm text-slate-600">Online payment is being set up. I will email you when it is ready.</p>
          )}
        </div>
      )}
      {line.status === 'overdue' && <p className="mt-2 text-sm text-amber-800">The last payment did not go through. Revolut will try again. If your card has changed, please email thinking@f-w-d.co.uk.</p>}
      <div className="mt-2"><InvoiceLink line={line} /></div>
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </li>
  );
}
