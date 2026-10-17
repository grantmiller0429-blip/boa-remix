import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { BankChrome } from "@/components/bank-chrome";
import { PlasticCard } from "@/components/plastic-card";
import { readSessionName, useDemoLedger } from "@/lib/use-demo-ledger";
import {
  CREDIT_CARD,
  availableCreditCents,
  creditOwedCents,
  dollarsToCents,
  formatUsd,
  minimumDueCents,
} from "@/lib/demo-ledger";

export const Route = createFileRoute("/credit")({ component: CreditSessionPage });

function CreditSessionPage() {
  const navigate = useNavigate();
  const ledger = useDemoLedger();
  const [holder, setHolder] = useState("Cardholder");
  const [panel, setPanel] = useState<"pay" | "charge" | null>(null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const name = readSessionName();
    if (!name) {
      void navigate({ to: "/" });
      return;
    }
    setHolder(name);
  }, [navigate]);

  const owed = creditOwedCents(ledger.entries);
  const available = availableCreditCents(ledger.entries);
  const minimum = minimumDueCents(ledger.entries);
  const usedPct = Math.min(100, Math.round((owed / CREDIT_CARD.limitCents) * 100));
  const activity = ledger.entries.filter((entry) => entry.accountId === "credit");

  function openPanel(next: "pay" | "charge") {
    setPanel(next);
    setAmount(next === "pay" && minimum > 0 ? (minimum / 100).toFixed(2) : "");
    setMemo(next === "pay" ? "Online payment" : "");
    setError("");
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(amount);
    if (cents == null) {
      setError("Enter a valid amount in dollars and cents.");
      return;
    }
    const result =
      panel === "pay"
        ? ledger.payCredit({ amountCents: cents, description: memo })
        : ledger.creditPurchase({ amountCents: cents, description: memo });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setNotice(panel === "pay" ? "Payment posted from Advantage Checking." : "Purchase posted to the credit card.");
    setPanel(null);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BankChrome holder={holder} active="credit" />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <section className="border border-line bg-card px-5 py-5">
          <h1 className="text-3xl font-normal">Credit card</h1>
          <p className="mt-1 text-sm text-muted">Custom Cash Rewards</p>
        </section>

        {notice ? <p className="rounded-md bg-ok-soft px-4 py-3 text-sm font-medium text-ok">{notice}</p> : null}

        <section className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-3">
            <PlasticCard
              kind="credit"
              product={CREDIT_CARD.product}
              last4={CREDIT_CARD.last4}
              exp={CREDIT_CARD.exp}
              holder={holder}
              locked={ledger.creditLocked}
            />
            <button
              type="button"
              onClick={() => ledger.toggleCreditLock()}
              className="h-11 rounded-sm border border-navy bg-card px-4 text-sm font-semibold text-navy"
            >
              {ledger.creditLocked ? "Unlock card" : "Lock card"}
            </button>
          </div>

          <div className="border border-line bg-card p-5 lg:col-span-2">
            <p className="text-sm text-muted">Current balance</p>
            <p className="mt-1 text-4xl font-semibold">{formatUsd(owed)}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-line">
              <div className="h-full bg-flag" style={{ width: `${usedPct}%` }} />
            </div>
            <p className="mt-2 text-sm text-muted">
              {formatUsd(available)} available of {formatUsd(CREDIT_CARD.limitCents)} limit
            </p>
            <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-line pt-4 text-sm">
              <div>
                <dt className="text-muted">Minimum due</dt>
                <dd className="mt-1 font-bold">{formatUsd(minimum)}</dd>
              </div>
              <div>
                <dt className="text-muted">Payment due</dt>
                <dd className="mt-1 font-bold">Nov 12, 2026</dd>
              </div>
            </dl>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => openPanel("pay")}
                className="h-11 flex-1 rounded-sm bg-flag text-sm font-semibold text-card hover:bg-flag-deep"
              >
                Pay from checking
              </button>
              <button
                type="button"
                onClick={() => openPanel("charge")}
                className="h-11 flex-1 rounded-sm border border-navy bg-card text-sm font-semibold text-navy"
              >
                New purchase
              </button>
            </div>
            {panel ? (
              <form onSubmit={submit} className="mt-5 space-y-3 border-t border-line pt-5">
                <h2 className="font-bold">{panel === "pay" ? "Pay the card" : "Post a purchase"}</h2>
                {error ? <p className="text-sm text-flag">{error}</p> : null}
                <input
                  inputMode="decimal"
                  required
                  placeholder="Amount"
                  aria-label="Amount"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="h-12 w-full rounded-md border border-line px-3 text-lg font-bold"
                />
                <input
                  placeholder={panel === "pay" ? "Memo" : "Merchant"}
                  aria-label={panel === "pay" ? "Memo" : "Merchant"}
                  value={memo}
                  onChange={(event) => setMemo(event.target.value)}
                  className="h-11 w-full rounded-md border border-line px-3 text-sm"
                />
                <div className="flex gap-3">
                  <button type="button" onClick={() => setPanel(null)} className="h-11 flex-1 rounded-md border">
                    Cancel
                  </button>
                  <button type="submit" className="h-11 flex-1 rounded-sm bg-flag font-semibold text-card hover:bg-flag-deep">
                    Authorize
                  </button>
                </div>
              </form>
            ) : null}
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="border-b border-line bg-paper px-5 py-3 font-bold">Card activity</div>
          <ul className="divide-y divide-line">
            {activity.map((entry) => {
              const charge = entry.entryType === "DEBIT";
              return (
                <li key={entry.id} className="flex items-start justify-between gap-3 px-5 py-4 text-sm">
                  <div>
                    <p className="font-semibold">{entry.description}</p>
                    <p className="text-xs text-muted">
                      {new Date(entry.timestamp).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {" · "}
                      {entry.counterparty}
                    </p>
                  </div>
                  <span className={charge ? "font-bold text-flag" : "font-bold text-ok"}>
                    {charge ? "" : "−"}
                    {formatUsd(entry.amountCents)}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  );
}
