"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordInput } from "@/components/password-input";
import { Alert, Button, Field, Input } from "@/components/ui";
import { api } from "@/lib/api-client";
import type { User } from "@/lib/types";
import { safeNext } from "@/lib/validation";

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    setBusy(true);
    try {
      const { user } = await api<{ user: User }>("POST", "/auth/login", { email, password });
      const staff = user.role === "recruiter" || user.role === "admin";
      router.replace(safeNext(next, staff ? "/admin" : "/dashboard"));
      router.refresh();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Couldn't log in. Try again.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {error && <Alert>{error}</Alert>}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Password" htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Log in
      </Button>
      <p className="text-center text-sm text-ink-soft">
        New here?{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-sage-700 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
