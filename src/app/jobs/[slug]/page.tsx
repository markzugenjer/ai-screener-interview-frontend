import { Briefcase, Check, Clock3, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge, BackLink } from "@/components/ui";
import { fmt } from "@/i18n/format";
import { getI18n, getLocale } from "@/i18n/server";
import { ApiError, apiServer, requireUser } from "@/lib/api-server";
import type { Interview, Job } from "@/lib/types";
import { StartInterviewButton } from "./start-button";

type Props = { params: Promise<{ slug: string }> };

async function loadJob(slug: string): Promise<Job> {
  try {
    return (await apiServer<{ job: Job }>(`/api/v1/jobs/${encodeURIComponent(slug)}?lang=${await getLocale()}`)).job;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [{ slug }, { t }] = await Promise.all([params, getI18n()]);
  const job = await loadJob(slug).catch(() => null);
  return { title: job?.title ?? t.meta.role };
}

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/jobs/${slug}`);
  const [{ t }, job, { interviews }] = await Promise.all([
    getI18n(),
    loadJob(slug),
    apiServer<{ interviews: Interview[] }>(`/api/v1/me/interviews?lang=${await getLocale()}`),
  ]);
  const mine = interviews.filter((iv) => iv.jobId === job.id);
  const open = mine.find((iv) => iv.status === "pending" || iv.status === "in_progress");
  const done = mine.some((iv) => ["completed", "scored", "failed"].includes(iv.status));

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <article>
          <BackLink href="/dashboard#jobs">{t.job.allRoles}</BackLink>
          <Reveal>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge tone="sage">{job.category}</Badge>
              <Badge>{t.level[job.level]}</Badge>
            </div>
            <h1 className="mt-3 text-[2.25rem] font-extrabold leading-tight">{job.title}</h1>
            <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-soft">
              <li className="inline-flex items-center gap-1.5">
                <Briefcase className="size-4 text-ink-faint" aria-hidden />
                {job.division}, {job.employmentType}
              </li>
              {job.location && (
                <li className="inline-flex items-center gap-1.5">
                  <MapPin className="size-4 text-ink-faint" aria-hidden />
                  {job.location}
                </li>
              )}
              <li className="inline-flex items-center gap-1.5">
                <Clock3 className="size-4 text-ink-faint" aria-hidden />
                {fmt(t.job.duration, { n: job.durationMinutes })}
              </li>
            </ul>
            <p className="mt-8 max-w-2xl text-lg leading-relaxed">{job.description}</p>
          </Reveal>
          {job.requirements.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-bold">{t.job.lookingFor}</h2>
              <Stagger as="ul" className="mt-4 max-w-2xl space-y-3">
                {job.requirements.map((r) => (
                  <StaggerItem as="li" key={r} className="flex gap-3 leading-relaxed">
                    <Check className="mt-1 size-4 shrink-0 text-sage-500" aria-hidden />
                    {r}
                  </StaggerItem>
                ))}
              </Stagger>
            </>
          )}
          {job.skills.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label={t.card.skills}>
              {job.skills.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </article>

        <aside className="lg:pt-14">
          <Reveal delay={0.12} className="rounded-card border border-line bg-mist p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">{t.job.beforeStart}</h2>
            <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              {t.job.checklist.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-sage-500" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-field bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft">
              {t.job.resetNote} {done ? t.job.practiceNote : t.job.firstNote}
            </p>
            <div className="mt-6">
              {open ? (
                <Link
                  href={`/interview/${open.id}`}
                  className="inline-flex h-13 w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-paper transition-[background-color,transform,translate,scale] hover:bg-sage-700 active:scale-[0.97]"
                >
                  {t.job.continue}
                </Link>
              ) : (
                <StartInterviewButton slug={job.slug} practice={done} />
              )}
            </div>
          </Reveal>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
