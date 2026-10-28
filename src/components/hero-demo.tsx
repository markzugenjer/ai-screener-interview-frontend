"use client";

import { CheckCircle2, LockKeyhole, Mic, PhoneOff, RotateCcw, Sparkles } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

// The interview itself is always in Bahasa Indonesia, so the sample lines stay Indonesian.
const lines = [
  { who: "ai", text: "Halo Budi! Boleh ceritakan sedikit tentang dirimu?" },
  { who: "you", text: "Saya lulusan baru yang suka belajar hal baru dan bekerja dalam tim." },
  { who: "ai", text: "Menarik! Pencapaian apa yang paling kamu banggakan?" },
  { who: "you", text: "Memimpin proyek kampus bersama tim sampai selesai tepat waktu." },
] as const;

const ease = [0.22, 1, 0.36, 1] as const;

/** A looping preview of the interview room: live subtitles, pink for Dicy, green for you. */
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
      initial={{ opacity: 0, y: 28, rotate: -2 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, ease, delay: 0.15 }}
    >
      {/* A tilted "paper" behind the card for depth. */}
      <div aria-hidden className="absolute inset-0 -z-10 translate-x-3 translate-y-3 rotate-3 rounded-[1.75rem] bg-blush-100/70" />

      <div className="rounded-[1.75rem] border border-line bg-paper/95 p-4 shadow-[0_2px_6px_rgb(29_43_35/0.05),0_30px_60px_-30px_rgb(29_43_35/0.35)] backdrop-blur sm:p-5">
        {/* Call bar */}
        <div className="mb-3.5 flex items-center justify-between gap-3 px-1">
          <span className="inline-flex items-center gap-2 rounded-full bg-blush-50 px-2.5 py-1 text-xs font-bold text-blush-700">
            <span className="relative flex size-2">
              <span className="motion-loop absolute inset-0 animate-ping-soft rounded-full bg-blush-400" />
              <span className="relative size-2 rounded-full bg-blush-600" />
            </span>
            {t.room.live}
            <CallTimer />
          </span>
          <span className="truncate text-xs font-semibold text-ink-faint">{t.landing.demoRole}</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Tile label="Dicy" sub={t.landing.demoAi} active={aiTalking} tone="blush" />
          <Tile label="Budi" sub={t.landing.demoYou} active={!aiTalking} tone="sage" />
        </div>

        <div className="mt-3.5 min-h-[5.5rem] rounded-2xl bg-mist px-4 py-3.5">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -6, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="text-[0.9375rem] leading-relaxed"
            >
              <span className={cn("mr-1.5 font-bold", aiTalking ? "text-blush-600" : "text-sage-600")}>
                {aiTalking ? "Dicy" : t.landing.demoYou}
              </span>
              <span className="text-ink">{line.text}</span>
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Call controls, as in the real room */}
        <div aria-hidden className="mt-3.5 flex items-center justify-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-full bg-sage-50 text-sage-700">
            <Mic className="size-4" />
          </span>
          <span className="grid size-10 place-items-center rounded-full bg-mist text-ink-soft">
            <RotateCcw className="size-4" />
          </span>
          <span className="grid h-10 place-items-center rounded-full bg-blush-600 px-5 text-paper">
            <PhoneOff className="size-4" />
          </span>
        </div>
      </div>

      {/* Floating result chips */}
      <motion.div
        aria-hidden
        initial={{ opacity: 0, x: -16, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ duration: 0.6, ease, delay: 0.7 }}
        className="absolute -bottom-10 -left-12 hidden lg:block"
      >
        <div className="motion-loop w-44 animate-float rounded-2xl border border-line bg-paper p-3 shadow-lift">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-ink-soft">{t.landing.demoScore}</span>
            <Sparkles className="size-3.5 text-sage-500" />
          </div>
          <div className="mt-1 text-lg font-extrabold tabular">
            4.5<span className="text-sm font-semibold text-ink-faint">/5</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sage-50">
            <motion.div
              className="h-full origin-left rounded-full bg-sage-500"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 0.9 }}
              transition={{ duration: 1.1, ease, delay: 1 }}
            />
          </div>
        </div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: 16, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease, delay: 0.9 }}
        className="absolute -bottom-6 -right-3 hidden sm:block lg:-right-8"
      >
        <div className="motion-loop flex animate-float items-center gap-2 rounded-full border border-line bg-paper py-2 pl-2 pr-4 text-sm font-semibold shadow-lift [animation-delay:-3s]">
          <span className="grid size-7 place-items-center rounded-full bg-sage-100 text-sage-700">
            <CheckCircle2 className="size-4" />
          </span>
          {t.landing.demoReady}
        </div>
      </motion.div>

      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: -12, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease, delay: 1.1 }}
        className="absolute -right-6 -top-5 hidden lg:block"
      >
        <div className="motion-loop flex animate-float items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-paper shadow-lift [animation-delay:-1.5s]">
          <LockKeyhole className="size-3.5" />
          {t.landing.demoEncrypted}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Ticks like a real call clock (kept in its own component so only this text re-renders). */
function CallTimer() {
  const reduce = useReducedMotion();
  const [s, setS] = useState(252);
  useEffect(() => {
    if (reduce) return;
    const timer = setInterval(() => setS((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, [reduce]);
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return <span className="font-semibold text-blush-600/80 tabular">{`${mm}:${ss}`}</span>;
}

function Tile({ label, sub, active, tone }: { label: string; sub: string; active: boolean; tone: "blush" | "sage" }) {
  return (
    <div
      className={cn(
        "relative grid aspect-[4/3.6] place-items-center rounded-2xl ring-2 transition-[box-shadow,--tw-ring-color] duration-300",
        tone === "blush" ? "bg-blush-50" : "bg-sage-50",
        active ? (tone === "blush" ? "ring-blush-200" : "ring-sage-200") : "ring-transparent",
      )}
    >
      <div className="relative -mt-3 grid place-items-center">
        <motion.span
          aria-hidden
          className={cn("absolute size-20 rounded-full", tone === "blush" ? "bg-blush-200" : "bg-sage-200")}
          animate={active ? { scale: [1, 1.2, 1], opacity: [0.5, 0.9, 0.5] } : { scale: 1, opacity: 0.35 }}
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
      <Wave active={active} tone={tone} />
      <div className="absolute bottom-2.5 left-3 flex items-baseline gap-1.5 text-xs">
        <span className="font-semibold text-ink">{label}</span>
        <span className="text-ink-faint">{sub}</span>
      </div>
    </div>
  );
}

/** Little voice bars under whoever is speaking. */
function Wave({ active, tone }: { active: boolean; tone: "blush" | "sage" }) {
  return (
    <span aria-hidden className="absolute bottom-8 flex h-4 items-center gap-[3px]">
      {[0.1, 0.35, 0, 0.5, 0.2].map((delay, i) => (
        <span
          key={i}
          style={{ animationDelay: `${delay}s` }}
          className={cn(
            "motion-loop h-full w-[3px] origin-center rounded-full transition-opacity duration-300",
            tone === "blush" ? "bg-blush-400" : "bg-sage-500",
            active ? "animate-wave opacity-100" : "scale-y-[0.3] opacity-40",
          )}
        />
      ))}
    </span>
  );
}
