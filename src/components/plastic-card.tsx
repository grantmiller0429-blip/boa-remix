import { FlagMark } from "@/components/flag-mark";

export function PlasticCard({
  product,
  last4,
  exp,
  holder,
  kind,
  locked,
}: {
  product: string;
  last4: string;
  exp: string;
  holder: string;
  kind: "debit" | "credit";
  locked?: boolean;
}) {
  const debit = kind === "debit";
  return (
    <div
      className={
        "relative aspect-[1.586/1] w-full max-w-sm overflow-hidden rounded-2xl p-5 text-card shadow-md " +
        (debit ? "bg-navy" : "bg-navy-deep")
      }
    >
      <span
        className={"absolute top-0 h-full w-2 " + (debit ? "right-0 bg-flag" : "left-0 bg-flag")}
        aria-hidden="true"
      />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-widest text-chip uppercase">
            {debit ? "Debit" : "Credit"}
          </p>
          <p className="mt-1 text-sm font-bold tracking-tight">{product}</p>
        </div>
        <span className="mt-1" aria-hidden="true">
          <FlagMark className="size-8" />
        </span>
      </div>
      <p className="mt-6 font-semibold tracking-widest sm:text-lg">•••• •••• •••• {last4}</p>
      <div className="mt-4 flex items-end justify-between text-xs">
        <div>
          <p className="text-chip uppercase">Cardholder</p>
          <p className="mt-0.5 max-w-48 truncate font-semibold tracking-wide uppercase">{holder}</p>
        </div>
        <div className="text-right">
          <p className="text-chip uppercase">Expires</p>
          <p className="mt-0.5 font-semibold">{exp}</p>
        </div>
      </div>
      {locked ? (
        <div className="absolute inset-0 grid place-items-center bg-ink/75 text-sm font-bold tracking-wide text-card uppercase">
          Card locked
        </div>
      ) : null}
    </div>
  );
}
