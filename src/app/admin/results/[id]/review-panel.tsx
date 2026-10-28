"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button, Textarea } from "@/components/ui";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/format";
import type { Decision } from "@/lib/types";

const options: { value: Decision; label: string; tone: string }[] = [
  { value: "shortlist", label: "Shortlist", tone: "peer-checked:border-sage-500 peer-checked:bg-sage-50 peer-checked:text-sage-700" },
  { value: "hold", label: "Hold", tone: "peer-checked:border-amber peer-checked:bg-amber-soft peer-checked:text-amber" },
  { value: "reject", label: "Reject", tone: "peer-checked:border-blush-600 peer-checked:bg-blush-50 peer-checked:text-blush-700" },
];

export function ReviewPanel({ interviewId, current }: { interviewId: string; current: Decision | "" }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision | "">(current);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ tone: "sage" | "danger"; text: string } | null>(null);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!decision) {
          setMsg({ tone: "danger", text: "Choose shortlist, hold or reject." });
          return;
        }
        setBusy(true);
        setMsg(null);
        try {
          await api("POST", `/admin/results/${interviewId}/review`, { decision, notes });
          setNotes("");
          setMsg({ tone: "sage", text: "Decision saved." });
          router.refresh();
        } catch (err) {
          setMsg({ tone: "danger", text: err instanceof Error ? err.message : "Couldn't save the decision." });
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Your decision</legend>
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
                  "flex h-10 items-center justify-center rounded-full border border-line text-sm font-semibold text-ink-soft transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sage-500",
                  o.tone,
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
          Notes for the team
        </label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} placeholder="e.g. Strong React basics. Invite to the HR interview." />
      </div>
      {msg && <Alert tone={msg.tone}>{msg.text}</Alert>}
      <Button type="submit" className="w-full" loading={busy}>
        Save decision
      </Button>
    </form>
  );
}

export function RescoreButton({ interviewId }: { interviewId: string }) {
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
            setError(err instanceof Error ? err.message : "Couldn't queue scoring.");
          } finally {
            setBusy(false);
          }
        }}
      >
        Score again
      </Button>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
