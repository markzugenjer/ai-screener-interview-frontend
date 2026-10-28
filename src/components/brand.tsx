import Link from "next/link";

/** Two voices in conversation: the pink arc is the AI, the green arc is you. */
export function BrandMark({ className = "size-7" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden>
      <rect width="32" height="32" rx="9" fill="#1d2b23" />
      <path d="M9 19.5c0-4.2 3.1-7.5 7-7.5" stroke="#e89aab" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M23 12.5c0 4.2-3.1 7.5-7 7.5" stroke="#7fc49a" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
  );
}

export function Brand({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg font-bold tracking-tight text-ink sm:gap-2.5">
      <BrandMark />
      <span className="text-[1.0625rem]">
        Dicy Talks
      </span>
    </Link>
  );
}
