import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Wordmark } from "@/components/flag-mark";
import { writeSessionName } from "@/lib/use-demo-ledger";

export const Route = createFileRoute("/")({ component: LoginPage });

const SAVED_ID = "boa-remix-saved-id";

function LoginPage() {
  const navigate = useNavigate();
  const [onlineId, setOnlineId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [saveId, setSaveId] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(SAVED_ID);
    if (saved) {
      setOnlineId(saved);
      setSaveId(true);
    }
  }, []);

  function handleLogin(event: FormEvent) {
    event.preventDefault();
    if (!onlineId.trim() || !passcode) {
      setError("Please enter both your Online ID and Passcode.");
      return;
    }
    if (saveId) localStorage.setItem(SAVED_ID, onlineId.trim());
    else localStorage.removeItem(SAVED_ID);
    writeSessionName(onlineId.trim());
    void navigate({ to: "/dashboard" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-card">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Wordmark />
          <p className="text-sm text-muted">Secure area</p>
        </div>
        <div className="h-1 bg-flag" />
      </header>

      <main className="mx-auto grid w-full max-w-5xl flex-1 gap-10 px-4 py-10 lg:grid-cols-2">
        <form onSubmit={handleLogin} className="space-y-4">
          <h1 className="text-4xl font-normal text-ink">Sign In</h1>
          <p className="text-sm text-muted">Online Banking prototype. Any Online ID and passcode continue.</p>

          {error ? (
            <div className="rounded-sm border border-flag/40 bg-danger-soft px-3 py-2 text-sm text-flag">{error}</div>
          ) : null}

          <div>
            <label htmlFor="online-id" className="mb-1 block text-sm font-semibold text-ink">
              Online ID
            </label>
            <input
              id="online-id"
              type="text"
              autoComplete="username"
              value={onlineId}
              onChange={(event) => setOnlineId(event.target.value)}
              className="h-11 w-full rounded-sm border border-field px-3 text-base focus:border-link focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="passcode" className="mb-1 block text-sm font-semibold text-ink">
              Passcode
            </label>
            <input
              id="passcode"
              type="password"
              autoComplete="current-password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              className="h-11 w-full rounded-sm border border-field px-3 text-base focus:border-link focus:outline-none"
            />
          </div>

          <label className="flex items-center text-sm text-ink">
            <input
              type="checkbox"
              checked={saveId}
              onChange={(event) => setSaveId(event.target.checked)}
              className="mr-2 size-4 accent-navy"
            />
            Save this Online ID
          </label>

          <button
            type="submit"
            className="h-11 min-w-40 rounded-sm bg-flag px-6 text-base font-semibold text-card hover:bg-flag-deep"
          >
            Sign In
          </button>

          <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <button type="button" onClick={() => setHint((open) => !open)} className="font-semibold text-link hover:underline">
              Forgot ID / Passcode
            </button>
            <span className="text-muted">Enroll</span>
          </div>
          {hint ? <p className="text-sm text-muted">Demo session. Enter any passcode to continue.</p> : null}
        </form>

        <aside className="border-line lg:border-l lg:pl-10">
          <h2 className="text-lg font-semibold text-navy">Sign-in help</h2>
          <ul className="mt-3 space-y-3 text-sm leading-6 text-ink">
            <li>Use the Online ID and passcode you created for this prototype.</li>
            <li>We will never ask for your passcode by email or text.</li>
            <li>This is a design remix. No real account is connected.</li>
          </ul>
        </aside>
      </main>

      <footer className="bg-paper px-4 py-6 text-center text-xs leading-5 text-muted">
        Bank of America, N.A. Member FDIC. Prototype remix, not a real banking session.
      </footer>
    </div>
  );
}
