"use client";

import { FileText, Upload, X } from "lucide-react";
import { AnimatePresence, motion, useAnimate } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { PasswordInput } from "@/components/password-input";
import { Alert, Button, Field, Input } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { ClientApiError, api } from "@/lib/api-client";
import { errorMessage, localizeFields } from "@/lib/errors";
import { cn } from "@/lib/format";
import { MAX_RESUME_MB, registerSchema, safeNext, zodFieldErrors, type FieldErrors } from "@/lib/validation";

export function RegisterForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const schema = useMemo(() => registerSchema(t), [t]);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [scope, animate] = useAnimate<HTMLFormElement>();
  const shake = () => void animate(scope.current, { x: [0, -8, 8, -5, 5, 0] }, { duration: 0.4 });

  function pickFile(f: File | undefined) {
    if (!f) return;
    setResume(f);
    setErrors((e) => ({ ...e, resume: undefined }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError("");
    const fd = new FormData(e.currentTarget);
    const values = {
      fullName: String(fd.get("fullName") ?? ""),
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      confirmPassword: String(fd.get("confirmPassword") ?? ""),
      whatsapp: String(fd.get("whatsapp") ?? ""),
      resume: resume ?? undefined,
    };
    const parsed = schema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
      shake();
      return;
    }
    setErrors({});
    setBusy(true);
    const body = new FormData();
    for (const [k, v] of Object.entries(values)) if (k !== "resume") body.set(k, v as string);
    body.set("resume", resume!);
    try {
      await api("POST", "/auth/register", body);
      router.replace(safeNext(next));
      router.refresh();
    } catch (err) {
      setBusy(false);
      shake();
      if (err instanceof ClientApiError && Object.keys(err.fields).length > 0) setErrors(localizeFields(err.fields, t));
      else setFormError(errorMessage(err, t));
    }
  }

  const describe = (name: string) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form ref={scope} onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}
      <Field label={t.auth.fullName} htmlFor="fullName" error={errors.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required invalid={!!errors.fullName} aria-describedby={describe("fullName")} />
      </Field>
      <Field label={t.auth.email} htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!errors.email} aria-describedby={describe("email")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label={t.auth.password} htmlFor="password" error={errors.password} hint={t.auth.passwordHint}>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="new-password"
            required
            invalid={!!errors.password}
            aria-describedby={describe("password") ?? "password-hint"}
          />
        </Field>
        <Field label={t.auth.confirmPassword} htmlFor="confirmPassword" error={errors.confirmPassword}>
          <PasswordInput
            id="confirmPassword"
            name="confirmPassword"
            autoComplete="new-password"
            required
            invalid={!!errors.confirmPassword}
            aria-describedby={describe("confirmPassword")}
          />
        </Field>
      </div>
      <Field label={t.auth.whatsapp} htmlFor="whatsapp" error={errors.whatsapp} hint={t.auth.whatsappHint}>
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder={t.auth.whatsappPlaceholder}
          required
          invalid={!!errors.whatsapp}
          aria-describedby={describe("whatsapp") ?? "whatsapp-hint"}
        />
      </Field>

      <Field label={t.auth.resume} htmlFor="resume" error={errors.resume} hint={fmt(t.auth.resumeHint, { mb: MAX_RESUME_MB })}>
        <input
          ref={fileRef}
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="sr-only"
          onChange={(e) => pickFile(e.target.files?.[0])}
          aria-describedby={describe("resume") ?? "resume-hint"}
        />
        <AnimatePresence mode="wait" initial={false}>
          {resume ? (
            <motion.div
              key="file"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.18 }}
              className="flex items-center gap-3 rounded-field border border-sage-200 bg-sage-50 px-3.5 py-3"
            >
              <FileText className="size-5 shrink-0 text-sage-600" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{resume.name}</p>
                <p className="text-xs text-ink-faint tabular">{(resume.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setResume(null);
                  if (fileRef.current) fileRef.current.value = "";
                }}
                className="grid size-8 place-items-center rounded-full text-ink-faint hover:bg-paper hover:text-ink"
                aria-label={t.auth.resumeRemove}
              >
                <X className="size-4" aria-hidden />
              </button>
            </motion.div>
          ) : (
            <motion.label
              key="drop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              htmlFor="resume"
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pickFile(e.dataTransfer.files[0]);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1.5 rounded-field border border-dashed px-4 py-6 text-center transition-colors",
                dragging ? "border-sage-500 bg-sage-50" : errors.resume ? "border-danger" : "border-line bg-paper hover:border-sage-200",
              )}
            >
              <Upload className={cn("size-5 text-sage-600 transition-transform", dragging && "-translate-y-1")} aria-hidden />
              <span className="text-sm font-semibold">{t.auth.resumeDrop}</span>
            </motion.label>
          )}
        </AnimatePresence>
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        {t.auth.submitRegister}
      </Button>
      <p className="text-center text-sm text-ink-soft">
        {t.auth.haveAccount}{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-sage-700 underline-offset-4 underline decoration-transparent hover:decoration-current">
          {t.auth.toLogin}
        </Link>
      </p>
    </form>
  );
}
