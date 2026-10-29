"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Select } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import { api } from "@/lib/api-client";
import type { Role } from "@/lib/types";

const ROLES: Role[] = ["candidate", "recruiter", "admin"];

/** Role picker for one person. Every change is confirmed first, because it grants or removes access to candidates' data. */
export function RoleSelect({ userId, name, role, disabled }: { userId: string; name: string; role: Role; disabled?: boolean }) {
  const { t } = useI18n();
  const a = t.admin;
  const router = useRouter();
  const [pending, setPending] = useState<Role | null>(null);
  const label = (r: Role) => (r === "admin" ? a.roleAdmin : r === "recruiter" ? a.roleRecruiter : a.roleCandidate);
  const effect = (r: Role) => (r === "admin" ? a.effectAdmin : r === "recruiter" ? a.effectRecruiter : a.effectCandidate);

  return (
    <>
      <Select
        value={role}
        disabled={disabled}
        aria-label={fmt(a.roleChangeTitle, { name })}
        className="h-10 w-36 py-0 text-sm"
        onChange={(e) => {
          const next = e.target.value as Role;
          if (next !== role) setPending(next);
        }}
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {label(r)}
          </option>
        ))}
      </Select>
      <ConfirmDialog
        open={pending !== null}
        title={fmt(a.roleChangeTitle, { name })}
        confirmLabel={a.roleChangeConfirm}
        tone={pending === "candidate" ? "danger" : "primary"}
        onClose={() => setPending(null)}
        onConfirm={async () => {
          if (!pending) return;
          await api("PUT", `/admin/users/${userId}/role`, { role: pending });
          router.refresh();
        }}
      >
        {pending && fmt(a.roleChangeBody, { name, role: label(pending), effect: effect(pending) })}
      </ConfirmDialog>
    </>
  );
}
