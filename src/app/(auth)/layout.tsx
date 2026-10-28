import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Reveal } from "@/components/motion";
import { getI18n } from "@/i18n/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="grid min-h-dvh bg-mist lg:grid-cols-[1fr_minmax(0,34rem)]">
      <aside className="relative hidden overflow-hidden bg-sage-100 p-12 lg:flex lg:flex-col">
        <Brand />
        <Reveal className="relative z-10 mt-auto max-w-md" delay={0.1}>
          <p className="text-[2rem] font-extrabold leading-tight text-sage-700">{t.auth.sideTitle}</p>
          <p className="mt-4 leading-relaxed text-sage-700/80">{t.auth.sideBody}</p>
        </Reveal>
        <span aria-hidden className="absolute -right-24 -top-24 size-80 animate-breathe rounded-full bg-blush-100" />
        <span aria-hidden className="absolute -right-6 top-40 size-24 rounded-full bg-blush-200/70" />
      </aside>
      <main className="relative flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute right-4 top-4 sm:right-6">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
