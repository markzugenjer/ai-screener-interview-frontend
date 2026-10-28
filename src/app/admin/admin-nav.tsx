"use client";

import { BriefcaseBusiness, LayoutGrid, Users } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { useI18n } from "@/i18n/client";
import { cn } from "@/lib/format";

export function AdminNav() {
  const { t } = useI18n();
  const path = usePathname();
  const items = [
    { href: "/admin", label: t.admin.overview, icon: LayoutGrid, exact: true },
    { href: "/admin/results", label: t.admin.candidates, icon: Users },
    { href: "/admin/jobs", label: t.admin.jobs, icon: BriefcaseBusiness },
  ];
  return (
    <nav aria-label={t.admin.nav} className="isolate flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors lg:rounded-xl",
              active ? "text-sage-700" : "text-ink-soft hover:bg-mist hover:text-ink",
            )}
          >
            {/* The highlight glides between items when you switch sections. */}
            {active && (
              <motion.span
                layoutId="admin-nav-active"
                className="absolute inset-0 -z-10 rounded-full bg-sage-100 lg:rounded-xl"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
