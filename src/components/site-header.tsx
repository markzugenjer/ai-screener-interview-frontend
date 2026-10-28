import Link from "next/link";

import { getI18n } from "@/i18n/server";
import type { User } from "@/lib/types";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutButton } from "./logout-button";
import { LinkButton } from "./ui";

export async function SiteHeader({ user }: { user: User | null }) {
  const { t } = await getI18n();
  const staff = user?.role === "recruiter" || user?.role === "admin";
  const link = "rounded-full px-3 py-1.5 transition-colors hover:bg-mist hover:text-ink";
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Brand href={user ? "/dashboard" : "/"} />
        <nav aria-label={t.nav.main} className="hidden items-center gap-1 text-sm font-medium text-ink-soft sm:flex">
          <Link href={user ? "/dashboard#jobs" : "/#jobs"} className={link}>
            {t.nav.openRoles}
          </Link>
          {user && !staff && (
            <Link href="/dashboard#interviews" className={link}>
              {t.nav.myInterviews}
            </Link>
          )}
          {staff && (
            <Link href="/admin" className={link}>
              {t.nav.recruiterArea}
            </Link>
          )}
        </nav>
        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <span className="hidden text-sm text-ink-soft md:inline">{user.fullName}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm" className="hidden sm:inline-flex">
                {t.nav.login}
              </LinkButton>
              <LinkButton href="/register" size="sm">
                {t.nav.createAccount}
              </LinkButton>
            </>
          )}
        </div>
      </div>
      {staff && (
        <div className="border-t border-line/70 sm:hidden">
          <Link href="/admin" className="block px-4 py-2 text-sm font-medium text-sage-700">
            {t.nav.recruiterArea}
          </Link>
        </div>
      )}
    </header>
  );
}
