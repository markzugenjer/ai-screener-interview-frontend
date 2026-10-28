"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

// The interview itself is always in Bahasa Indonesia, so the sample lines stay Indonesian.
const lines = [
  { who: "ai", text: "Halo Budi! Apa perbedaan let, const, dan var di JavaScript?" },
  { who: "you", text: "var itu function-scoped, sedangkan let dan const block-scoped." },
  { who: "ai", text: "Baik. Kalau const berisi array, apakah kita masih bisa push?" },
  { who: "you", text: "Bisa, karena yang dikunci referensinya, bukan isinya." },
] as const;

/** A looping preview of the interview room: live subtitles, pink for Nara, green for you. */
export function HeroDemo() {
  const { t } = useI18n();
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setI((n) => (n + 1) % lines.length), 3200);
    return () => clearInterval(timer);
  }, [reduce]);
  const line = lines[i]!;
  const aiTalking = line.who === "ai";

  return (
    <motion.div
      className="relative mx-auto w-full max-w-md"
      aria-label={t.landing.demoLabel}
      role="img"
      initial={{ opacity: 0, y: 24, rotate: -1.5 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
    >
      <div className="rounded-[1.75rem] border border-line bg-paper p-4 shadow-lift sm:p-5">
        <div className="grid grid-cols-2 gap-3">
          <Tile label="Nara" sub={t.landing.demoAi} active={aiTalking} tone="blush" />
          <Tile label="Budi" sub={t.landing.demoYou} active={!aiTalking} tone="sage" />
        </div>
        <div className="mt-4 min-h-[5.5rem] rounded-2xl bg-mist px-4 py-3.5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.28, ease: "easeOut" }}
              className="text-[0.9375rem] leading-relaxed"
            >
              <span className={cn("mr-1.5 font-bold", aiTalking ? "text-blush-600" : "text-sage-600")}>
                {aiTalking ? "Nara" : t.landing.demoYou}
              </span>
              <span className="text-ink">{line.text}</span>
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Tile({ label, sub, active, tone }: { label: string; sub: string; active: boolean; tone: "blush" | "sage" }) {
  return (
    <div className={cn("relative grid aspect-[4/3.4] place-items-center rounded-2xl", tone === "blush" ? "bg-blush-50" : "bg-sage-50")}>
      <div className="relative grid place-items-center">
        <motion.span
          aria-hidden
          className={cn("absolute size-20 rounded-full", tone === "blush" ? "bg-blush-200" : "bg-sage-200")}
          animate={active ? { scale: [1, 1.18, 1], opacity: [0.5, 0.85, 0.5] } : { scale: 1, opacity: 0.35 }}
          transition={active ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
        />
        <span
          className={cn(
            "relative grid size-14 place-items-center rounded-full text-lg font-extrabold text-paper",
            tone === "blush" ? "bg-blush-600" : "bg-sage-600",
          )}
        >
          {label[0]}
        </span>
      </div>
      <div className="absolute bottom-2.5 left-3 text-xs">
        <span className="font-semibold text-ink">{label}</span> <span className="text-ink-faint">{sub}</span>
      </div>
    </div>
  );
}
