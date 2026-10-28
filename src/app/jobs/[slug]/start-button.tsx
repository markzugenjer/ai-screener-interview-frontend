"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button } from "@/components/ui";
import { api } from "@/lib/api-client";
import type { Interview } from "@/lib/types";

export function StartInterviewButton({ slug, label }: { slug: string; label: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="space-y-3">
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
            setError(err instanceof Error ? err.message : "Couldn't start the interview.");
          }
        }}
      >
        {!busy && <Mic className="size-4" aria-hidden />}
        {label}
      </Button>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
