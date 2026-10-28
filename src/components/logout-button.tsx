"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useI18n } from "@/i18n/client";
import { api } from "@/lib/api-client";
import { Button } from "./ui";

/** Ends the session and returns to the login page. */
export function useLogout() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function logout() {
    setBusy(true);
    await api("POST", "/auth/logout").catch(() => {});
    router.replace("/login");
    router.refresh();
  }
  return { busy, logout };
}

export function LogoutButton() {
  const { t } = useI18n();
  const { busy, logout } = useLogout();
  return (
    <Button variant="ghost" size="sm" loading={busy} onClick={logout}>
      {!busy && <LogOut className="size-4" aria-hidden />}
      {t.nav.logout}
    </Button>
  );
}
