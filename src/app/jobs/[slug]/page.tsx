import { Briefcase, Check, Clock3, MapPin } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { Badge } from "@/components/ui";
import { ApiError, apiServer, requireUser } from "@/lib/api-server";
import { levelLabel } from "@/lib/format";
import type { Interview, Job } from "@/lib/types";
import { StartInterviewButton } from "./start-button";

type Props = { params: Promise<{ slug: string }> };

async function loadJob(slug: string): Promise<Job> {
  try {
    return (await apiServer<{ job: Job }>(`/api/v1/jobs/${encodeURIComponent(slug)}`)).job;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const job = await loadJob(slug).catch(() => null);
  return { title: job?.title ?? "Role" };
}

const checklist = [
  "Find a quiet room. Headphones help Nara hear you clearly.",
  "Allow microphone access when your browser asks.",
  "Answer in Bahasa Indonesia. English technical terms are fine.",
  "Take a moment to think before answering — pauses are okay.",
];

export default async function JobPage({ params }: Props) {
  const { slug } = await params;
  const user = await requireUser(`/jobs/${slug}`);
  const [job, { interviews }] = await Promise.all([loadJob(slug), apiServer<{ interviews: Interview[] }>("/api/v1/me/interviews")]);
  const mine = interviews.filter((iv) => iv.jobId === job.id);
  const open = mine.find((iv) => iv.status === "pending" || iv.status === "in_progress");
  const done = mine.some((iv) => ["completed", "scored", "failed"].includes(iv.status));

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto grid max-w-6xl gap-10 px-4 pt-10 sm:px-6 lg:grid-cols-[1fr_22rem]">
        <article>
          <Link href="/dashboard#jobs" className="text-sm font-medium text-ink-soft hover:text-ink">
            ← All roles
          </Link>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="sage">{job.category}</Badge>
            <Badge>{levelLabel[job.level]}</Badge>
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
              {job.durationMinutes}-minute voice interview
            </li>
          </ul>
          <p className="mt-8 max-w-2xl text-lg leading-relaxed">{job.description}</p>
          {job.requirements.length > 0 && (
            <>
              <h2 className="mt-10 text-xl font-bold">What we&apos;re looking for</h2>
              <ul className="mt-4 max-w-2xl space-y-3">
                {job.requirements.map((r) => (
                  <li key={r} className="flex gap-3 leading-relaxed">
                    <Check className="mt-1 size-4 shrink-0 text-sage-500" aria-hidden />
                    {r}
                  </li>
                ))}
              </ul>
            </>
          )}
          {job.skills.length > 0 && (
            <ul className="mt-8 flex flex-wrap gap-2" aria-label="Skills">
              {job.skills.map((s) => (
                <li key={s} className="rounded-full border border-line px-3 py-1 text-sm text-ink-soft">
                  {s}
                </li>
              ))}
            </ul>
          )}
        </article>

        <aside className="lg:pt-14">
          <div className="rounded-card border border-line bg-mist p-6 lg:sticky lg:top-24">
            <h2 className="text-lg font-bold">Before you start</h2>
            <ul className="mt-4 space-y-3 text-[0.9375rem] leading-relaxed text-ink-soft">
              {checklist.map((c) => (
                <li key={c} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-sage-500" />
                  {c}
                </li>
              ))}
            </ul>
            <p className="mt-5 rounded-field bg-paper px-4 py-3 text-sm leading-relaxed text-ink-soft">
              You can restart once in the first 2 minutes.{" "}
              {done
                ? "You've already finished this interview, so a new attempt is for practice only — recruiters see your first result."
                : "Your first finished interview is the one recruiters review."}
            </p>
            <div className="mt-6">
              {open ? (
                <Link
                  href={`/interview/${open.id}`}
                  className="inline-flex h-13 w-full items-center justify-center rounded-full bg-ink text-base font-semibold text-paper hover:bg-sage-700"
                >
                  Continue your interview
                </Link>
              ) : (
                <StartInterviewButton slug={job.slug} label={done ? "Start a practice interview" : "Start interview"} />
              )}
            </div>
          </div>
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
