import type { Metadata } from "next";

import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-[1.75rem] font-extrabold">Welcome back</h1>
      <p className="mt-2 mb-8 text-ink-soft">Log in to continue to your interviews.</p>
      <LoginForm next={next} />
    </>
  );
}
