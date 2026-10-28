"use client";

import { Check, Languages } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { LOCALE_COOKIE, localeNames, localeShort, locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

/** Remembers the language for a year and updates the page's lang attribute (for screen readers). */
function saveLocale(next: Locale) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LOCALE_COOKIE}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
  document.documentElement.setAttribute("lang", next);
}

/** Saves the choice and re-renders the page in the new language. */
export function LanguageSwitcher({ align = "right" }: { align?: "left" | "right" }) {
  const { locale, t } = useI18n();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
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

  function choose(next: Locale) {
    setOpen(false);
    if (next === locale) return;
    saveLocale(next);
    startTransition(() => router.refresh());
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${t.common.language}: ${localeNames[locale]}`}
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-full px-2 text-sm font-semibold sm:px-3 text-ink-soft transition-colors hover:bg-mist hover:text-ink",
          pending && "opacity-60",
        )}
      >
        <Languages className="hidden size-4 min-[400px]:block" aria-hidden />
        {localeShort[locale]}
      </button>
      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            aria-label={t.common.language}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            className={cn(
              "absolute top-11 z-50 min-w-48 origin-top rounded-2xl border border-line bg-paper p-1.5 shadow-lift",
              align === "right" ? "right-0" : "left-0",
            )}
          >
            {locales.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l === locale}
                  onClick={() => choose(l)}
                  className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-mist"
                >
                  <span>
                    <span className="mr-2 font-semibold text-ink-faint">{localeShort[l]}</span>
                    {localeNames[l]}
                  </span>
                  {l === locale && <Check className="size-4 text-sage-600" aria-hidden />}
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
