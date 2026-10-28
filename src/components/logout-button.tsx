"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { api } from "@/lib/api-client";
import { Button } from "./ui";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="ghost"
      size="sm"
      loading={busy}
      onClick={async () => {
        setBusy(true);
        await api("POST", "/auth/logout").catch(() => {});
        router.replace("/login");
        router.refresh();
      }}
    >
      {!busy && <LogOut className="size-4" aria-hidden />}
      Log out
    </Button>
  );
}
