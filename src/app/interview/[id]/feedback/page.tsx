import { CalendarDays, Info, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CountUp, GrowBar, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { SiteHeader } from "@/components/site-header";
import { LinkButton } from "@/components/ui";
import type { Dictionary, Locale } from "@/i18n/config";
import { formatDateTime } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { ApiError, apiServer, requireUser } from "@/lib/api-server";
import { cn } from "@/lib/format";
import type { CandidateFeedback, Interview } from "@/lib/types";
import { RefreshWhilePending, RetakeButton } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.feedback, robots: { index: false } };
}

function impression(overall: number, t: Dictionary): { label: string; tone: string } {
  if (overall >= 80) return { label: t.feedback.excellent, tone: "text-sage-700" };
  if (overall >= 65) return { label: t.feedback.good, tone: "text-sage-700" };
  if (overall >= 50) return { label: t.feedback.fair, tone: "text-amber" };
  return { label: t.feedback.grow, tone: "text-blush-700" };
}

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/interview/${id}/feedback`);
  const { t, locale } = await getI18n();
  let data: { interview: Interview; feedback: CandidateFeedback | null };
  try {
    data = await apiServer(`/api/v1/interviews/${encodeURIComponent(id)}/feedback?lang=${locale}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const { interview, feedback } = data;
  const job = interview.job!;

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-3xl px-4 pb-20 pt-12 sm:px-6">
        <Reveal>
          <p className="text-center text-sm font-semibold text-sage-700">{job.title}</p>
          <h1 className="mt-2 text-center text-[2.25rem] font-extrabold leading-tight">{t.feedback.title}</h1>
        </Reveal>

        {feedback ? <Scored interview={interview} feedback={feedback} t={t} locale={locale} /> : <Pending interview={interview} t={t} />}

        <Reveal className="mt-12 grid gap-3 sm:grid-cols-2">
          <LinkButton href="/dashboard" variant="secondary" size="lg">
            {t.feedback.back}
          </LinkButton>
          <RetakeButton slug={job.slug} />
        </Reveal>
      </main>
    </>
  );
}

function Scored({ interview, feedback, t, locale }: { interview: Interview; feedback: CandidateFeedback; t: Dictionary; locale: Locale }) {
  const imp = impression(feedback.overall, t);
  const tips = [...feedback.tips, ...feedback.growth.filter((g) => !feedback.tips.includes(g))].slice(0, 6);
  return (
    <>
      <Reveal delay={0.08} className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-sage-500" aria-hidden />
          {t.feedback.overall}{" "}
          <span className="text-ink">
            <CountUp value={feedback.overall} className="text-lg font-extrabold" />
            /100
          </span>
          <span className={cn("font-semibold", imp.tone)}>{imp.label}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 text-ink-faint" aria-hidden />
          {formatDateTime(interview.endedAt ?? interview.createdAt, locale)}
        </span>
      </Reveal>
      <hr className="mt-8 border-line" />

      {feedback.summary && (
        <Reveal delay={0.12}>
          <p className="mt-8 text-lg leading-relaxed">{feedback.summary}</p>
        </Reveal>
      )}

      <Reveal delay={0.16}>
        <Disclaimer practice={interview.isPractice} t={t} />
      </Reveal>

      <h2 className="mt-12 text-2xl font-bold">{t.feedback.breakdown}</h2>
      <Stagger as="ol" className="mt-6 space-y-7">
        {feedback.dimensions.map((d, i) => (
          <StaggerItem as="li" key={d.key}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-bold">
                {i + 1}. {t.dimensions[d.key as keyof Dictionary["dimensions"]] ?? d.label}
              </h3>
              <span className="tabular text-sm font-semibold text-ink-soft">
                {Math.round(d.points)}/{d.max}
              </span>
            </div>
            <GrowBar
              trackClassName="mt-2"
              percent={d.max ? Math.max(3, (d.points / d.max) * 100) : 0}
              className={d.max && d.points / d.max >= 0.5 ? "bg-sage-500" : "bg-blush-400"}
            />
            {d.notes.length > 0 && (
              <ul className="mt-3 space-y-1.5 pl-5 text-ink-soft">
                {d.notes.map((n) => (
                  <li key={n} className="list-disc leading-relaxed marker:text-ink-faint">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </StaggerItem>
        ))}
      </Stagger>

      {feedback.strengths.length > 0 && (
        <Reveal className="mt-12">
          <section className="rounded-card bg-sage-50 p-6">
            <h2 className="text-lg font-bold text-sage-700">{t.feedback.didWell}</h2>
            <ul className="mt-3 space-y-2 leading-relaxed">
              {feedback.strengths.map((s) => (
                <li key={s} className="flex gap-2.5">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sage-500" />
                  {s}
                </li>
              ))}
            </ul>
          </section>
        </Reveal>
      )}

      {tips.length > 0 && (
        <Reveal className="mt-5">
          <section className="rounded-card bg-blush-50 p-6">
            <h2 className="text-lg font-bold text-blush-700">{t.feedback.tips}</h2>
            <ul className="mt-3 space-y-2 leading-relaxed">
              {tips.map((tip) => (
                <li key={tip} className="flex gap-2.5">
                  <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-blush-400" />
                  {tip}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-ink-soft">{t.feedback.encouragement}</p>
          </section>
        </Reveal>
      )}
    </>
  );
}

function Disclaimer({ practice, t }: { practice: boolean; t: Dictionary }) {
  return (
    <div className="mt-8 flex gap-3 rounded-field border border-line bg-mist px-4 py-3.5 text-sm leading-relaxed text-ink-soft">
      <Info className="mt-0.5 size-4 shrink-0 text-sage-600" aria-hidden />
      <p>
        {t.feedback.disclaimer}
        {practice && t.feedback.disclaimerPractice}
      </p>
    </div>
  );
}

function Pending({ interview, t }: { interview: Interview; t: Dictionary }) {
  const abandoned = interview.status === "abandoned";
  return (
    <Reveal delay={0.08} className="mt-10 rounded-card border border-line bg-mist p-8 text-center">
      {abandoned ? (
        <>
          <p className="text-lg font-bold">{t.feedback.noAnswersTitle}</p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-soft">{t.feedback.noAnswersBody}</p>
        </>
      ) : (
        <>
          <span aria-hidden className="mx-auto block size-10 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500" />
          <p className="mt-5 text-lg font-bold">{interview.status === "failed" ? t.feedback.scoringSlow : t.feedback.scoring}</p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-soft">{t.feedback.scoringBody}</p>
          <RefreshWhilePending interviewId={interview.id} />
        </>
      )}
      <Disclaimer practice={interview.isPractice} t={t} />
    </Reveal>
  );
}
