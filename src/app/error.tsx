"use client";

import { Brand } from "@/components/brand";
import { Button, LinkButton } from "@/components/ui";
import { useI18n } from "@/i18n/client";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = useI18n();
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="max-w-md text-center">
        <Brand />
        <h1 className="mt-8 text-[2rem] font-extrabold">{t.errors.errorTitle}</h1>
        <p className="mt-2 text-ink-soft">{t.errors.errorBody}</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>{t.common.tryAgain}</Button>
          <LinkButton href="/" variant="secondary">
            {t.common.home}
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
