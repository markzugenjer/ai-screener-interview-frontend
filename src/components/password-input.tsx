"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState, type ComponentProps } from "react";

import { useI18n } from "@/i18n/client";
import { Input } from "./ui";

export function PasswordInput(props: ComponentProps<typeof Input>) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input {...props} type={show ? "text" : "password"} className="pr-11" />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-field text-ink-faint hover:text-ink"
        aria-label={show ? t.auth.hidePassword : t.auth.showPassword}
      >
        {show ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
      </button>
    </div>
  );
}
