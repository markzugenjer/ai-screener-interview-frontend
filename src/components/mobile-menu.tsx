"use client";

import { ChevronDown, LogOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";
import { useLogout } from "./logout-button";
import { Spinner } from "./ui";

type Props = {
  name: string;
  email: string;
  links: { href: string; label: string }[];
};

/** "Devan Tritama" → "DT", "Budi" → "B". */
function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
  return (first + last).toUpperCase() || "?";
}

/** Phone-sized account menu: an initials button that opens name, page links and log out. */
export function MobileMenu({ name, email, links }: Props) {
  const { t } = useI18n();
  const pathname = usePathname();
  const { busy, logout } = useLogout();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t.nav.menu}
        className="flex h-9 items-center gap-1 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-mist"
      >
        <span className="grid size-7 place-items-center rounded-full bg-sage-100 text-xs font-bold text-sage-700">
          {initials(name)}
        </span>
        <ChevronDown className={cn("size-4 text-ink-faint transition-transform duration-200", open && "rotate-180")} aria-hidden />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className="absolute right-0 top-11 z-50 w-64 origin-top-right rounded-2xl border border-line bg-paper p-1.5 shadow-lift"
          >
            <div className="px-3 pb-2.5 pt-2">
              <p className="truncate text-sm font-bold text-ink">{name}</p>
              <p className="truncate text-xs text-ink-faint">{email}</p>
            </div>
            <div className="border-t border-line pt-1.5">
              {links.map((l) => {
                const active = pathname === l.href.split("#")[0];
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    role="menuitem"
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-3 py-2.5 text-sm font-medium transition-colors hover:bg-mist",
                      active ? "text-sage-700" : "text-ink-soft",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </div>
            <div className="mt-1.5 border-t border-line pt-1.5">
              <button
                type="button"
                role="menuitem"
                onClick={logout}
                disabled={busy}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-blush-700 transition-colors hover:bg-blush-50 disabled:opacity-60"
              >
                {busy ? <Spinner /> : <LogOut className="size-4" aria-hidden />}
                {t.nav.logout}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
