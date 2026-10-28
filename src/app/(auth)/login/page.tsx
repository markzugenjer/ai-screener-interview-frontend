import type { Metadata } from "next";

import { getI18n } from "@/i18n/server";
import { LoginForm } from "./login-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.login };
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t }] = await Promise.all([searchParams, getI18n()]);
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold">{t.auth.loginTitle}</h1>
      <p className="mt-2 mb-8 text-ink-soft">{t.auth.loginLead}</p>
      <LoginForm next={next} />
    </>
  );
}
