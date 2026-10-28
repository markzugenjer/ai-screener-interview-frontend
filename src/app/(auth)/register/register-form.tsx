"use client";

import { FileText, Upload, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { PasswordInput } from "@/components/password-input";
import { Alert, Button, Field, Input } from "@/components/ui";
import { ClientApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/format";
import { MAX_RESUME_MB, registerSchema, safeNext, zodFieldErrors, type FieldErrors } from "@/lib/validation";

export function RegisterForm({ next }: { next?: string }) {
  const router = useRouter();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(zodFieldErrors(parsed.error));
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
      if (err instanceof ClientApiError && Object.keys(err.fields).length > 0) setErrors(err.fields);
      else setFormError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    }
  }

  const describe = (name: string) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError && <Alert>{formError}</Alert>}
      <Field label="Full name" htmlFor="fullName" error={errors.fullName}>
        <Input id="fullName" name="fullName" autoComplete="name" required invalid={!!errors.fullName} aria-describedby={describe("fullName")} />
      </Field>
      <Field label="Email" htmlFor="email" error={errors.email}>
        <Input id="email" name="email" type="email" autoComplete="email" required invalid={!!errors.email} aria-describedby={describe("email")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Password" htmlFor="password" error={errors.password} hint="8+ characters, with a letter and a number.">
          <PasswordInput id="password" name="password" autoComplete="new-password" required invalid={!!errors.password} aria-describedby={describe("password") ?? "password-hint"} />
        </Field>
        <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword}>
          <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" required invalid={!!errors.confirmPassword} aria-describedby={describe("confirmPassword")} />
        </Field>
      </div>
      <Field label="WhatsApp number" htmlFor="whatsapp" error={errors.whatsapp} hint="Recruiters use this to contact you about next steps.">
        <Input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="0812 3456 7890"
          required
          invalid={!!errors.whatsapp}
          aria-describedby={describe("whatsapp") ?? "whatsapp-hint"}
        />
      </Field>

      <Field label="Resume" htmlFor="resume" error={errors.resume} hint={`PDF or DOCX, up to ${MAX_RESUME_MB} MB.`}>
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
        {resume ? (
          <div className="flex items-center gap-3 rounded-field border border-sage-200 bg-sage-50 px-3.5 py-3">
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
              aria-label="Remove resume"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ) : (
          <label
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
            <Upload className="size-5 text-sage-600" aria-hidden />
            <span className="text-sm font-semibold">Choose a file or drop it here</span>
          </label>
        )}
      </Field>

      <Button type="submit" size="lg" className="w-full" loading={busy}>
        Create account
      </Button>
      <p className="text-center text-sm text-ink-soft">
        Already have an account?{" "}
        <Link href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"} className="font-semibold text-sage-700 underline-offset-4 hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
