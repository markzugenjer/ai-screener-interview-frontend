import type { Metadata } from "next";

import { getI18n } from "@/i18n/server";
import { RegisterForm } from "./register-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.register };
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, { t }] = await Promise.all([searchParams, getI18n()]);
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold">{t.auth.registerTitle}</h1>
      <p className="mt-2 mb-8 text-ink-soft">{t.auth.registerLead}</p>
      <RegisterForm next={next} />
    </>
  );
}
