"use client";

import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Textarea } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/format";
import type { Decision } from "@/lib/types";

const tones: Record<Decision, string> = {
  shortlist: "peer-checked:border-sage-500 peer-checked:bg-sage-50 peer-checked:text-sage-700",
  hold: "peer-checked:border-amber peer-checked:bg-amber-soft peer-checked:text-amber",
  reject: "peer-checked:border-blush-600 peer-checked:bg-blush-50 peer-checked:text-blush-700",
};

export function ReviewPanel({ interviewId, current }: { interviewId: string; current: Decision | "" }) {
  const { t } = useI18n();
  const a = t.admin;
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | "">(current);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "sage" | "danger"; text: string } | null>(null);
  const options: { value: Decision; label: string }[] = [
    { value: "shortlist", label: a.shortlist },
    { value: "hold", label: a.hold },
    { value: "reject", label: a.reject },
  ];

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!decision) {
          setMsg({ tone: "danger", text: a.chooseDecision });
          return;
        }
        setBusy(true);
        setMsg(null);
        try {
          await api("POST", `/admin/results/${interviewId}/review`, { decision, notes });
          setNotes("");
          setMsg({ tone: "sage", text: a.decisionSaved });
          router.refresh();
        } catch (err) {
          setMsg({ tone: "danger", text: errorMessage(err, t, a.decisionError) });
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">{a.yourDecision}</legend>
        <div className="grid grid-cols-3 gap-2">
          {options.map((o) => (
            <label key={o.value} className="cursor-pointer">
              <input
                type="radio"
                name="decision"
                value={o.value}
                checked={decision === o.value}
                onChange={() => setDecision(o.value)}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-10 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink-soft transition-[background-color,border-color,color,transform] active:scale-95 peer-focus-visible:ring-2 peer-focus-visible:ring-sage-500",
                  tones[o.value],
                )}
              >
                {o.label}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="notes" className="mb-1.5 block text-sm font-semibold">
          {a.notes}
        </label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder={a.notesPlaceholder} />
      </div>
      <AnimatePresence>
        {msg && (
          <motion.div key={msg.text} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert tone={msg.tone}>{msg.text}</Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <Button type="submit" className="w-full" loading={busy}>
        {a.saveDecision}
      </Button>
    </form>
  );
}

export function RescoreButton({ interviewId }: { interviewId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-2">
      <Button
        variant="secondary"
        size="sm"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api("POST", `/admin/results/${interviewId}/rescore`);
            router.refresh();
          } catch (err) {
            setError(errorMessage(err, t, t.admin.scoreAgainError));
          } finally {
            setBusy(false);
          }
        }}
      >
        {t.admin.scoreAgain}
      </Button>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
