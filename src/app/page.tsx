import { ArrowRight, ArrowUpRight, BriefcaseBusiness } from "lucide-react";

import { JobCard } from "@/components/cards";
import { HeroDemo } from "@/components/hero-demo";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { buttonClass, EmptyState, LinkButton } from "@/components/ui";
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
        <section className="relative isolate overflow-hidden">
          {/* Soft colour fields and a faint dot grid behind the hero. */}
          <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
            <div className="motion-loop absolute -left-32 -top-24 size-[28rem] animate-drift rounded-full bg-sage-100/70 blur-3xl" />
            <div className="motion-loop absolute -right-24 top-10 size-[30rem] animate-drift rounded-full bg-blush-100/80 blur-3xl [animation-delay:-6s]" />
            <div className="motion-loop absolute bottom-0 left-1/3 size-72 animate-drift rounded-full bg-sage-50 blur-3xl [animation-delay:-12s]" />
            <div className="absolute inset-0 bg-[radial-gradient(rgb(29_43_35/0.07)_1px,transparent_1px)] [background-size:22px_22px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_40%,black,transparent)]" />
          </div>

          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pb-20 pt-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pb-24 md:pt-20">
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-sage-200 bg-paper/80 py-1.5 pl-2 pr-3.5 text-sm font-semibold text-sage-700 shadow-sm backdrop-blur">
                  <span className="relative flex size-2.5">
                    <span className="motion-loop absolute inset-0 animate-ping-soft rounded-full bg-sage-500/60" />
                    <span className="relative size-2.5 rounded-full bg-sage-500" />
                  </span>
                  {t.landing.eyebrow}
                </span>
              </Reveal>
              <Reveal delay={0.06}>
                <h1 className="mt-6 text-[2.6rem] font-extrabold leading-[1.04] tracking-tight sm:text-[3.6rem]">
                  {t.landing.headlineStart}{" "}
                  <span className="bg-[linear-gradient(transparent_64%,var(--color-blush-100)_64%,var(--color-blush-100)_92%,transparent_92%)] box-decoration-clone text-sage-600">
                    {t.landing.headlineAccent}
                  </span>
                </h1>
              </Reveal>
              <Reveal delay={0.12}>
                <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">{t.landing.lead}</p>
              </Reveal>
              <Reveal delay={0.18}>
                <div className="mt-8 flex flex-wrap gap-3">
                  <LinkButton href={user ? "/dashboard" : "/register"} size="lg" className="group gap-2 shadow-[0_10px_24px_-10px_rgb(29_43_35/0.6)]">
                    {user ? t.landing.ctaDashboard : t.landing.ctaRegister}
                    <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
                  </LinkButton>
                  <LinkButton href="#jobs" variant="secondary" size="lg">
                    {t.landing.ctaRoles}
                  </LinkButton>
                </div>
              </Reveal>
              <Stagger as="ul" className="mt-10 flex max-w-lg divide-x divide-line">
                {t.landing.perks.map((p) => (
                  <StaggerItem as="li" key={p.label} className="flex-1 px-4 first:pl-0 last:pr-0">
                    <div className="text-xl font-extrabold tabular sm:text-2xl">{p.value}</div>
                    <div className="mt-0.5 text-xs font-medium text-ink-faint sm:text-sm">{p.label}</div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>
            <HeroDemo />
          </div>
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

        <section className="mx-auto max-w-6xl px-4 pb-16 pt-4 sm:px-6">
          <Reveal>
            <div className="relative isolate overflow-hidden rounded-[1.75rem] border border-line bg-gradient-to-br from-sage-50 via-paper to-blush-50 px-6 py-10 sm:px-10 sm:py-12">
              <div aria-hidden className="motion-loop absolute -right-16 -top-20 -z-10 size-64 animate-drift rounded-full bg-blush-100/80 blur-3xl" />
              <div aria-hidden className="motion-loop absolute -bottom-24 -left-10 -z-10 size-64 animate-drift rounded-full bg-sage-100/80 blur-3xl [animation-delay:-8s]" />
              <div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
                <div className="max-w-xl">
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-sage-700">
                    <BriefcaseBusiness className="size-4" aria-hidden />
                    {t.landing.careersEyebrow}
                  </span>
                  <h2 className="mt-2 text-[1.75rem] font-extrabold leading-tight sm:text-[2rem]">{t.landing.careersTitle}</h2>
                  <p className="mt-2 leading-relaxed text-ink-soft">{t.landing.careersBody}</p>
                </div>
                <a
                  href="https://career.fdcdentalclinic.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClass("primary", "lg", "group shrink-0 self-start shadow-[0_10px_24px_-10px_rgb(29_43_35/0.6)] md:self-auto")}
                >
                  {t.landing.careersCta}
                  <ArrowUpRight className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
                  <span className="sr-only">({t.landing.careersNewTab})</span>
                </a>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
