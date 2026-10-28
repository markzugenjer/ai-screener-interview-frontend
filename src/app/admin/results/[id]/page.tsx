import { AlertTriangle, Download, Mail, MessageCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DecisionBadge, RecommendationBadge, StatusBadge } from "@/components/admin-bits";
import { CountUp, GrowBar, Reveal } from "@/components/motion";
import { Alert, Badge, BackLink } from "@/components/ui";
import type { Dictionary } from "@/i18n/config";
import { fmt, formatDateTime } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { ApiError, apiServer } from "@/lib/api-server";
import { cn, formatDuration } from "@/lib/format";
import type { ResultDetail } from "@/lib/types";
import { RescoreButton, ReviewPanel } from "./review-panel";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.result };
}

const pill = "inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm font-semibold transition-[background-color,transform] active:scale-[0.97]";

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { t, locale } = await getI18n();
  const a = t.admin;
  let d: ResultDetail;
  try {
    d = await apiServer<ResultDetail>(`/api/v1/admin/results/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const { interview, candidate, score, job } = d;
  const flags = d.integrity.tabHidden + d.integrity.windowBlur;
  const wa = candidate.whatsapp.replace(/\D/g, "");
  const dimLabel = (key: string, fallback: string) => t.dimensions[key as keyof Dictionary["dimensions"]] ?? fallback;

  return (
    <>
      <BackLink href="/admin/results">{a.allCandidates}</BackLink>
      <Reveal className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold">{candidate.fullName}</h1>
          <p className="mt-1 text-ink-soft">
            {fmt(a.attemptLine, { job: job.title, n: interview.attempt, date: formatDateTime(interview.createdAt, locale) })}
            {interview.durationSeconds > 0 && fmt(a.lengthLine, { d: formatDuration(interview.durationSeconds) })}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={interview.status} t={t} />
            {interview.isPractice && <Badge>{a.practiceAttempt}</Badge>}
            <DecisionBadge value={d.reviews[0]?.decision ?? ""} t={t} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${candidate.email}`} className={cn(pill, "border border-line hover:bg-mist")}>
            <Mail className="size-4" aria-hidden /> {a.email}
          </a>
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className={cn(pill, "border border-line hover:bg-mist")}>
              <MessageCircle className="size-4" aria-hidden /> {a.whatsapp}
            </a>
          )}
          {candidate.hasResume && (
            <a href={`/api/v1/admin/candidates/${candidate.id}/resume`} className={cn(pill, "bg-sage-100 text-sage-700 hover:bg-sage-200")}>
              <Download className="size-4" aria-hidden /> {a.resume}
            </a>
          )}
        </div>
      </Reveal>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {!score ? (
            <Reveal className="rounded-card border border-line bg-mist p-6">
              <p className="font-semibold">{interview.status === "failed" ? a.scoringFailed : a.notScored}</p>
              {d.lastError && <p className="mt-1 text-sm text-ink-soft">{d.lastError}</p>}
              {["completed", "failed"].includes(interview.status) && (
                <div className="mt-4">
                  <RescoreButton interviewId={interview.id} />
                </div>
              )}
            </Reveal>
          ) : (
            <>
              <Reveal delay={0.05}>
                <section className="rounded-card border border-line bg-paper p-6">
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                    <div>
                      <p className="text-sm font-semibold text-ink-soft">{a.overallLabel}</p>
                      <p className="text-[3rem] font-extrabold leading-none">
                        <CountUp value={score.overall} />
                        <span className="text-xl text-ink-faint">/100</span>
                      </p>
                    </div>
                    <div>
                      <p className="mb-1.5 text-sm font-semibold text-ink-soft">{a.aiRecommendation}</p>
                      <RecommendationBadge value={score.recommendation} t={t} />
                    </div>
                  </div>
                  <p className="mt-5 leading-relaxed">{score.recruiterSummary}</p>
                  <div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
                    {score.dimensions.map((dm) => (
                      <div key={dm.key}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                          <span className="font-semibold">{dimLabel(dm.key, dm.label)}</span>
                          <span className="tabular text-ink-soft">
                            {fmt(a.ratingLine, { r: dm.rating.toFixed(1), p: Math.round(dm.points), m: dm.max })}
                          </span>
                        </div>
                        <GrowBar size="sm" trackClassName="mt-1.5" percent={(dm.rating / 5) * 100} className={dm.rating >= 3 ? "bg-sage-500" : "bg-blush-400"} />
                        {dm.notes.length > 0 && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{dm.notes.join(" ")}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              </Reveal>

              {((score.strengths?.length ?? 0) > 0 || (score.improvements?.length ?? 0) > 0) && (
                <Reveal className="grid gap-4 md:grid-cols-2">
                  <ListCard title={a.strengths} items={score.strengths ?? []} tone="sage" />
                  <ListCard title={a.gaps} items={score.improvements ?? []} tone="blush" />
                </Reveal>
              )}

              {score.questionScores && score.questionScores.length > 0 && (
                <Reveal>
                  <section className="rounded-card border border-line bg-paper p-6">
                    <h2 className="text-lg font-bold">{a.byQuestion}</h2>
                    <ol className="mt-4 divide-y divide-line">
                      {score.questionScores.map((q, i) => (
                        <li key={q.questionId} className="py-4 first:pt-0 last:pb-0">
                          <div className="flex items-start justify-between gap-4">
                            <p className="font-semibold leading-snug">
                              {i + 1}. {q.question}
                            </p>
                            <Badge tone={q.score >= 4 ? "sage" : q.score === 3 ? "amber" : "blush"} className="tabular">
                              {q.score}/5
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs font-semibold text-ink-faint">{q.skill}</p>
                          {q.evidence && <blockquote className="mt-2 border-l-2 border-sage-200 pl-3 text-sm italic text-ink-soft">“{q.evidence}”</blockquote>}
                          {q.reasoning && <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.reasoning}</p>}
                          {q.missedPoints.length > 0 && (
                            <p className="mt-1.5 text-sm text-blush-700">{fmt(a.missed, { items: q.missedPoints.join("; ") })}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                </Reveal>
              )}
            </>
          )}

          <Reveal>
            <details className="group rounded-card border border-line bg-paper p-6">
              <summary className="cursor-pointer list-none text-lg font-bold">
                {a.transcript} <span className="text-sm font-normal text-ink-faint">{fmt(a.turns, { n: d.transcript.length })}</span>
              </summary>
              <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-2">
                {d.transcript.length === 0 && <p className="text-ink-faint">{a.noTranscript}</p>}
                {d.transcript.map((tr) => (
                  <p key={tr.seq} className="leading-relaxed">
                    <span className={cn("mr-2 text-sm font-bold", tr.speaker === "ai" ? "text-blush-600" : "text-sage-600")}>
                      {tr.speaker === "ai" ? "Dicy" : a.candidate}
                    </span>
                    <span className="tabular mr-2 text-xs text-ink-faint">{formatDuration(Math.floor(tr.startMs / 1000))}</span>
                    {tr.text}
                  </p>
                ))}
              </div>
            </details>
          </Reveal>
        </div>

        <aside className="space-y-6">
          <Reveal delay={0.1}>
            <section className="rounded-card border border-line bg-paper p-6">
              <ReviewPanel interviewId={interview.id} current={d.reviews[0]?.decision ?? ""} />
            </section>
          </Reveal>

          {score && (
            <Reveal delay={0.15}>
              <section className="rounded-card border border-line bg-paper p-6 text-sm">
                <h2 className="font-bold">{a.speech}</h2>
                <dl className="mt-3 space-y-2">
                  <Row label={a.pace} value={score.speech.wordsPerMinute ? fmt(a.wpm, { n: Math.round(score.speech.wordsPerMinute) }) : "—"} />
                  <Row label={a.fillers} value={String(score.speech.fillerWords)} />
                  <Row label={a.pauses} value={String(score.speech.longPauses)} />
                  <Row label={a.words} value={String(score.speech.candidateWords)} />
                </dl>
              </section>
            </Reveal>
          )}

          <Reveal delay={0.2}>
            <section className="rounded-card border border-line bg-paper p-6 text-sm">
              <h2 className="font-bold">{a.integrity}</h2>
              {flags > 0 ? (
                <div className="mt-3">
                  <Alert tone="amber">
                    <span className="inline-flex items-center gap-1.5 font-semibold">
                      <AlertTriangle className="size-4 shrink-0" aria-hidden />
                      {fmt(a.integrityFlag, { tabs: d.integrity.tabHidden, blurs: d.integrity.windowBlur })}
                    </span>
                  </Alert>
                  <p className="mt-2 text-ink-faint">{a.integrityNote}</p>
                </div>
              ) : (
                <p className="mt-2 text-ink-soft">{a.integrityNone}</p>
              )}
            </section>
          </Reveal>

          {d.reviews.length > 0 && (
            <Reveal delay={0.25}>
              <section className="rounded-card border border-line bg-paper p-6 text-sm">
                <h2 className="font-bold">{a.history}</h2>
                <ul className="mt-3 space-y-3">
                  {d.reviews.map((r) => (
                    <li key={r.id}>
                      <div className="flex items-center gap-2">
                        <DecisionBadge value={r.decision} t={t} />
                        <span className="text-ink-faint">{r.reviewer}</span>
                      </div>
                      {r.notes && <p className="mt-1 leading-relaxed text-ink-soft">{r.notes}</p>}
                      <p className="mt-0.5 text-xs text-ink-faint">{formatDateTime(r.createdAt, locale)}</p>
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}
        </aside>
      </div>
    </>
  );
}

function ListCard({ title, items, tone }: { title: string; items: string[]; tone: "sage" | "blush" }) {
  if (items.length === 0) return null;
  return (
    <div className={cn("rounded-card p-6", tone === "sage" ? "bg-sage-50" : "bg-blush-50")}>
      <h2 className={cn("font-bold", tone === "sage" ? "text-sage-700" : "text-blush-700")}>{title}</h2>
      <ul className="mt-2.5 space-y-1.5 text-sm leading-relaxed">
        {items.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="tabular font-semibold">{value}</dd>
    </div>
  );
}
