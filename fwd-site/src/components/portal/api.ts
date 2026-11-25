// Talks to /api/portal and turns its error codes into plain messages.

const MESSAGES: Record<string, string> = {
  signed_out: 'You have been signed out. Please sign in again.',
  link_expired: 'That sign-in link has expired or has already been used. Enter your email to get a new one.',
  invalid: 'Please check what you entered and try again.',
  email_in_use: 'That email address is already in use.',
  already_signed: 'This agreement has already been signed.',
  contract_changed: 'The documents were updated while you were reading. Please read them again before signing.',
  no_sow: 'Upload the Statement of Work first.',
  no_terms: 'Upload your Terms of Business first, on the projects page.',
  not_pdf: 'That file is not a PDF. In Word, use File > Save As > PDF, then upload that.',
  too_large: 'That file is too big.',
  empty_file: 'That file is empty.',
  storage_not_configured: 'File uploads are not switched on yet.',
  not_configured: 'The client area is not switched on yet.',
  not_found: 'That could not be found.',
  bad_amount: 'Enter an amount in pounds, for example 450 or 1200.50.',
  payment_started: 'That payment has already been paid or set up, so it cannot be changed here.',
  payments_running: 'This project has a monthly payment running. Cancel it first.',
  payments_not_configured: 'Online payment is not switched on yet.',
  no_bank_details: 'Add your bank details on the projects page first.',
  bad_bank_details: 'Check the bank details: a 6 digit sort code and an 8 digit account number.',
  payment_provider_error: 'Revolut could not be reached. Please try again in a minute.',
};

export class ApiError extends Error {
  constructor(public code: string, public status: number) {
    super(MESSAGES[code] || 'Something went wrong. Please try again.');
  }
}

export async function api<T = Record<string, any>>(
  path: string,
  options: { method?: string; body?: unknown; file?: File; fields?: Record<string, string> } = {},
): Promise<T> {
  const init: RequestInit = { method: options.method || 'GET', credentials: 'same-origin' };
  if (options.file) {
    const form = new FormData();
    for (const [key, value] of Object.entries(options.fields || {})) form.append(key, value);
    form.append('file', options.file);
    init.body = form;
  } else if (options.body !== undefined) {
    init.headers = { 'Content-Type': 'application/json' };
    init.body = JSON.stringify(options.body);
  }
  let res: Response;
  try {
    res = await fetch(`/api/portal${path}`, init);
  } catch {
    throw new ApiError('network', 0);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    if (res.status === 401 && data.error === 'signed_out') window.dispatchEvent(new Event('portal:signed-out'));
    throw new ApiError(data.error || 'server_error', res.status);
  }
  return data as T;
}

export const errorText = (err: unknown) => (err instanceof Error ? err.message : 'Something went wrong. Please try again.');

export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

export const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

export const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

export const formatMoney = (pence: number) =>
  `£${(pence / 100).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export interface PaymentLine {
  id: string; kind: 'one_off' | 'monthly'; label: string; amount: number;
  months: number | null; min_months: number | null; due_on: 'signing' | 'manual';
  status: 'planned' | 'requested' | 'paid' | 'active' | 'overdue' | 'cancelled' | 'finished';
  invoice_no: string | null; requested_at: string | null; paid_at: string | null; ended_at: string | null;
  paid_how?: string | null;
  method: 'standing_order' | null; reference: string | null; received: string[]; auto: string[]; flagged?: string[];
}
export interface BankDetails { accountName: string; sortCode: string; accountNumber: string }
export interface PortalUser { email: string; name: string; role: 'admin' | 'client' }
export interface Item { id: string; kind: 'upload' | 'access'; label: string; help: string; status: 'todo' | 'done'; note: string }
export interface FileRow { id: string; item_id: string; filename: string; size: number; created_at: string }
export interface Task { id: string; title: string; due: string | null; done: number; client_visible: number }
export interface ContractView {
  status: 'draft' | 'sent' | 'signed';
  sow: { filename: string; size: number } | null;
  terms: { id: string; label: string } | null;
  hash: string;
  sent_at: string | null; signed_at: string | null; signer_name: string | null; signer_position: string | null;
  signer_email?: string | null; signer_ip?: string | null;
}
export interface ProjectData {
  project: { id: string; name: string; stage: string; notes?: string };
  client: { id: string; name: string; company: string; email?: string } | null;
  contract: ContractView | null;
  brief: { answers: Record<string, string>; submitted_at: string | null };
  items: Item[];
  files: FileRow[];
  tasks: Task[];
  payments: PaymentLine[];
  paymentsEnabled: boolean;
  bank: BankDetails | null;
  activity: { actor: string; action: string; created_at: string }[];
}
