export type DepositId = "checking" | "savings";
export type AccountId = DepositId | "credit";
export type EntryType = "CREDIT" | "DEBIT";
export type Destination = DepositId | "external" | "credit";

export type LedgerEntry = {
  id: string;
  accountId: AccountId;
  entryType: EntryType;
  amountCents: number;
  counterparty: string;
  description: string;
  idempotencyKey: string;
  timestamp: string;
};

export const ACCOUNTS: Record<AccountId, { id: AccountId; label: string; masked: string }> = {
  checking: {
    id: "checking",
    label: "Advantage Checking",
    masked: "••••5432",
  },
  savings: {
    id: "savings",
    label: "Rewards Savings",
    masked: "••••9876",
  },
  credit: {
    id: "credit",
    label: "Custom Cash Rewards",
    masked: "••••2291",
  },
};

export const DEBIT_CARD = {
  product: "Advantage Debit",
  last4: "4418",
  exp: "09/29",
  linkedAccount: "checking" as const,
};

export const CREDIT_CARD = {
  product: "Custom Cash Rewards",
  last4: "2291",
  exp: "04/29",
  limitCents: 800_000,
  dueDate: "2026-11-12",
};

/** Balances before posted history, so activity and totals stay in agreement. */
const OPENING_CENTS: Record<AccountId, number> = {
  checking: 268_135,
  savings: 1_489_210,
  // Liability stored as a negative asset. Seeds bring this to −$1,842.30 owed.
  credit: -193_592,
};

export const SEED_ENTRIES: LedgerEntry[] = [
  {
    id: "tx-102",
    accountId: "checking",
    entryType: "DEBIT",
    amountCents: 685,
    counterparty: "Starbucks",
    description: "Starbucks Coffee Remix",
    idempotencyKey: "seed-tx-102",
    timestamp: "2026-10-15T15:12:00.000Z",
  },
  {
    id: "tx-101",
    accountId: "checking",
    entryType: "CREDIT",
    amountCents: 245_000,
    counterparty: "Payroll",
    description: "Direct Deposit Payroll",
    idempotencyKey: "seed-tx-101",
    timestamp: "2026-10-14T12:00:00.000Z",
  },
  {
    id: "cc-203",
    accountId: "credit",
    entryType: "DEBIT",
    amountCents: 4_218,
    counterparty: "Shell",
    description: "Shell Gas",
    idempotencyKey: "seed-cc-203",
    timestamp: "2026-10-15T18:40:00.000Z",
  },
  {
    id: "cc-202",
    accountId: "credit",
    entryType: "DEBIT",
    amountCents: 6_420,
    counterparty: "Amazon",
    description: "Amazon Marketplace",
    idempotencyKey: "seed-cc-202",
    timestamp: "2026-10-12T16:05:00.000Z",
  },
  {
    id: "cc-201",
    accountId: "credit",
    entryType: "CREDIT",
    amountCents: 20_000,
    counterparty: "Advantage Checking",
    description: "Payment received",
    idempotencyKey: "seed-cc-201",
    timestamp: "2026-10-08T13:00:00.000Z",
  },
];

export function balanceOf(accountId: AccountId, entries: LedgerEntry[]) {
  return entries.reduce((sum, entry) => {
    if (entry.accountId !== accountId) return sum;
    return entry.entryType === "CREDIT" ? sum + entry.amountCents : sum - entry.amountCents;
  }, OPENING_CENTS[accountId]);
}

/** Amount owed on the credit card. Overpayment shows as zero here. */
export function creditOwedCents(entries: LedgerEntry[]) {
  const stored = balanceOf("credit", entries);
  return stored < 0 ? -stored : 0;
}

export function availableCreditCents(entries: LedgerEntry[]) {
  return CREDIT_CARD.limitCents - creditOwedCents(entries);
}

export function minimumDueCents(entries: LedgerEntry[]) {
  const owed = creditOwedCents(entries);
  if (owed <= 0) return 0;
  return Math.min(3_500, owed);
}

