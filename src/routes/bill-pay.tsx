import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { BankChrome } from "@/components/bank-chrome";
import { dollarsToCents, formatUsd } from "@/lib/demo-ledger";
import { readSessionName, useDemoLedger } from "@/lib/use-demo-ledger";

export const Route = createFileRoute("/bill-pay")({ component: BillPayPage });

const PAYEES = ["City Power", "Northside Rent", "Mobile Wireless", "Metro Water"];

function BillPayPage() {
  const navigate = useNavigate();
  const ledger = useDemoLedger();
  const [holder, setHolder] = useState("");
  const [payee, setPayee] = useState(PAYEES[0]);
  const [amount, setAmount] = useState("");
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

  const bills = ledger.entries.filter((entry) => entry.description.includes("Bill pay:"));

  function submit(event: FormEvent) {
    event.preventDefault();
    const cents = dollarsToCents(amount);
    if (cents == null) {
      setError("Enter a valid amount in dollars and cents.");
      return;
    }
    const result = ledger.transfer({
      sourceAccountId: "checking",
      destination: "external",
      amountCents: cents,
      description: `Bill pay: ${payee}`,
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setAmount("");
    setError("");
    setNotice(`${formatUsd(cents)} scheduled to ${payee} from Advantage Checking.`);
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BankChrome holder={holder} active="bill-pay" />
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <section className="border border-line bg-card px-5 py-5">
          <h1 className="text-3xl font-normal">Bill pay</h1>
          <p className="mt-1 text-sm text-muted">Demo payees only. Nothing is sent to a real biller.</p>
        </section>
        {notice ? <p className="bg-ok-soft px-4 py-3 text-sm font-medium text-ok">{notice}</p> : null}
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <form onSubmit={submit} className="space-y-3 border border-line bg-card p-5">
            <h2 className="font-semibold text-navy">Pay a bill</h2>
            {error ? <p className="text-sm text-flag">{error}</p> : null}
            <label className="block text-sm font-semibold" htmlFor="payee">
              Payee
            </label>
            <select
              id="payee"
              value={payee}
              onChange={(event) => setPayee(event.target.value)}
              className="h-11 w-full rounded-sm border border-field px-3 text-sm"
            >
              {PAYEES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <label className="block text-sm font-semibold" htmlFor="bill-amount">
              Amount
            </label>
            <input
              id="bill-amount"
              inputMode="decimal"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-12 w-full rounded-sm border border-field px-3 text-lg font-semibold"
            />
            <p className="text-sm text-muted">From Advantage Checking</p>
            <button type="submit" className="h-11 rounded-sm bg-flag px-5 text-sm font-semibold text-card hover:bg-flag-deep">
              Schedule payment
            </button>
          </form>
          <section className="border border-line bg-card">
            <h2 className="border-b border-line px-5 py-3 font-semibold">Recent payments</h2>
            {bills.length === 0 ? (
              <p className="px-5 py-8 text-sm text-muted">No demo bill payments yet.</p>
            ) : (
              <ul className="divide-y divide-line">
                {bills.map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 px-5 py-4 text-sm">
                    <div>
                      <p className="font-semibold">{entry.description.replace(/^Wire out: /, "")}</p>
                      <p className="text-xs text-muted">
                        {new Date(entry.timestamp).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <span className="font-semibold text-flag">−{formatUsd(entry.amountCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </main>
    </div>
  );
}
