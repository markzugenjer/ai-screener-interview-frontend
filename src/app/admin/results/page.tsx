import type { Metadata } from "next";
import Link from "next/link";

import { DecisionBadge, PageTitle, RecommendationBadge, ScoreBar, StatusBadge } from "@/components/admin-bits";
import { Reveal } from "@/components/motion";
import { Badge, EmptyState, buttonClass } from "@/components/ui";
import { fmt, formatDate } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { apiServer } from "@/lib/api-server";
import type { Job, ResultRow } from "@/lib/types";
import { ResultFilters } from "./filters";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.candidates };
}

const ALLOWED = ["q", "jobId", "status", "recommendation", "decision", "minOverall", "minTechnical", "practice", "sort", "page"];

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const k of ALLOWED) {
    const v = sp[k];
    if (typeof v === "string" && v) qs.set(k, v);
  }
  qs.set("pageSize", "20");
  const page = Math.max(1, Number(sp.page) || 1);

  const [{ t, locale }, { jobs }, data] = await Promise.all([
    getI18n(),
    apiServer<{ jobs: Job[] }>("/api/v1/admin/jobs"),
    apiServer<{ results: ResultRow[]; total: number; pageSize: number }>(`/api/v1/admin/results?${qs.toString()}`),
  ]);
  const a = t.admin;
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pageHref = (p: number) => {
    const n = new URLSearchParams(qs);
    n.delete("pageSize");
    n.set("page", String(p));
    return `/admin/results?${n.toString()}`;
  };

  return (
    <>
      <PageTitle title={a.candidates}>{data.total === 1 ? a.matchesOne : fmt(a.matches, { n: data.total })}</PageTitle>
      <Reveal delay={0.05}>
        <ResultFilters jobs={jobs} />
      </Reveal>

      {data.results.length === 0 ? (
        <Reveal className="mt-6">
          <EmptyState title={a.noMatches}>{a.noMatchesBody}</EmptyState>
        </Reveal>
      ) : (
        <Reveal delay={0.1} className="mt-6 overflow-x-auto rounded-card border border-line bg-paper">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line text-ink-faint">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">{a.colCandidate}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colRole}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colOverall}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colTechnical}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colRecommendation}</th>
                <th scope="col" className="px-3 py-3 font-semibold">{a.colDecision}</th>
                <th scope="col" className="px-5 py-3 font-semibold">{a.colDate}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.results.map((r) => (
                <tr key={r.id} className="relative transition-colors hover:bg-mist">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/results/${r.id}`} className="font-semibold text-ink after:absolute after:inset-0">
                      {r.candidateName}
                    </Link>
                    <p className="text-ink-faint">{r.candidateEmail}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    {r.job?.title}
                    {r.isPractice && <Badge className="ml-2">{a.practice}</Badge>}
                  </td>
                  <td className="px-3 py-3.5">{r.status === "scored" ? <ScoreBar value={r.overall} /> : <StatusBadge value={r.status} t={t} />}</td>
                  <td className="px-3 py-3.5 tabular">{r.technical != null ? `${r.technical.toFixed(1)} / 5` : "—"}</td>
                  <td className="px-3 py-3.5">
                    <RecommendationBadge value={r.recommendation} t={t} />
                  </td>
                  <td className="px-3 py-3.5">
                    <DecisionBadge value={r.decision} t={t} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink-soft">{formatDate(r.createdAt, locale)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      )}

      {pages > 1 && (
        <nav aria-label={a.pagination} className="mt-6 flex items-center justify-between text-sm">
          <span className="text-ink-soft tabular">{fmt(a.page, { page, pages })}</span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonClass("secondary", "sm")}>
                {a.prev}
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className={buttonClass("secondary", "sm")}>
                {a.next}
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
