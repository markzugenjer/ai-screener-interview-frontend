import Link from "next/link";

import { DecisionBadge, PageTitle, RecommendationBadge, ScoreBar, StatusBadge } from "@/components/admin-bits";
import { Badge, EmptyState } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { buttonClass } from "@/components/ui";
import { formatDate } from "@/lib/format";
import type { Job, ResultRow } from "@/lib/types";
import { ResultFilters } from "./filters";

export const metadata = { title: "Candidates" };

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

  const [{ jobs }, data] = await Promise.all([
    apiServer<{ jobs: Job[] }>("/api/v1/admin/jobs"),
    apiServer<{ results: ResultRow[]; total: number; pageSize: number }>(`/api/v1/admin/results?${qs.toString()}`),
  ]);
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  const pageHref = (p: number) => {
    const n = new URLSearchParams(qs);
    n.delete("pageSize");
    n.set("page", String(p));
    return `/admin/results?${n.toString()}`;
  };

  return (
    <>
      <PageTitle title="Candidates">
        {data.total} {data.total === 1 ? "interview matches" : "interviews match"} your filters.
      </PageTitle>
      <ResultFilters jobs={jobs} />

      {data.results.length === 0 ? (
        <div className="mt-6">
          <EmptyState title="No interviews match these filters">Try lowering the minimum score or clearing a filter.</EmptyState>
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-card border border-line bg-paper">
          <table className="w-full min-w-[52rem] text-left text-sm">
            <thead className="border-b border-line text-ink-faint">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Candidate</th>
                <th scope="col" className="px-3 py-3 font-semibold">Role</th>
                <th scope="col" className="px-3 py-3 font-semibold">Overall</th>
                <th scope="col" className="px-3 py-3 font-semibold">Technical</th>
                <th scope="col" className="px-3 py-3 font-semibold">AI recommendation</th>
                <th scope="col" className="px-3 py-3 font-semibold">Decision</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.results.map((r) => (
                <tr key={r.id} className="group relative hover:bg-mist">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/results/${r.id}`} className="font-semibold text-ink after:absolute after:inset-0">
                      {r.candidateName}
                    </Link>
                    <p className="text-ink-faint">{r.candidateEmail}</p>
                  </td>
                  <td className="px-3 py-3.5">
                    {r.job?.title}
                    {r.isPractice && <Badge className="ml-2">Practice</Badge>}
                  </td>
                  <td className="px-3 py-3.5">{r.status === "scored" ? <ScoreBar value={r.overall} /> : <StatusBadge value={r.status} />}</td>
                  <td className="px-3 py-3.5 tabular">{r.technical != null ? `${r.technical.toFixed(1)} / 5` : "—"}</td>
                  <td className="px-3 py-3.5">
                    <RecommendationBadge value={r.recommendation} />
                  </td>
                  <td className="px-3 py-3.5">
                    <DecisionBadge value={r.decision} />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5 text-ink-soft">{formatDate(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav aria-label="Pagination" className="mt-6 flex items-center justify-between text-sm">
          <span className="text-ink-soft tabular">
            Page {page} of {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link href={pageHref(page - 1)} className={buttonClass("secondary", "sm")}>
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={pageHref(page + 1)} className={buttonClass("secondary", "sm")}>
                Next
              </Link>
            )}
          </div>
        </nav>
      )}
    </>
  );
}
