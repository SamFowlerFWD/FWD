import { useState, type FormEvent } from 'react';
import { api, formatDate, formatMoney, type BankDetails, type PaymentLine, type ProjectData } from './api';
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

const monthName = (period: string) => new Date(`${period}-15`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });

// Every month from when a standing order was asked for up to this month,
// newest first. A fixed term stops at its number of payments.
function monthsToCheck(line: PaymentLine): string[] {
  const start = (line.received[0] && line.received[0] < (line.requested_at || '').slice(0, 7) ? line.received[0] : (line.requested_at || new Date().toISOString()).slice(0, 7));
  // A payment that arrives a few days early can be ticked for next month.
  const lastTicked = line.received[line.received.length - 1] || '';
  const thisMonth = new Date().toISOString().slice(0, 7);
  const end = lastTicked > thisMonth ? lastTicked : thisMonth;
  const months: string[] = [];
  let [year, month] = start.split('-').map(Number);
  while (`${year}-${String(month).padStart(2, '0')}` <= end && months.length < 120) {
    months.push(`${year}-${String(month).padStart(2, '0')}`);
    if (++month > 12) { month = 1; year++; }
  }
  return (line.months ? months.slice(0, Math.max(line.months, line.received.length)) : months).reverse();
}

function BankBox({ bank, reference, amount, monthly }: { bank: BankDetails; reference: string; amount: number; monthly: boolean }) {
  return (
    <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <dt className="text-slate-600">Pay to</dt><dd className="font-medium text-slate-900">{bank.accountName}</dd>
      <dt className="text-slate-600">Sort code</dt><dd className="font-medium text-slate-900">{bank.sortCode}</dd>
      <dt className="text-slate-600">Account number</dt><dd className="font-medium text-slate-900">{bank.accountNumber}</dd>
      <dt className="text-slate-600">Amount</dt><dd className="font-medium text-slate-900">{formatMoney(amount)}{monthly ? ' every month' : ''}</dd>
      <dt className="text-slate-600">Reference</dt><dd className="font-medium text-slate-900">{reference}</dd>
    </dl>
  );
}

