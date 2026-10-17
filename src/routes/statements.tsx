import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BankChrome } from "@/components/bank-chrome";
import { ACCOUNTS, balanceOf, formatUsd, type AccountId } from "@/lib/demo-ledger";
import { readSessionName, useDemoLedger } from "@/lib/use-demo-ledger";

export const Route = createFileRoute("/statements")({ component: StatementsPage });

const PERIODS = [
  { id: "2026-10", label: "October 2026" },
  { id: "2026-09", label: "September 2026" },
];

function StatementsPage() {
  const navigate = useNavigate();
  const ledger = useDemoLedger();
  const [holder, setHolder] = useState("");
  const [account, setAccount] = useState<AccountId>("checking");
  const [period, setPeriod] = useState(PERIODS[0].id);

  useEffect(() => {
    const name = readSessionName();
    if (!name) {
      void navigate({ to: "/" });
      return;
    }
    setHolder(name);
  }, [navigate]);

  const rows = ledger.entries.filter((entry) => {
    if (entry.accountId !== account) return false;
    return entry.timestamp.startsWith(period);
  });
  const ending = balanceOf(account, ledger.entries);

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BankChrome holder={holder} active="statements" />
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6">
        <section className="border border-line bg-card px-5 py-5">
          <h1 className="text-3xl font-normal">Statements</h1>
          <p className="mt-1 text-sm text-muted">Sample statements for this prototype. They are not official records.</p>
        </section>
        <section className="flex flex-col gap-3 border border-line bg-card p-5 sm:flex-row">
          <label className="flex-1 text-sm font-semibold">
            Account
            <select
              value={account}
              onChange={(event) => setAccount(event.target.value as AccountId)}
              className="mt-1 h-11 w-full rounded-sm border border-field px-3 font-normal"
            >
              {(Object.keys(ACCOUNTS) as AccountId[]).map((id) => (
                <option key={id} value={id}>
                  {ACCOUNTS[id].label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex-1 text-sm font-semibold">
            Period
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="mt-1 h-11 w-full rounded-sm border border-field px-3 font-normal"
            >
              {PERIODS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </section>
        <section className="border border-line bg-card">
          <div className="flex items-end justify-between gap-3 border-b border-line px-5 py-4">
            <div>
              <p className="text-sm text-muted">{ACCOUNTS[account].label}</p>
              <p className="text-lg font-semibold">{PERIODS.find((item) => item.id === period)?.label}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted">Ending balance in this demo</p>
              <p className="text-2xl font-semibold">{formatUsd(account === "credit" ? Math.abs(ending) : ending)}</p>
            </div>
          </div>
          {rows.length === 0 ? (
            <p className="px-5 py-8 text-sm text-muted">No posted activity in this period.</p>
          ) : (
            <ul className="divide-y divide-line">
              {rows.map((entry) => (
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
                  <span className={entry.entryType === "CREDIT" ? "font-semibold text-ok" : "font-semibold text-flag"}>
                    {entry.entryType === "CREDIT" ? "+" : "−"}
                    {formatUsd(entry.amountCents)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
