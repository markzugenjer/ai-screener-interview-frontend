"use client";

import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Input, Select } from "@/components/ui";
import { useI18n } from "@/i18n/client";

/** Search and role filter. Both live in the URL, like the candidate filters. */
export function TeamFilters() {
  const { t } = useI18n();
  const a = t.admin;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(form: HTMLFormElement) {
    const qs = new URLSearchParams();
    for (const [k, v] of new FormData(form).entries()) {
      const s = String(v).trim();
      if (s) qs.set(k, s);
    }
    startTransition(() => router.replace(`${pathname}?${qs.toString()}`, { scroll: false }));
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") apply(e.currentTarget);
      }}
      className="grid gap-3 rounded-card border border-line bg-mist p-4 sm:grid-cols-[1fr_12rem]"
      aria-busy={pending}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
        <Input name="q" type="search" defaultValue={params.get("q") ?? ""} placeholder={a.teamSearch} aria-label={a.teamSearch} className="pl-10" />
      </div>
      <Select name="role" defaultValue={params.get("role") ?? ""} aria-label={a.colAccess}>
        <option value="">{a.allRoles}</option>
        <option value="admin">{a.roleAdmin}</option>
        <option value="recruiter">{a.roleRecruiter}</option>
        <option value="candidate">{a.roleCandidate}</option>
      </Select>
    </form>
  );
}
