export function FlagMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect width="36" height="36" rx="1.5" fill="var(--color-navy)" />
      <polygon points="0,22 22,0 36,0 0,36" fill="var(--color-flag)" />
      <polygon points="0,10 10,0 20,0 0,20" fill="var(--color-navy)" />
      <polygon points="0,0 8,0 0,8" fill="var(--color-flag)" />
      <polygon points="16,36 36,16 36,26 26,36" fill="var(--color-navy)" />
      <polygon points="28,36 36,28 36,36" fill="var(--color-flag)" />
    </svg>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <FlagMark />
      <span className={"text-lg leading-none font-bold tracking-tight " + (light ? "text-card" : "text-navy")}>
        Bank of America
      </span>
    </span>
  );
}
