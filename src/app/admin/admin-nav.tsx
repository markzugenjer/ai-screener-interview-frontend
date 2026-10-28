"use client";

import { BriefcaseBusiness, LayoutGrid, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/format";

const items = [
  { href: "/admin", label: "Overview", icon: LayoutGrid, exact: true },
  { href: "/admin/results", label: "Candidates", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: BriefcaseBusiness },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Recruiter" className="flex gap-1 overflow-x-auto lg:flex-col">
      {items.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? path === href : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2.5 rounded-full px-4 py-2 text-sm font-semibold transition-colors lg:rounded-xl",
              active ? "bg-sage-100 text-sage-700" : "text-ink-soft hover:bg-mist hover:text-ink",
            )}
          >
            <Icon className="size-4" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
