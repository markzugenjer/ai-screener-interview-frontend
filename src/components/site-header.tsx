import Link from "next/link";

import { getI18n } from "@/i18n/server";
import type { User } from "@/lib/types";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { LogoutButton } from "./logout-button";
import { MobileMenu } from "./mobile-menu";
import { LinkButton } from "./ui";

export async function SiteHeader({ user }: { user: User | null }) {
  const { t } = await getI18n();
  const staff = user?.role === "recruiter" || user?.role === "admin";
  const menuLinks = [
    { href: user ? "/dashboard#jobs" : "/#jobs", label: t.nav.openRoles },
    ...(user && !staff ? [{ href: "/dashboard#interviews", label: t.nav.myInterviews }] : []),
    ...(staff ? [{ href: "/admin", label: t.nav.recruiterArea }] : []),
  ];
  const link = "rounded-full px-3 py-1.5 transition-colors hover:bg-mist hover:text-ink";
  return (
    <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:gap-6 sm:px-6">
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
              <span className="hidden sm:contents">
                <LogoutButton />
              </span>
              <span className="contents sm:hidden">
                <MobileMenu name={user.fullName} email={user.email} links={menuLinks} />
              </span>
            </>
          ) : (
            <>
              <LinkButton href="/login" variant="ghost" size="sm">
                {t.nav.login}
              </LinkButton>
              <LinkButton href="/register" size="sm" aria-label={t.nav.createAccount}>
                <span className="sm:hidden">{t.nav.createAccountShort}</span>
                <span className="hidden sm:inline">{t.nav.createAccount}</span>
              </LinkButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
