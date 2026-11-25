// The few Revolut Merchant API calls the client area needs.
// Docs: https://developer.revolut.com/docs/api/merchant
// Card details are only ever entered on Revolut's own checkout page.

import { type Env, HttpError } from './core';

const API_VERSION = '2026-08-17';

export const paymentsEnabled = (env: Env) => Boolean(env.REVOLUT_API_KEY);

async function call<T>(env: Env, method: string, path: string, body?: unknown, idempotencyKey?: string): Promise<T> {
  if (!env.REVOLUT_API_KEY) throw new HttpError(503, 'payments_not_configured');
  const base = (env.REVOLUT_API_BASE || 'https://merchant.revolut.com').replace(/\/$/, '');
  let res: Response;
  try {
    res = await fetch(`${base}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${env.REVOLUT_API_KEY}`,
        'Revolut-Api-Version': API_VERSION,
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    console.error('Revolut request failed', method, path, err);
    throw new HttpError(502, 'payment_provider_error');
  }
  const text = await res.text();
  if (!res.ok) {
    console.error('Revolut error', method, path, res.status, text.slice(0, 500));
    throw new HttpError(502, 'payment_provider_error');
  }
  try {
    return (text ? JSON.parse(text) : {}) as T;
  } catch {
    throw new HttpError(502, 'payment_provider_error');
  }
}

export interface Order { id: string; state: string; checkout_url?: string; amount?: number }
export interface Subscription { id: string; state: string; setup_order_id?: string; start_date?: string }

export const createCustomer = (env: Env, email: string, fullName: string) =>
  call<{ id: string }>(env, 'POST', '/api/customers', { email, full_name: fullName });

export const createOrder = (
  env: Env,
  o: { amount: number; description: string; customerId: string; redirectUrl?: string; reference: string },
) =>
  call<Order>(env, 'POST', '/api/orders', {
    amount: o.amount,
    currency: 'GBP',
    description: o.description,
    customer: { id: o.customerId },
    ...(o.redirectUrl ? { redirect_url: o.redirectUrl } : {}),
    merchant_order_data: { reference: o.reference },
  });

export const getOrder = (env: Env, id: string) => call<Order>(env, 'GET', `/api/orders/${id}`);

export const cancelOrder = (env: Env, id: string) => call<unknown>(env, 'POST', `/api/orders/${id}/cancel`);

// One price, charged every month. `months` set = stops after that many
// payments; left out = keeps going until it is cancelled.
export async function createMonthlyPlan(env: Env, name: string, amount: number, months: number | null): Promise<string> {
  const plan = await call<{ variations: { id: string }[] }>(env, 'POST', '/api/subscription-plans', {
    name,
    variations: [
      { phases: [{ ordinal: 1, cycle_duration: 'P1M', amount, currency: 'GBP', ...(months ? { cycle_count: months } : {}) }] },
    ],
  });
  const variation = plan.variations?.[0]?.id;
  if (!variation) throw new HttpError(502, 'payment_provider_error');
  return variation;
}

export const createSubscription = (
  env: Env,
  s: { variationId: string; customerId: string; reference: string; redirectUrl?: string },
) =>
  call<Subscription>(
    env,
    'POST',
    '/api/subscriptions',
    {
      plan_variation_id: s.variationId,
      customer_id: s.customerId,
      external_reference: s.reference,
      ...(s.redirectUrl ? { setup_order_redirect_url: s.redirectUrl } : {}),
    },
    crypto.randomUUID(),
  );

export const getSubscription = (env: Env, id: string) => call<Subscription>(env, 'GET', `/api/subscriptions/${id}`);

export const cancelSubscription = (env: Env, id: string) => call<unknown>(env, 'POST', `/api/subscriptions/${id}/cancel`);
