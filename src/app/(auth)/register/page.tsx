import type { Metadata } from "next";

import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Create account" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold">Create your account</h1>
      <p className="mt-2 mb-8 text-ink-soft">You&apos;ll use it to start interviews and see your feedback.</p>
      <RegisterForm next={next} />
    </>
  );
}
