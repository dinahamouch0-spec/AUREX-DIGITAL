import { LocalDate } from './dates';
import { CurrencyCode, CurrencyTotals, addToTotals } from './money';
import { DEAL_STAGES, Deal, DealStage, Invoice, InvoicePayment, Transaction } from './types';

export type InvoiceDisplayStatus = 'draft' | 'void' | 'unpaid' | 'partially_paid' | 'paid' | 'overpaid' | 'overdue';

export interface InvoiceBalance {
  paid: number;
  outstanding: number;
  status: InvoiceDisplayStatus;
  currency: CurrencyCode;
}

export function invoiceBalance(invoice: Invoice, payments: InvoicePayment[], today: LocalDate): InvoiceBalance {
  const paid = payments
    .filter((p) => !p.deleted_at && p.invoice_id === invoice.id)
    .reduce((a, p) => a + p.amount_minor, 0);
  const outstanding = invoice.status === 'void' || invoice.status === 'draft' ? 0 : Math.max(0, invoice.amount_minor - paid);
  let status: InvoiceDisplayStatus;
  if (invoice.status === 'void') status = 'void';
  else if (invoice.status === 'draft') status = 'draft';
  else if (paid > invoice.amount_minor) status = 'overpaid';
  else if (paid === invoice.amount_minor) status = 'paid';
  else if (invoice.due_on && invoice.due_on < today) status = 'overdue';
  else if (paid > 0) status = 'partially_paid';
  else status = 'unpaid';
  return { paid, outstanding, status, currency: invoice.currency };
}

export interface FinancialSummary {
  /** Cleared income + invoice payments − refunds issued. */
  cashReceived: CurrencyTotals;
  /** Cleared expenses − refunds received. */
  expensesPaid: CurrencyTotals;
  /** cashReceived − expensesPaid (per currency, from entered records only). */
  netCash: CurrencyTotals;
  /** Outstanding balance on sent (non-void) invoices. */
  receivables: CurrencyTotals;
  /** Pending (not yet paid) expenses. */
  unpaidLiabilities: CurrencyTotals;
  /** Planned income transactions — forecast, not cash. */
  plannedIncome: CurrencyTotals;
}

function inRange(d: LocalDate, from?: LocalDate, to?: LocalDate) {
  return (!from || d >= from) && (!to || d <= to);
}

/**
 * Per-currency summary. Currencies are never mixed: each total is keyed by
 * its currency code. Invoice payments are the record of money received for
 * invoices; do not also log the same receipt as an income transaction.
 */
export function financialSummary(
  input: { transactions: Transaction[]; invoices: Invoice[]; payments: InvoicePayment[] },
  opts: { from?: LocalDate; to?: LocalDate; today: LocalDate },
): FinancialSummary {
  const s: FinancialSummary = {
    cashReceived: {},
    expensesPaid: {},
    netCash: {},
    receivables: {},
    unpaidLiabilities: {},
    plannedIncome: {},
  };
  for (const t of input.transactions) {
    if (t.deleted_at || !inRange(t.occurred_on, opts.from, opts.to)) continue;
    const amt = t.amount_minor;
    if (t.status === 'cleared') {
      if (t.direction === 'income') addToTotals(s.cashReceived, t.currency, amt);
      if (t.direction === 'refund_issued') addToTotals(s.cashReceived, t.currency, -amt);
      if (t.direction === 'expense') addToTotals(s.expensesPaid, t.currency, amt);
      if (t.direction === 'refund_received') addToTotals(s.expensesPaid, t.currency, -amt);
    } else if (t.status === 'pending' && t.direction === 'expense') {
      addToTotals(s.unpaidLiabilities, t.currency, amt);
    } else if (t.status === 'planned' && t.direction === 'income') {
      addToTotals(s.plannedIncome, t.currency, amt);
    }
  }
  const invoicesById = new Map(input.invoices.filter((i) => !i.deleted_at).map((i) => [i.id, i]));
  for (const p of input.payments) {
    if (p.deleted_at || !inRange(p.paid_on, opts.from, opts.to)) continue;
    const inv = invoicesById.get(p.invoice_id);
    if (!inv || inv.status === 'void') continue;
    addToTotals(s.cashReceived, inv.currency, p.amount_minor);
  }
  for (const inv of invoicesById.values()) {
    const bal = invoiceBalance(inv, input.payments, opts.today);
    if (bal.outstanding > 0) addToTotals(s.receivables, inv.currency, bal.outstanding);
  }
  const currencies = new Set<CurrencyCode>([
    ...(Object.keys(s.cashReceived) as CurrencyCode[]),
    ...(Object.keys(s.expensesPaid) as CurrencyCode[]),
  ]);
  for (const c of currencies) s.netCash[c] = (s.cashReceived[c] ?? 0) - (s.expensesPaid[c] ?? 0);
  return s;
}

export interface PipelineSummary {
  byStage: Record<DealStage, { count: number; value: CurrencyTotals }>;
  /** Σ value × probability for open deals that have a probability set. */
  weighted: CurrencyTotals;
  /** Open deals without a probability (excluded from weighted). */
  unweightedOpenCount: number;
  wonValue: CurrencyTotals;
}

export const OPEN_STAGES: DealStage[] = ['new_lead', 'contacted', 'discovery', 'proposal', 'negotiation'];

export function pipelineSummary(deals: Deal[]): PipelineSummary {
  const byStage = Object.fromEntries(DEAL_STAGES.map((s) => [s, { count: 0, value: {} as CurrencyTotals }])) as PipelineSummary['byStage'];
  const weighted: CurrencyTotals = {};
  const wonValue: CurrencyTotals = {};
  let unweightedOpenCount = 0;
  for (const d of deals) {
    if (d.deleted_at) continue;
    byStage[d.stage].count++;
    addToTotals(byStage[d.stage].value, d.currency, d.value_minor);
    if (d.stage === 'won') addToTotals(wonValue, d.currency, d.value_minor);
    if (OPEN_STAGES.includes(d.stage)) {
      if (d.probability == null) unweightedOpenCount++;
      else addToTotals(weighted, d.currency, Math.round((d.value_minor * d.probability) / 100));
    }
  }
  return { byStage, weighted, unweightedOpenCount, wonValue };
}

/** Win rate among closed deals; withheld below 5 closed deals. */
export function winRate(deals: Deal[]): { rate: number; closed: number } | null {
  const closed = deals.filter((d) => !d.deleted_at && (d.stage === 'won' || d.stage === 'lost'));
  if (closed.length < 5) return null;
  return { rate: closed.filter((d) => d.stage === 'won').length / closed.length, closed: closed.length };
}
