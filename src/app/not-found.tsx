import { Brand } from "@/components/brand";
import { Reveal } from "@/components/motion";
import { LinkButton } from "@/components/ui";
import { getI18n } from "@/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <main className="grid min-h-dvh place-items-center bg-mist px-4">
      <Reveal className="max-w-md text-center">
        <Brand />
        <h1 className="mt-8 text-[2rem] font-extrabold">{t.errors.notFoundTitle}</h1>
        <p className="mt-2 text-ink-soft">{t.errors.notFoundBody}</p>
        <LinkButton href="/dashboard" className="mt-8">
          {t.errors.notFoundCta}
        </LinkButton>
      </Reveal>
    </main>
  );
}
