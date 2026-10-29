import type { Metadata } from "next";
import Link from "next/link";

import { OpenAccessBanner, PageTitle } from "@/components/admin-bits";
import { Reveal } from "@/components/motion";
import { Badge, EmptyState, buttonClass } from "@/components/ui";
import { fmt, formatDate } from "@/i18n/format";
import { getI18n, getLocale } from "@/i18n/server";
import { apiServer, requireAdmin } from "@/lib/api-server";
import type { Role } from "@/lib/types";
import { RoleSelect } from "./role-select";
import { TeamFilters } from "./team-filters";

type Member = { id: string; fullName: string; email: string; role: Role; viaJobi: boolean; createdAt: string; lastLoginAt?: string | null };
type TeamResponse = {
  users: Member[];
  total: number;
  page: number;
  pageSize: number;
  counts: Record<Role, number>;
  openRecruiterAccess: boolean;
  me: string;
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.admin.team };
}

export default async function TeamPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  await requireAdmin("/admin/team");
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const k of ["q", "role", "page"]) {
    const v = sp[k];
    if (typeof v === "string" && v) qs.set(k, v);
  }
  const [{ t }, locale, data] = await Promise.all([getI18n(), getLocale(), apiServer<TeamResponse>(`/api/v1/admin/users?${qs.toString()}`)]);
  const a = t.admin;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pageHref = (p: number) => {
    const n = new URLSearchParams(qs);
    n.set("page", String(p));
    return `/admin/team?${n.toString()}`;
  };

  return (
    <>
      <PageTitle title={a.team}>
        {a.teamLead}{" "}
        <span className="tabular text-ink-faint">
          {fmt(a.roleCounts, { admins: data.counts.admin ?? 0, recruiters: data.counts.recruiter ?? 0, candidates: data.counts.candidate ?? 0 })}
        </span>
      </PageTitle>

      {data.openRecruiterAccess && <OpenAccessBanner t={t} />}

      <Reveal delay={0.05}>
        <TeamFilters />
      </Reveal>

      {data.users.length === 0 ? (
        <Reveal className="mt-6">
          <EmptyState title={a.noPeople}>{a.noPeopleBody}</EmptyState>
        </Reveal>
      ) : (
        <Reveal delay={0.1} className="mt-6 overflow-x-auto rounded-card border border-line bg-paper">
          <table className="w-full min-w-[44rem] text-left text-sm">
            <thead className="border-b border-line text-ink-faint">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">{a.colPerson}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colSignIn}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colAccess}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{a.colLastLogin}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.users.map((u) => {
                const isMe = u.id === data.me;
                return (
                  <tr key={u.id} className="transition-colors hover:bg-mist">
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-ink">
                        {u.fullName}
                        {isMe && <Badge tone="sage" className="ml-2">{a.you}</Badge>}
                      </p>
                      {u.email && <p className="text-ink-faint">{u.email}</p>}
                    </td>
                    <td className="px-3 py-3.5">
                      <Badge tone={u.viaJobi ? "blush" : "neutral"}>{u.viaJobi ? a.viaJobi : a.viaEmail}</Badge>
                    </td>
                    <td className="px-3 py-3.5">
                      <RoleSelect key={`${u.id}-${u.role}`} userId={u.id} name={u.fullName} role={u.role} disabled={isMe} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3.5 text-ink-soft">{u.lastLoginAt ? formatDate(u.lastLoginAt, locale) : a.never}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Reveal>
      )}

      {pages > 1 && (
        <nav aria-label={a.pagination} className="mt-6 flex items-center justify-between text-sm">
          <span className="text-ink-soft tabular">{fmt(a.page, { page: data.page, pages })}</span>
          <div className="flex gap-2">
            {data.page > 1 && (
              <Link href={pageHref(data.page - 1)} className={buttonClass("secondary", "sm")}>
                {a.prev}
              </Link>
            )}
            {data.page < pages && (
              <Link href={pageHref(data.page + 1)} className={buttonClass("secondary", "sm")}>
                {a.next}
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
