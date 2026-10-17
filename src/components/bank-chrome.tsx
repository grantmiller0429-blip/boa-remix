import { Link } from "@tanstack/react-router";
import { clearSessionName } from "@/lib/use-demo-ledger";
import { Wordmark } from "@/components/flag-mark";

export type BankSection = "accounts" | "credit" | "bill-pay" | "statements" | "profile";

const LINKS: { to: "/dashboard" | "/credit" | "/bill-pay" | "/statements" | "/profile"; id: BankSection; label: string }[] =
  [
    { to: "/dashboard", id: "accounts", label: "Accounts" },
    { to: "/credit", id: "credit", label: "Credit card" },
    { to: "/bill-pay", id: "bill-pay", label: "Bill pay" },
    { to: "/statements", id: "statements", label: "Statements" },
    { to: "/profile", id: "profile", label: "Profile" },
  ];

export function BankChrome({
  holder,
  active,
}: {
  holder?: string;
  active: BankSection;
}) {
  return (
    <header className="border-b border-line bg-card text-ink">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Wordmark />
        <div className="flex items-center gap-4 text-sm">
          {holder ? <span className="hidden text-muted sm:inline">{holder}</span> : null}
          <Link to="/" onClick={() => clearSessionName()} className="font-semibold text-link hover:underline">
            Sign out
          </Link>
        </div>
      </div>
      <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-2">
        {LINKS.map((item) => (
          <Link
            key={item.id}
            to={item.to}
            className={
              "inline-flex h-11 shrink-0 items-center border-b-4 px-4 text-sm font-semibold " +
              (active === item.id ? "border-flag text-ink" : "border-transparent text-navy hover:border-line")
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <p className="bg-paper px-4 py-2 text-center text-xs text-muted">
        Prototype. Not a real banking session.
      </p>
    </header>
  );
}
