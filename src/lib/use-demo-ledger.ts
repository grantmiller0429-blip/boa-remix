import { useEffect, useState } from "react";
import {
  SEED_ENTRIES,
  executeInternalTransfer,
  postCreditCharge,
  type LedgerEntry,
} from "./demo-ledger";

const KEY = "boa-remix-ledger-v2";
const SESSION_KEY = "boa-remix-session";

type State = {
  entries: LedgerEntry[];
  debitLocked: boolean;
  creditLocked: boolean;
};

const INITIAL: State = {
  entries: SEED_ENTRIES,
  debitLocked: false,
  creditLocked: false,
};

export function readSessionName() {
  if (typeof sessionStorage === "undefined") return "";
  return sessionStorage.getItem(SESSION_KEY) ?? "";
}

export function writeSessionName(onlineId: string) {
  sessionStorage.setItem(SESSION_KEY, onlineId);
}

export function clearSessionName() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function useDemoLedger() {
  const [state, setState] = useState<State>(INITIAL);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...INITIAL, ...(JSON.parse(raw) as State) });
    } catch {
      setState(INITIAL);
    }
  }, []);

  function commit(next: State) {
    setState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  }

  return {
    ...state,
    toggleDebitLock() {
      commit({ ...state, debitLocked: !state.debitLocked });
    },
    toggleCreditLock() {
      commit({ ...state, creditLocked: !state.creditLocked });
    },
    transfer(input: {
      sourceAccountId: "checking" | "savings";
      destination: "checking" | "savings" | "external";
      amountCents: number;
      description: string;
    }) {
      const result = executeInternalTransfer(state.entries, {
        sourceAccountId: input.sourceAccountId,
        destination: input.destination,
        amountCents: input.amountCents,
        description: input.description,
        idempotencyKey: `tx-${crypto.randomUUID()}`,
      });
      if ("error" in result) return { ok: false as const, error: result.error };
      commit({ ...state, entries: result.entries });
      return { ok: true as const, txnRef: result.txnRef };
    },
    debitPurchase(input: { amountCents: number; description: string }) {
      if (state.debitLocked) return { ok: false as const, error: "Debit card is locked." };
      const result = executeInternalTransfer(state.entries, {
        sourceAccountId: "checking",
        destination: "external",
        amountCents: input.amountCents,
        description: input.description,
        idempotencyKey: `tx-${crypto.randomUUID()}`,
        kind: "debit-card",
      });
      if ("error" in result) return { ok: false as const, error: result.error };
      commit({ ...state, entries: result.entries });
      return { ok: true as const, txnRef: result.txnRef };
    },
    creditPurchase(input: { amountCents: number; description: string }) {
      if (state.creditLocked) return { ok: false as const, error: "Credit card is locked." };
      const result = postCreditCharge(state.entries, {
        amountCents: input.amountCents,
        description: input.description,
        idempotencyKey: `tx-${crypto.randomUUID()}`,
      });
      if ("error" in result) return { ok: false as const, error: result.error };
      commit({ ...state, entries: result.entries });
      return { ok: true as const, txnRef: result.txnRef };
    },
    payCredit(input: { amountCents: number; description: string }) {
      const result = executeInternalTransfer(state.entries, {
        sourceAccountId: "checking",
        destination: "credit",
        amountCents: input.amountCents,
        description: input.description || "Online payment",
        idempotencyKey: `tx-${crypto.randomUUID()}`,
        kind: "card-payment",
      });
      if ("error" in result) return { ok: false as const, error: result.error };
      commit({ ...state, entries: result.entries });
      return { ok: true as const, txnRef: result.txnRef };
    },
    resetDemo() {
      commit(INITIAL);
    },
  };
}
