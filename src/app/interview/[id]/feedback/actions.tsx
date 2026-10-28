"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import type { Interview } from "@/lib/types";

/** Re-renders the page every few seconds until the score arrives (stops after 5 minutes). */
export function RefreshWhilePending() {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - started > 5 * 60_000) clearInterval(timer);
      else router.refresh();
    }, 4000);
    return () => clearInterval(timer);
  }, [router]);
  return null;
}

export function RetakeButton({ slug }: { slug: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div>
      <Button
        size="lg"
        className="w-full"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            const { interview } = await api<{ interview: Interview }>("POST", `/jobs/${slug}/interviews`);
            router.push(`/interview/${interview.id}`);
          } catch (err) {
            setBusy(false);
            setError(errorMessage(err, t, t.feedback.retakeError));
          }
        }}
      >
        {!busy && <RotateCcw className="size-4" aria-hidden />}
        {t.feedback.retake}
      </Button>
      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
