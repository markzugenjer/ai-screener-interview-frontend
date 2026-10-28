import { CalendarDays, Info, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SiteHeader } from "@/components/site-header";
import { LinkButton } from "@/components/ui";
import { ApiError, apiServer, requireUser } from "@/lib/api-server";
import { cn, formatDateTime } from "@/lib/format";
import type { CandidateFeedback, Interview } from "@/lib/types";
import { RefreshWhilePending, RetakeButton } from "./actions";

export const metadata: Metadata = { title: "Interview feedback", robots: { index: false } };

function impression(overall: number): { label: string; tone: string } {
  if (overall >= 80) return { label: "Excellent", tone: "text-sage-700" };
  if (overall >= 65) return { label: "Good", tone: "text-sage-700" };
  if (overall >= 50) return { label: "Fair", tone: "text-amber" };
  return { label: "Room to grow", tone: "text-blush-700" };
}

export default async function FeedbackPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/interview/${id}/feedback`);
  let data: { interview: Interview; feedback: CandidateFeedback | null };
  try {
    data = await apiServer(`/api/v1/interviews/${encodeURIComponent(id)}/feedback`);
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
        <p className="text-center text-sm font-semibold text-sage-700">{job.title}</p>
        <h1 className="mt-2 text-center text-[2.25rem] font-extrabold leading-tight">Feedback on your interview</h1>

        {feedback ? (
          <Scored interview={interview} feedback={feedback} />
        ) : (
          <Pending interview={interview} />
        )}

        <div className="mt-12 grid gap-3 sm:grid-cols-2">
          <LinkButton href="/dashboard" variant="secondary" size="lg">
            Back to dashboard
          </LinkButton>
          <RetakeButton slug={job.slug} />
        </div>
      </main>
    </>
  );
}

function Scored({ interview, feedback }: { interview: Interview; feedback: CandidateFeedback }) {
  const imp = impression(feedback.overall);
  return (
    <>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-ink-soft">
        <span className="inline-flex items-center gap-2">
          <Sparkles className="size-4 text-sage-500" aria-hidden />
          Overall impression:{" "}
          <span className="tabular text-ink">
            <strong className="text-lg font-extrabold">{feedback.overall}</strong>/100
          </span>
          <span className={cn("font-semibold", imp.tone)}>{imp.label}</span>
        </span>
        <span className="inline-flex items-center gap-2">
          <CalendarDays className="size-4 text-ink-faint" aria-hidden />
          {formatDateTime(interview.endedAt ?? interview.createdAt)}
        </span>
      </div>
      <hr className="mt-8 border-line" />

      {feedback.summary && <p className="mt-8 text-lg leading-relaxed">{feedback.summary}</p>}

      <Disclaimer practice={interview.isPractice} />

      <h2 className="mt-12 text-2xl font-bold">Breakdown of your evaluation</h2>
      <ol className="mt-6 space-y-7">
        {feedback.dimensions.map((d, i) => (
          <li key={d.key}>
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="font-bold">
                {i + 1}. {d.label}
              </h3>
              <span className="tabular text-sm font-semibold text-ink-soft">
                {Math.round(d.points)}/{d.max}
              </span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-mist" aria-hidden>
              <div
                className={cn("h-full rounded-full", d.max && d.points / d.max >= 0.5 ? "bg-sage-500" : "bg-blush-400")}
                style={{ width: `${d.max ? Math.max(3, (d.points / d.max) * 100) : 0}%` }}
              />
            </div>
            {d.notes.length > 0 && (
              <ul className="mt-3 space-y-1.5 pl-5 text-ink-soft">
                {d.notes.map((n) => (
                  <li key={n} className="list-disc leading-relaxed marker:text-ink-faint">
                    {n}
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ol>

      {feedback.strengths.length > 0 && (
        <section className="mt-12 rounded-card bg-sage-50 p-6">
          <h2 className="text-lg font-bold text-sage-700">What you did well</h2>
          <ul className="mt-3 space-y-2 leading-relaxed">
            {feedback.strengths.map((s) => (
              <li key={s} className="flex gap-2.5">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-sage-500" />
                {s}
              </li>
            ))}
          </ul>
        </section>
      )}

      {(feedback.tips.length > 0 || feedback.growth.length > 0) && (
        <section className="mt-5 rounded-card bg-blush-50 p-6">
          <h2 className="text-lg font-bold text-blush-700">Tips for your next interview</h2>
          <ul className="mt-3 space-y-2 leading-relaxed">
            {[...feedback.tips, ...feedback.growth.filter((g) => !feedback.tips.includes(g))].slice(0, 6).map((t) => (
              <li key={t} className="flex gap-2.5">
                <span aria-hidden className="mt-2.5 size-1.5 shrink-0 rounded-full bg-blush-400" />
                {t}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-ink-soft">Every interview is practice for the next one. You&apos;ve already done the hardest part: showing up.</p>
        </section>
      )}
    </>
  );
}

function Disclaimer({ practice }: { practice: boolean }) {
  return (
    <div className="mt-8 flex gap-3 rounded-field border border-line bg-mist px-4 py-3.5 text-sm leading-relaxed text-ink-soft">
      <Info className="mt-0.5 size-4 shrink-0 text-sage-600" aria-hidden />
      <p>
        This is an AI screening result, not a final hiring decision. A recruiter reviews every interview before deciding
        on next steps, and will contact you by WhatsApp or email.
        {practice && " This was a practice attempt, so it doesn't replace your first result."}
      </p>
    </div>
  );
}

function Pending({ interview }: { interview: Interview }) {
  const abandoned = interview.status === "abandoned";
  return (
    <div className="mt-10 rounded-card border border-line bg-mist p-8 text-center">
      {abandoned ? (
        <>
          <p className="text-lg font-bold">No answers were recorded</p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-soft">
            The interview ended before Nara heard any answers, so there&apos;s nothing to score. You can start again
            whenever you&apos;re ready.
          </p>
        </>
      ) : (
        <>
          <span aria-hidden className="mx-auto block size-10 animate-spin rounded-full border-4 border-sage-100 border-t-sage-500" />
          <p className="mt-5 text-lg font-bold">{interview.status === "failed" ? "Scoring is taking longer than usual" : "Scoring your answers"}</p>
          <p className="mx-auto mt-2 max-w-md leading-relaxed text-ink-soft">
            This usually takes a minute or two. This page updates by itself, or you can come back later from your
            dashboard.
          </p>
          <RefreshWhilePending />
        </>
      )}
      <Disclaimer practice={interview.isPractice} />
    </div>
  );
}
