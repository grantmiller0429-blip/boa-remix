import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { BankChrome } from "@/components/bank-chrome";
import { readSessionName } from "@/lib/use-demo-ledger";

export const Route = createFileRoute("/profile")({ component: ProfilePage });

const PROFILE_KEY = "boa-remix-profile";

type Profile = {
  email: string;
  mobile: string;
  address: string;
  paperless: boolean;
};

const EMPTY: Profile = {
  email: "",
  mobile: "",
  address: "",
  paperless: true,
};

function ProfilePage() {
  const navigate = useNavigate();
  const [holder, setHolder] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const name = readSessionName();
    if (!name) {
      void navigate({ to: "/" });
      return;
    }
    setHolder(name);
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) setProfile({ ...EMPTY, ...(JSON.parse(raw) as Profile) });
    } catch {
      setProfile(EMPTY);
    }
  }, [navigate]);

  function save(event: FormEvent) {
    event.preventDefault();
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    setNotice("Profile saved in this browser only.");
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <BankChrome holder={holder} active="profile" />
      <main className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-6">
        <section className="border border-line bg-card px-5 py-5">
          <h1 className="text-3xl font-normal">Profile</h1>
          <p className="mt-1 text-sm text-muted">Demo contact details. They are not sent to a bank.</p>
        </section>
        {notice ? <p className="bg-ok-soft px-4 py-3 text-sm font-medium text-ok">{notice}</p> : null}
        <form onSubmit={save} className="space-y-4 border border-line bg-card p-5">
          <div>
            <p className="text-sm text-muted">Online ID</p>
            <p className="text-lg font-semibold">{holder}</p>
          </div>
          <label className="block text-sm font-semibold">
            Email
            <input
              type="email"
              value={profile.email}
              onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              className="mt-1 h-11 w-full rounded-sm border border-field px-3 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold">
            Mobile
            <input
              type="tel"
              value={profile.mobile}
              onChange={(event) => setProfile({ ...profile, mobile: event.target.value })}
              className="mt-1 h-11 w-full rounded-sm border border-field px-3 font-normal"
            />
          </label>
          <label className="block text-sm font-semibold">
            Mailing address
            <input
              value={profile.address}
              onChange={(event) => setProfile({ ...profile, address: event.target.value })}
              className="mt-1 h-11 w-full rounded-sm border border-field px-3 font-normal"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={profile.paperless}
              onChange={(event) => setProfile({ ...profile, paperless: event.target.checked })}
              className="size-4 accent-navy"
            />
            Paperless statements
          </label>
          <button type="submit" className="h-11 rounded-sm bg-flag px-5 text-sm font-semibold text-card hover:bg-flag-deep">
            Save profile
          </button>
        </form>
      </main>
    </div>
  );
}
