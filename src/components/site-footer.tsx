import { ShieldCheck } from "lucide-react";

import { getI18n } from "@/i18n/server";

export async function SiteFooter() {
  const { t } = await getI18n();
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4 shrink-0 text-sage-500" aria-hidden />
          {t.footer.privacy}
        </p>
        <p>
          © {new Date().getFullYear()} {t.footer.rights}
        </p>
      </div>
    </footer>
  );
}
