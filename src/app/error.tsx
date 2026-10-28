"use client";

import { Brand } from "@/components/brand";
import { Button, LinkButton } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="max-w-md text-center">
        <Brand />
        <h1 className="mt-8 text-[2rem] font-extrabold">This page didn&apos;t load</h1>
        <p className="mt-2 text-ink-soft">The server may be busy. Try again, or come back in a minute.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Button onClick={reset}>Try again</Button>
          <LinkButton href="/" variant="secondary">
            Home
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