export function formatUsd(cents: number) {
  return (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

export function dollarsToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) return null;
  const [dollars, fraction = ""] = trimmed.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents <= 0) return null;
  return cents;
}

type TransferKind = "wire" | "debit-card" | "card-payment" | "transfer";

type TransferInput = {
  sourceAccountId: DepositId;
  destination: Destination;
  amountCents: number;
  description: string;
  idempotencyKey: string;
  kind?: TransferKind;
};

export function executeInternalTransfer(
  entries: LedgerEntry[],
  input: TransferInput,
): { entries: LedgerEntry[]; txnRef: string } | { error: string } {
  if (input.amountCents <= 0) {
    return { error: "Transaction amount must be positive." };
  }

  const debitKey = `${input.idempotencyKey}-debit`;
  if (entries.some((entry) => entry.idempotencyKey === debitKey)) {
    return { error: "This transfer was already posted." };
  }

  if (input.destination !== "external" && input.destination === input.sourceAccountId) {
    return { error: "Choose a different destination account." };
  }

  const sourceBalance = balanceOf(input.sourceAccountId, entries);
  if (sourceBalance < input.amountCents) {
    return { error: "Transaction declined: insufficient clear funds available." };
  }

  if (input.kind === "card-payment") {
    const owed = creditOwedCents(entries);
    if (owed <= 0) return { error: "No balance due on this card." };
    if (input.amountCents > owed) {
      return { error: "Amount is more than the current card balance." };
    }
  }

  const now = new Date().toISOString();
  const memo = input.description.trim() || "Internal transfer";
  const kind = input.kind ?? (input.destination === "external" ? "wire" : "transfer");

  const destLabel =
    input.destination === "external"
      ? kind === "debit-card"
        ? memo
        : "External wire"
      : ACCOUNTS[input.destination].label;

  const debitDescription =
    kind === "debit-card"
      ? `Debit card: ${memo}`
      : kind === "card-payment"
        ? `Card payment: ${memo}`
        : input.destination === "external"
          ? `Wire out: ${memo}`
          : `Transfer out: ${memo}`;

  const debit: LedgerEntry = {
    id: debitKey,
    accountId: input.sourceAccountId,
    entryType: "DEBIT",
    amountCents: input.amountCents,
    counterparty: destLabel,
    description: debitDescription,
    idempotencyKey: debitKey,
    timestamp: now,
  };

  const posted: LedgerEntry[] = [debit];

  if (input.destination !== "external") {
    const creditKey = `${input.idempotencyKey}-credit`;
    posted.unshift({
      id: creditKey,
      accountId: input.destination,
      entryType: "CREDIT",
      amountCents: input.amountCents,
      counterparty: ACCOUNTS[input.sourceAccountId].label,
      description: kind === "card-payment" ? `Payment received: ${memo}` : `Transfer in: ${memo}`,
      idempotencyKey: creditKey,
      timestamp: now,
    });
  }

  return { entries: [...posted, ...entries], txnRef: debit.id };
}

export function postCreditCharge(
  entries: LedgerEntry[],
  input: { amountCents: number; description: string; idempotencyKey: string },
): { entries: LedgerEntry[]; txnRef: string } | { error: string } {
  if (input.amountCents <= 0) {
    return { error: "Transaction amount must be positive." };
  }
  if (availableCreditCents(entries) < input.amountCents) {
    return { error: "Declined: over your available credit." };
  }
  const key = `${input.idempotencyKey}-charge`;
  if (entries.some((entry) => entry.idempotencyKey === key)) {
    return { error: "This charge was already posted." };
  }
  const memo = input.description.trim() || "Card purchase";
  const charge: LedgerEntry = {
    id: key,
    accountId: "credit",
    entryType: "DEBIT",
    amountCents: input.amountCents,
    counterparty: memo,
    description: `Card purchase: ${memo}`,
    idempotencyKey: key,
    timestamp: new Date().toISOString(),
  };
  return { entries: [charge, ...entries], txnRef: charge.id };
}
