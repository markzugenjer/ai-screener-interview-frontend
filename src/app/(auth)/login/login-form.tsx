"use client";

import { AnimatePresence, motion, useAnimate } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { PasswordInput } from "@/components/password-input";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import type { User } from "@/lib/types";
import { safeNext } from "@/lib/validation";

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [scope, animate] = useAnimate<HTMLFormElement>();
  // Shake the form on an error, without remounting it (typed values are kept).
  const shake = () => void animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");
    if (!email || !password) {
      setError(t.auth.enterBoth);
      shake();
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
      setError(errorMessage(err, t));
      shake();
    }
  }

  return (
    <form
      ref={scope}
      onSubmit={onSubmit}
      noValidate
      className="space-y-5"
    >
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
            <Alert>{error}</Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <Field label={t.auth.email} htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label={t.auth.password} htmlFor="password">
        <PasswordInput id="password" name="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" size="lg" className="w-full" loading={busy}>
        {t.auth.submitLogin}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        {t.auth.noAccount}{" "}
        <Link href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"} className="font-semibold text-sage-700 underline-offset-4 underline decoration-transparent hover:decoration-current">
          {t.auth.toRegister}
        </Link>
      </p>
    </form>
  );
}
