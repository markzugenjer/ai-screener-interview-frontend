import { Building2 } from "lucide-react";
import type { Metadata } from "next";

import { buttonClass } from "@/components/ui";
import { getI18n } from "@/i18n/server";
import { apiServer } from "@/lib/api-server";
import { safeNext } from "@/lib/validation";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.login };
}

async function providers(): Promise<{ jobi: boolean }> {
  try {
    return await apiServer<{ jobi: boolean }>("/api/v1/auth/providers");
  } catch {
    return { jobi: false };
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const [{ next, error }, { t }, { jobi }] = await Promise.all([searchParams, getI18n(), providers()]);
  const errors = t.auth.jobiErrors as Record<string, string>;
  const initialError = error && errors[error] ? errors[error] : undefined;
  const target = safeNext(next, "");
  // A full page navigation: the API redirects to JOBI and back.
  const jobiHref = `/api/v1/auth/jobi/login${target ? `?next=${encodeURIComponent(target)}` : ""}`;
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold">{t.auth.loginTitle}</h1>
      <p className="mt-2 mb-8 text-ink-soft">{t.auth.loginLead}</p>
      {jobi && (
        <>
          <a href={jobiHref} className={buttonClass("secondary", "lg", "w-full")}>
            <Building2 className="size-5" aria-hidden />
            <span>{t.auth.jobiButton}</span>
          </a>
          <p className="mt-2 text-center text-xs text-ink-faint">{t.auth.jobiHint}</p>
          <div className="my-6 flex items-center gap-3 text-xs font-medium text-ink-faint">
            <span className="h-px flex-1 bg-line" />
            {t.auth.orEmail}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <LoginForm next={next} initialError={initialError} />
    </>
  );
}
