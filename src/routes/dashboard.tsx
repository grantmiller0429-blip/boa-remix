import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { BankChrome } from "@/components/bank-chrome";
import { PlasticCard } from "@/components/plastic-card";
import {
  ACCOUNTS,
  CREDIT_CARD,
  DEBIT_CARD,
  availableCreditCents,
  balanceOf,
  creditOwedCents,
  dollarsToCents,
  formatUsd,
  type DepositId,
} from "@/lib/demo-ledger";
import { readSessionName, useDemoLedger } from "@/lib/use-demo-ledger";

export const Route = createFileRoute("/dashboard")({ component: DashboardPage });

function DashboardPage() {
  const navigate = useNavigate();
  const ledger = useDemoLedger();
  const [holder, setHolder] = useState("Cardholder");
  const [selected, setSelected] = useState<DepositId>("checking");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferMemo, setTransferMemo] = useState("");
  const [destination, setDestination] = useState<"checking" | "savings" | "external">("savings");
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferError, setTransferError] = useState("");
  const [cardOpen, setCardOpen] = useState(false);
  const [cardAmount, setCardAmount] = useState("");
  const [cardMemo, setCardMemo] = useState("");
  const [cardError, setCardError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const name = readSessionName();
    if (!name) {
      void navigate({ to: "/" });
      return;
    }
    setHolder(name);
  }, [navigate]);

  const checking = balanceOf("checking", ledger.entries);
  const savings = balanceOf("savings", ledger.entries);
  const activity = ledger.entries.filter((entry) => entry.accountId === selected);

  function submitTransfer(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(transferAmount);
    if (cents == null) {
      setTransferError("Enter a valid amount in dollars and cents.");
      return;
    }
    const result = ledger.transfer({
      sourceAccountId: selected,
      destination,
      amountCents: cents,
      description: transferMemo,
    });
    if (!result.ok) {
      setTransferError(result.error);
      return;
    }
    setTransferOpen(false);
    setTransferAmount("");
    setTransferMemo("");
    setNotice("Transfer posted.");
  }

  function submitDebit(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(cardAmount);
    if (cents == null) {
      setCardError("Enter a valid amount in dollars and cents.");
      return;
    }
    const result = ledger.debitPurchase({ amountCents: cents, description: cardMemo });
    if (!result.ok) {
      setCardError(result.error);
      return;
    }
    setCardOpen(false);
    setCardAmount("");
    setCardMemo("");
    setSelected("checking");
    setNotice("Debit card purchase posted to Advantage Checking.");
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BankChrome holder={holder} active="accounts" />

      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <section className="flex flex-col gap-4 bg-card px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-normal">Accounts</h1>
            <p className="mt-1 text-sm text-muted">Hello, {holder}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setTransferOpen(true);
              setTransferError("");
              setDestination(selected === "checking" ? "savings" : "checking");
            }}
            className="h-11 rounded-sm bg-flag px-5 text-sm font-semibold text-card hover:bg-flag-deep"
          >
            Transfer
          </button>
        </section>

        {notice ? (
          <p className="rounded-md border border-ok/30 bg-ok-soft px-4 py-3 text-sm font-medium text-ok">{notice}</p>
        ) : null}

        <section className="overflow-hidden border border-line bg-card">
          <AccountButton
            label="Advantage Checking"
            masked={ACCOUNTS.checking.masked}
            amount={checking}
            selected={selected === "checking"}
            onClick={() => setSelected("checking")}
          />
          <AccountButton
            label="Rewards Savings"
            masked={ACCOUNTS.savings.masked}
            amount={savings}
            selected={selected === "savings"}
            onClick={() => setSelected("savings")}
          />
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-navy">Cards</h2>
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-xl border border-line bg-card p-5">
              <PlasticCard
                kind="debit"
                product={DEBIT_CARD.product}
                last4={DEBIT_CARD.last4}
                exp={DEBIT_CARD.exp}
                holder={holder}
                locked={ledger.debitLocked}
              />
              <p className="mt-3 text-sm text-muted">
                Linked to Advantage Checking ({ACCOUNTS.checking.masked}) · {formatUsd(checking)} available
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => ledger.toggleDebitLock()}
                  className="h-11 flex-1 rounded-sm border border-navy text-sm font-semibold text-navy"
                >
                  {ledger.debitLocked ? "Unlock card" : "Lock card"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCardOpen(true);
                    setCardError("");
                  }}
                  className="h-11 flex-1 rounded-sm bg-flag text-sm font-semibold text-card hover:bg-flag-deep"
                >
                  Use debit card
                </button>
              </div>
              {cardOpen ? (
                <form onSubmit={submitDebit} className="mt-4 space-y-3 border-t border-line pt-4">
                  {cardError ? <p className="text-sm text-flag">{cardError}</p> : null}
                  <input
                    inputMode="decimal"
                    required
                    placeholder="Amount"
                    aria-label="Debit amount"
                    value={cardAmount}
                    onChange={(event) => setCardAmount(event.target.value)}
                    className="h-12 w-full rounded-md border border-line px-3 text-lg font-bold"
                  />
                  <input
                    placeholder="Merchant"
                    aria-label="Merchant"
                    value={cardMemo}
                    onChange={(event) => setCardMemo(event.target.value)}
                    className="h-11 w-full rounded-md border border-line px-3 text-sm"
                  />
                  <button type="submit" className="h-11 w-full rounded-md bg-flag font-semibold text-card">
                    Authorize purchase
                  </button>
                </form>
              ) : null}
            </div>

            <Link to="/credit" className="rounded-xl border border-line bg-card p-5">
              <PlasticCard
                kind="credit"
                product={CREDIT_CARD.product}
                last4={CREDIT_CARD.last4}
                exp={CREDIT_CARD.exp}
                holder={holder}
              />
              <p className="mt-3 text-sm font-semibold text-navy">Open credit card session</p>
              <p className="mt-1 text-sm text-muted">
                {formatUsd(creditOwedCents(ledger.entries))} balance ·{" "}
                {formatUsd(availableCreditCents(ledger.entries))} available
              </p>
            </Link>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-line bg-card">
          <div className="border-b border-line bg-paper px-5 py-3 font-bold">{ACCOUNTS[selected].label} activity</div>
          {activity.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">No posted activity on this account yet.</p>
          ) : (
            <ul className="divide-y divide-line">
              {activity.map((entry) => (
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
                  <span className={entry.entryType === "CREDIT" ? "font-bold text-ok" : "font-bold text-flag"}>
                    {entry.entryType === "CREDIT" ? "+" : "−"}
                    {formatUsd(entry.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="px-4 py-6 text-center text-xs text-muted">
        <button type="button" onClick={() => ledger.resetDemo()} className="font-medium text-navy underline">
          Reset demo ledger
        </button>
      </footer>

      {transferOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-ink/50 sm:items-center">
          <form
            onSubmit={submitTransfer}
            className="w-full max-w-md space-y-3 rounded-t-xl bg-card p-5 sm:rounded-xl"
          >
            <h2 className="font-bold">Transfer funds</h2>
            <p className="text-sm text-muted">From {ACCOUNTS[selected].label}</p>
            {transferError ? <p className="text-sm text-flag">{transferError}</p> : null}
            <label className="block text-sm font-medium" htmlFor="transfer-dest">
              Destination
            </label>
            <select
              id="transfer-dest"
              value={destination}
              onChange={(event) => setDestination(event.target.value as "checking" | "savings" | "external")}
              className="h-11 w-full rounded-md border border-line px-3 text-sm"
            >
              {selected !== "savings" ? <option value="savings">Rewards Savings</option> : null}
              {selected !== "checking" ? <option value="checking">Advantage Checking</option> : null}
              <option value="external">External wire</option>
            </select>
            <input
              inputMode="decimal"
              required
              placeholder="Amount"
              aria-label="Transfer amount"
              value={transferAmount}
              onChange={(event) => setTransferAmount(event.target.value)}
              className="h-12 w-full rounded-md border border-line px-3 text-lg font-bold"
            />
            <input
              placeholder="Description"
              aria-label="Transfer description"
              value={transferMemo}
              onChange={(event) => setTransferMemo(event.target.value)}
              className="h-11 w-full rounded-md border border-line px-3 text-sm"
            />
            <div className="flex gap-3">
              <button type="button" onClick={() => setTransferOpen(false)} className="h-11 flex-1 rounded-md border">
                Cancel
              </button>
              <button type="submit" className="h-11 flex-1 rounded-md bg-flag font-semibold text-card">
                Authorize
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function AccountButton({
  label,
  masked,
  amount,
  selected,
  onClick,
}: {
  label: string;
  masked: string;
  amount: number;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center justify-between border-b border-line bg-card px-5 py-4 text-left last:border-b-0 " +
        (selected ? "border-l-4 border-l-flag" : "border-l-4 border-l-transparent")
      }
    >
      <div>
        <p className="text-base font-semibold text-link">{label}</p>
        <p className="text-sm text-muted">{masked}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-muted">Available balance</p>
        <p className="text-2xl font-semibold">{formatUsd(amount)}</p>
      </div>
    </button>
  );
}
