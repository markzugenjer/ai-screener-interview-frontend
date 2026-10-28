import Link from "next/link";

import { PageTitle, RecommendationBadge, ScoreBar } from "@/components/admin-bits";
import { EmptyState, LinkButton } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDate } from "@/lib/format";
import type { ResultRow, Stats } from "@/lib/types";

export const metadata = { title: "Overview" };

export default async function AdminOverview() {
  const [{ stats }, { results }] = await Promise.all([
    apiServer<{ stats: Stats }>("/api/v1/admin/stats"),
    apiServer<{ results: ResultRow[] }>("/api/v1/admin/results?status=scored&decision=none&sort=-overall&pageSize=6"),
  ]);

  return (
    <>
      <PageTitle title="Overview">Screened candidates waiting for your decision come first.</PageTitle>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-card bg-sage-100 p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-sage-700">Waiting for review</p>
          <p className="mt-2 text-[2.75rem] font-extrabold leading-none text-sage-700 tabular">{stats.awaitingReview}</p>
        </div>
        <Stat label="Interviews scored" value={stats.interviewsScored} sub={`of ${stats.interviewsTotal} taken`} />
        <Stat label="Average score" value={stats.averageScore} sub="out of 100" />
        <Stat label="Open jobs" value={stats.openJobs} sub={`${stats.candidates} candidates registered`} />
      </div>

      <section className="mt-12">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold">Highest scores to review</h2>
          <Link href="/admin/results?decision=none&status=scored&sort=-overall" className="text-sm font-semibold text-sage-700 hover:underline">
            See all
          </Link>
        </div>
        {results.length === 0 ? (
          <div className="mt-5">
            <EmptyState title="Nothing to review" action={<LinkButton href="/admin/jobs/new" variant="secondary">Post a job</LinkButton>}>
              New results show up here as soon as candidates finish their interviews.
            </EmptyState>
          </div>
        ) : (
          <ul className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-paper">
            {results.map((r) => (
              <li key={r.id}>
                <Link href={`/admin/results/${r.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 hover:bg-mist">
                  <div className="min-w-48 flex-1">
                    <p className="font-semibold">{r.candidateName}</p>
                    <p className="text-sm text-ink-faint">
                      {r.job?.title}, {formatDate(r.createdAt)}
                    </p>
                  </div>
                  <ScoreBar value={r.overall} />
                  <RecommendationBadge value={r.recommendation} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-card border border-line bg-paper p-5">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-2 text-[2rem] font-extrabold leading-none tabular">{value}</p>
      <p className="mt-1.5 text-sm text-ink-faint">{sub}</p>
    </div>
  );
}