function StatusPill({ line }: { line: PaymentLine }) {
  if (line.method === 'standing_order' && line.status === 'requested') return <Pill tone="amber">Standing order, first payment not seen yet</Pill>;
  if (line.method === 'standing_order' && line.status === 'active') return <Pill tone="green">Standing order since {formatDate(line.paid_at)}</Pill>;
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

// One invoice for each month that has been paid, newest first.
function MonthlyInvoices({ line }: { line: PaymentLine }) {
  if (!line.invoices?.length) return null;
  return (
    <div className="mt-3">
      <p className="text-sm font-medium text-slate-800">Invoices</p>
      <ul className="mt-1 flex flex-wrap gap-x-5 gap-y-1">
        {line.invoices.map((inv) => (
          <li key={inv.number} className="text-sm">
            <a className="text-violet-700 underline" href={`/api/portal/invoices/${inv.number}.pdf`} target="_blank" rel="noopener">
              {monthName(inv.period)}<span className="sr-only">, invoice {inv.number} (PDF, opens in a new tab)</span>
            </a>
            {inv.emailed === false && <span className="text-amber-800"> (not emailed)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
          {line.method === 'standing_order' && <span className="block text-sm text-slate-600">Paid by standing order, reference {line.reference}</span>}
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
        {line.kind === 'monthly' && line.status === 'requested' && !line.method && (
          <Button variant="link" className="text-sm" disabled={busy} onClick={() => post('standing-order')}>Client will pay by standing order</Button>
        )}
        {line.method === 'standing_order' && line.status === 'requested' && (
          <Button variant="link" className="text-sm" disabled={busy} onClick={() => post('card')}>Switch back to card</Button>
        )}
        {(line.status === 'active' || line.status === 'overdue') && (
          <Button
            variant="link"
            className="text-sm"
            disabled={busy}
            onClick={() => {
              const early = minEnd && minEnd > new Date() ? ` The minimum term runs until ${formatDate(minEnd.toISOString())}.` : '';
              const message = line.method === 'standing_order'
                ? `End ${line.label}? This only closes it here. A standing order is controlled by the client, so they must cancel it at their bank.${early}`
                : `Stop taking ${perMonth(line)} for ${line.label}? This cannot be undone: to start again the client would have to set it up afresh.${early}`;
              if (window.confirm(message)) post('cancel');
            }}
          >
            {line.method === 'standing_order' ? 'End monthly payment' : 'Cancel monthly payment'}
          </Button>
        )}
        <InvoiceLink line={line} />
      </div>
      {line.method === 'standing_order' && ['requested', 'active', 'finished'].includes(line.status) && (
        <fieldset className="mt-3 rounded-lg border border-slate-200 p-3">
          <legend className="px-1 text-sm font-medium text-slate-800">Tick each month when the payment arrives</legend>
          <p className="mb-2 text-sm text-slate-600">Ticking a month emails the client a paid invoice for it.</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {monthsToCheck(line).map((period) => (
              <li key={period}>
                <label className="flex items-center gap-2 text-sm text-slate-800">
                  <input
                    type="checkbox"
                    className="h-5 w-5 accent-green-600"
                    checked={line.received.includes(period)}
                    disabled={busy}
                    onChange={(e) => post('receipts', { period, received: e.target.checked })}
                  />
                  {monthName(period)}
                  {line.auto.includes(period) && <span className="text-slate-500">(seen in Revolut)</span>}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      )}
      <MonthlyInvoices line={line} />
      {(line.flagged || []).length > 0 && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          <p className="font-medium">Arrived in Revolut but not ticked:</p>
          <ul className="list-disc pl-5">
            {line.flagged!.map((detail, i) => <li key={i}>{detail.charAt(0).toUpperCase() + detail.slice(1)}.</li>)}
          </ul>
        </div>
      )}
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
        {data.payments.map((line) => <ClientLine key={line.id} line={line} enabled={data.paymentsEnabled} bank={data.bank} reload={reload} />)}
      </ul>
      <p className="mt-4 text-sm text-slate-600">Card payments are taken securely by Revolut. Your card details go straight to them and are never seen or stored by FWD.</p>
    </Card>
  );
}

function ClientLine({ line, enabled, bank, reload }: { line: PaymentLine; enabled: boolean; bank: BankDetails | null; reload: Reload }) {
  const { busy, error, run } = useAction();
  const choose = (path: string) => run(async () => { await api(`/payments/${line.id}/${path}`, { method: 'POST', body: {} }); await reload(); });
  const standingOrder = line.method === 'standing_order';
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
      {standingOrder && (line.status === 'requested' || line.status === 'active') && bank && (
        <div className="mt-3">
          <p className="text-sm text-slate-800">
            {line.status === 'requested'
              ? 'Set up a standing order with your bank using these details. Please use the reference exactly, so I can match your payment.'
              : 'Your standing order details, in case you need them.'}
          </p>
          <BankBox bank={bank} reference={line.reference || ''} amount={line.amount} monthly />
          {line.months && <p className="mt-2 text-sm text-slate-600">Set it to stop after {line.months} payments.</p>}
          {line.received.length > 0 && <p className="mt-2 text-sm text-slate-600">Received so far: {line.received.map(monthName).join(', ')}.</p>}
          {line.status === 'requested' && enabled && (
            <Button variant="link" className="mt-2 text-sm" disabled={busy} onClick={() => choose('card')}>Pay by card instead</Button>
          )}
        </div>
      )}
      {line.status === 'requested' && !standingOrder && (
        <div className="mt-3">
          {enabled ? (
            <>
              <Button disabled={busy} onClick={pay}>
                {busy ? 'Opening Revolut...' : line.kind === 'monthly' ? 'Set up monthly payment' : `Pay ${formatMoney(line.amount)}`}
              </Button>
              {line.kind === 'monthly' && <p className="mt-2 text-sm text-slate-600">The first payment is taken when you set it up, then on the same day each month.</p>}
            </>
          ) : (
            !bank && <p className="text-sm text-slate-600">Online payment is being set up. I will email you when it is ready.</p>
          )}
          {bank && line.kind === 'monthly' && (
            <p className="mt-3 text-sm text-slate-700">
              {enabled ? 'Would you rather pay from your bank? ' : ''}
              <Button variant="link" className="text-sm" disabled={busy} onClick={() => choose('standing-order')}>Pay by standing order{enabled ? ' instead' : ''}</Button>
            </p>
          )}
          {bank && line.kind === 'one_off' && (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-violet-700 underline">{enabled ? 'Pay by bank transfer instead' : 'Pay by bank transfer'}</summary>
              <BankBox bank={bank} reference={line.invoice_no || ''} amount={line.amount} monthly={false} />
              <p className="mt-2 text-sm text-slate-600">I will mark this as paid when it arrives.</p>
            </details>
          )}
        </div>
      )}
      {line.status === 'overdue' && <p className="mt-2 text-sm text-amber-800">The last payment did not go through. Revolut will try again. If your card has changed, please email thinking@f-w-d.co.uk.</p>}
      <div className="mt-2"><InvoiceLink line={line} /></div>
      <MonthlyInvoices line={line} />
      {error && <div className="mt-2"><Notice tone="error">{error}</Notice></div>}
    </li>
  );
}
