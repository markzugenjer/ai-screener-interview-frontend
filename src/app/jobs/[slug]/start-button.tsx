"use client";

import { Mic } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Alert, Button } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import type { Interview } from "@/lib/types";

export function StartInterviewButton({ slug, practice }: { slug: string; practice: boolean }) {
  const { t } = useI18n();
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
            setError(errorMessage(err, t, t.job.startError));
          }
        }}
      >
        {!busy && <Mic className="size-4" aria-hidden />}
        {practice ? t.job.startPractice : t.job.start}
      </Button>
      {error && <Alert>{error}</Alert>}
    </div>
  );
}
