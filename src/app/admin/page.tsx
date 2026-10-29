import type { Metadata } from "next";
import Link from "next/link";

import { OpenAccessBanner, PageTitle, RecommendationBadge, ScoreBar } from "@/components/admin-bits";
import { CountUp, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { EmptyState, LinkButton } from "@/components/ui";
import { fmt, formatDate } from "@/i18n/format";
import { getI18n, getLocale } from "@/i18n/server";
import { apiServer, currentUser } from "@/lib/api-server";
import type { ResultRow, Stats } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.overview };
}

export default async function AdminOverview() {
  const locale = await getLocale();
  const [{ t }, { stats, openRecruiterAccess }, { results }, me] = await Promise.all([
    getI18n(),
    apiServer<{ stats: Stats; openRecruiterAccess?: boolean }>("/api/v1/admin/stats"),
    apiServer<{ results: ResultRow[] }>(`/api/v1/admin/results?status=scored&decision=none&sort=-overall&pageSize=6&lang=${locale}`),
    currentUser(),
  ]);

  return (
    <>
      <PageTitle title={t.admin.overview}>{t.admin.overviewLead}</PageTitle>
      {openRecruiterAccess && <OpenAccessBanner t={t} showTeamLink={me?.role === "admin"} />}

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem className="rounded-card bg-sage-100 p-5 sm:col-span-2 xl:col-span-1">
          <p className="text-sm font-semibold text-sage-700">{t.admin.waiting}</p>
          <p className="mt-2 text-[2.75rem] font-extrabold leading-none text-sage-700">
            <CountUp value={stats.awaitingReview} />
          </p>
        </StaggerItem>
        <Stat label={t.admin.scored} value={stats.interviewsScored} sub={fmt(t.admin.scoredOf, { n: stats.interviewsTotal })} />
        <Stat label={t.admin.average} value={stats.averageScore} sub={t.admin.outOf100} />
        <Stat label={t.admin.openJobs} value={stats.openJobs} sub={fmt(t.admin.registered, { n: stats.candidates })} />
      </Stagger>

      <section className="mt-12">
        <Reveal className="flex items-end justify-between gap-4">
          <h2 className="text-xl font-bold">{t.admin.topToReview}</h2>
          <Link href="/admin/results?decision=none&status=scored&sort=-overall" className="text-sm font-semibold text-sage-700 underline decoration-transparent hover:decoration-current">
            {t.admin.seeAll}
          </Link>
        </Reveal>
        {results.length === 0 ? (
          <Reveal className="mt-5">
            <EmptyState
              title={t.admin.nothingToReview}
              action={
                <LinkButton href="/admin/jobs/new" variant="secondary">
                  {t.admin.postJob}
                </LinkButton>
              }
            >
              {t.admin.nothingBody}
            </EmptyState>
          </Reveal>
        ) : (
          <Stagger as="ul" className="mt-5 divide-y divide-line overflow-hidden rounded-card border border-line bg-paper">
            {results.map((r) => (
              <StaggerItem as="li" key={r.id}>
                <Link href={`/admin/results/${r.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-mist">
                  <div className="min-w-48 flex-1">
                    <p className="font-semibold">{r.candidateName}</p>
                    <p className="text-sm text-ink-faint">
                      {r.job?.title}, {formatDate(r.createdAt, locale)}
                    </p>
                  </div>
                  <ScoreBar value={r.overall} />
                  <RecommendationBadge value={r.recommendation} t={t} />
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <StaggerItem className="rounded-card border border-line bg-paper p-5">
      <p className="text-sm font-semibold text-ink-soft">{label}</p>
      <p className="mt-2 text-[2rem] font-extrabold leading-none">
        <CountUp value={value} />
      </p>
      <p className="mt-1.5 text-sm text-ink-faint">{sub}</p>
    </StaggerItem>
  );
}
