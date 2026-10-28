import { Brand } from "@/components/brand";
import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4">
      <div className="max-w-md text-center">
        <Brand />
        <h1 className="mt-8 text-[2rem] font-extrabold">This page doesn&apos;t exist</h1>
        <p className="mt-2 text-ink-soft">The link may be old, or the interview belongs to another account.</p>
        <LinkButton href="/dashboard" className="mt-8">
          Go to your dashboard
        </LinkButton>
      </div>
    </main>
  );
}
