import { JobCard } from "@/components/cards";
import { HeroDemo } from "@/components/hero-demo";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, LinkButton } from "@/components/ui";
import { getI18n } from "@/i18n/server";
import { apiServer, currentUser } from "@/lib/api-server";
import type { Job } from "@/lib/types";

async function openJobs(): Promise<Job[] | null> {
  try {
    return (await apiServer<{ jobs: Job[] }>("/api/v1/jobs")).jobs;
  } catch {
    return null;
  }
}

export default async function Home() {
  const [{ t, locale }, user, jobs] = await Promise.all([getI18n(), currentUser().catch(() => null), openJobs()]);

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <Reveal>
              <h1 className="text-[2.5rem] font-extrabold leading-[1.05] sm:text-[3.25rem]">{t.landing.headline}</h1>
            </Reveal>
            <Reveal delay={0.08}>
              <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t.landing.lead}</p>
            </Reveal>
            <Reveal delay={0.16}>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href={user ? "/dashboard" : "/register"} size="lg">
                  {user ? t.landing.ctaDashboard : t.landing.ctaRegister}
                </LinkButton>
                <LinkButton href="#jobs" variant="secondary" size="lg">
                  {t.landing.ctaRoles}
                </LinkButton>
              </div>
            </Reveal>
          </div>
          <HeroDemo />
        </section>

        <section id="jobs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
          <Reveal>
            <h2 className="text-[1.75rem] font-bold">{t.landing.rolesTitle}</h2>
            <p className="mt-1 text-ink-soft">{t.landing.rolesLead}</p>
          </Reveal>
          {jobs && jobs.length > 0 && (
            <Stagger className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <StaggerItem key={job.id} className="h-full">
                  <JobCard job={job} href={`/jobs/${job.slug}`} t={t} locale={locale} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
          {jobs?.length === 0 && (
            <div className="mt-8">
              <EmptyState title={t.landing.noRoles}>{t.landing.noRolesBody}</EmptyState>
            </div>
          )}
          {jobs === null && (
            <div className="mt-8">
              <EmptyState title={t.landing.rolesError}>{t.landing.rolesErrorBody}</EmptyState>
            </div>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <Reveal>
            <h2 className="text-[1.75rem] font-bold">{t.landing.howTitle}</h2>
          </Reveal>
          <Stagger as="ol" className="mt-8 grid gap-5 md:grid-cols-3">
            {t.landing.steps.map((s, i) => (
              <StaggerItem as="li" key={s.title} className="rounded-card bg-mist p-6">
                <span className="grid size-9 place-items-center rounded-full bg-paper text-sm font-bold text-sage-700 tabular">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{s.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
