"use client";

import { RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/api-client";
import type { Interview } from "@/lib/types";

/** Re-renders the page every few seconds until the score arrives (stops after 5 minutes). */
export function RefreshWhilePending() {
  const router = useRouter();
  useEffect(() => {
    const started = Date.now();
    const t = setInterval(() => {
      if (Date.now() - started > 5 * 60_000) clearInterval(t);
      else router.refresh();
    }, 4000);
    return () => clearInterval(t);
  }, [router]);
  return null;
}

export function RetakeButton({ slug }: { slug: string }) {
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
            setError(err instanceof Error ? err.message : "Couldn't start a new interview.");
          }
        }}
      >
        {!busy && <RotateCcw className="size-4" aria-hidden />}
        Retake interview
      </Button>
      {error && (
        <div className="mt-2">
          <Alert>{error}</Alert>
        </div>
      )}
    </div>
  );
}
