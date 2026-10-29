import type { Metadata } from "next";

import { InterviewCard, JobCard } from "@/components/cards";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, LinkButton } from "@/components/ui";
import { fmt } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { apiServer, requireUser } from "@/lib/api-server";
import { groupByJob } from "@/lib/interviews";
import type { Interview, Job } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.dashboard };
}

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const { t, locale } = await getI18n();
  const [{ jobs }, { interviews }] = await Promise.all([
    apiServer<{ jobs: Job[] }>(`/api/v1/jobs?lang=${locale}`),
    apiServer<{ interviews: Interview[] }>(`/api/v1/me/interviews?lang=${locale}`),
  ]);
  const groups = groupByJob(interviews);
  const first = user.fullName.split(" ")[0] ?? "";

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <Reveal>
          <h1 className="text-[2rem] font-extrabold">{fmt(t.dashboard.hi, { name: first })}</h1>
          <p className="mt-1.5 text-ink-soft">{groups.length > 0 ? t.dashboard.leadWith : t.dashboard.leadEmpty}</p>
        </Reveal>

        <section id="interviews" className="mt-12 scroll-mt-20" aria-labelledby="interviews-title">
          <h2 id="interviews-title" className="text-xl font-bold">
            {t.dashboard.interviewsTitle}
          </h2>
          {groups.length === 0 ? (
            <Reveal className="mt-5">
              <EmptyState
                title={t.dashboard.noInterviews}
                action={
                  <LinkButton href="#jobs" variant="secondary">
                    {t.dashboard.browseRoles}
                  </LinkButton>
                }
              >
                {t.dashboard.noInterviewsBody}
              </EmptyState>
            </Reveal>
          ) : (
            <Stagger className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {groups.map((g) => (
                <StaggerItem key={g.jobId} className="h-full">
                  <InterviewCard group={g} t={t} locale={locale} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>

        <section id="jobs" className="mt-14 scroll-mt-20" aria-labelledby="jobs-title">
          <h2 id="jobs-title" className="text-xl font-bold">
            {t.dashboard.rolesTitle}
          </h2>
          {jobs.length === 0 ? (
            <Reveal className="mt-5">
              <EmptyState title={t.dashboard.noRoles}>{t.dashboard.noRolesBody}</EmptyState>
            </Reveal>
          ) : (
            <Stagger className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <StaggerItem key={job.id} className="h-full">
                  <JobCard job={job} href={`/jobs/${job.slug}`} t={t} locale={locale} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
