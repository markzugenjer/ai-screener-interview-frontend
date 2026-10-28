import { AlertTriangle, Download, Mail, MessageCircle } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { DecisionBadge, RecommendationBadge, StatusBadge } from "@/components/admin-bits";
import { Alert, Badge } from "@/components/ui";
import { ApiError, apiServer } from "@/lib/api-server";
import { cn, formatDateTime, formatDuration } from "@/lib/format";
import type { ResultDetail } from "@/lib/types";
import { RescoreButton, ReviewPanel } from "./review-panel";

export const metadata = { title: "Candidate result" };

export default async function ResultPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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

  return (
    <>
      <Link href="/admin/results" className="text-sm font-medium text-ink-soft hover:text-ink">
        ← All candidates
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[1.75rem] font-extrabold">{candidate.fullName}</h1>
          <p className="mt-1 text-ink-soft">
            {job.title}, attempt {interview.attempt}, {formatDateTime(interview.createdAt)}
            {interview.durationSeconds > 0 && `, ${formatDuration(interview.durationSeconds)} long`}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge value={interview.status} />
            {interview.isPractice && <Badge>Practice attempt</Badge>}
            <DecisionBadge value={d.reviews[0]?.decision ?? ""} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${candidate.email}`} className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:bg-mist">
            <Mail className="size-4" aria-hidden /> Email
          </a>
          {wa && (
            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" className="inline-flex h-9 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold hover:bg-mist">
              <MessageCircle className="size-4" aria-hidden /> WhatsApp
            </a>
          )}
          {candidate.hasResume && (
            <a href={`/api/v1/admin/candidates/${candidate.id}/resume`} className="inline-flex h-9 items-center gap-2 rounded-full bg-sage-100 px-4 text-sm font-semibold text-sage-700 hover:bg-sage-200">
              <Download className="size-4" aria-hidden /> Resume
            </a>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-6 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-6">
          {!score ? (
            <div className="rounded-card border border-line bg-mist p-6">
              <p className="font-semibold">{interview.status === "failed" ? "Scoring failed" : "Not scored yet"}</p>
              {d.lastError && <p className="mt-1 text-sm text-ink-soft">{d.lastError}</p>}
              {["completed", "failed"].includes(interview.status) && (
                <div className="mt-4">
                  <RescoreButton interviewId={interview.id} />
                </div>
              )}
            </div>
          ) : (
            <>
              <section className="rounded-card border border-line bg-paper p-6">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                  <div>
                    <p className="text-sm font-semibold text-ink-soft">Overall</p>
                    <p className="text-[3rem] font-extrabold leading-none tabular">
                      {score.overall}
                      <span className="text-xl text-ink-faint">/100</span>
                    </p>
                  </div>
                  <div>
                    <p className="mb-1.5 text-sm font-semibold text-ink-soft">AI recommendation</p>
                    <RecommendationBadge value={score.recommendation} />
                  </div>
                </div>
                <p className="mt-5 leading-relaxed">{score.recruiterSummary}</p>
                <div className="mt-6 grid gap-x-8 gap-y-5 md:grid-cols-2">
                  {score.dimensions.map((dm) => (
                    <div key={dm.key}>
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold">{dm.label}</span>
                        <span className="tabular text-ink-soft">
                          {dm.rating.toFixed(1)}/5, {Math.round(dm.points)}/{dm.max} pts
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-mist" aria-hidden>
                        <div className={cn("h-full rounded-full", dm.rating >= 3 ? "bg-sage-500" : "bg-blush-400")} style={{ width: `${(dm.rating / 5) * 100}%` }} />
                      </div>
                      {dm.notes.length > 0 && <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{dm.notes.join(" ")}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {((score.strengths?.length ?? 0) > 0 || (score.improvements?.length ?? 0) > 0) && (
                <section className="grid gap-4 md:grid-cols-2">
                  <ListCard title="Strengths" items={score.strengths ?? []} tone="sage" />
                  <ListCard title="Gaps to probe" items={score.improvements ?? []} tone="blush" />
                </section>
              )}

              {score.questionScores && score.questionScores.length > 0 && (
                <section className="rounded-card border border-line bg-paper p-6">
                  <h2 className="text-lg font-bold">Answers, question by question</h2>
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
                          <p className="mt-1.5 text-sm text-blush-700">Missed: {q.missedPoints.join("; ")}</p>
                        )}
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </>
          )}

          <details className="group rounded-card border border-line bg-paper p-6">
            <summary className="cursor-pointer list-none text-lg font-bold">
              Transcript <span className="text-sm font-normal text-ink-faint">({d.transcript.length} turns)</span>
            </summary>
            <div className="mt-4 max-h-[32rem] space-y-3 overflow-y-auto pr-2">
              {d.transcript.length === 0 && <p className="text-ink-faint">No transcript recorded.</p>}
              {d.transcript.map((t) => (
                <p key={t.seq} className="leading-relaxed">
                  <span className={cn("mr-2 text-sm font-bold", t.speaker === "ai" ? "text-blush-600" : "text-sage-600")}>
                    {t.speaker === "ai" ? "Nara" : "Candidate"}
                  </span>
                  <span className="tabular mr-2 text-xs text-ink-faint">{formatDuration(Math.floor(t.startMs / 1000))}</span>
                  {t.text}
                </p>
              ))}
            </div>
          </details>
        </div>

        <aside className="space-y-6">
          <section className="rounded-card border border-line bg-paper p-6">
            <ReviewPanel interviewId={interview.id} current={d.reviews[0]?.decision ?? ""} />
          </section>

          {score && (
            <section className="rounded-card border border-line bg-paper p-6 text-sm">
              <h2 className="font-bold">Speech</h2>
              <dl className="mt-3 space-y-2">
                <Row label="Pace" value={score.speech.wordsPerMinute ? `${Math.round(score.speech.wordsPerMinute)} words/min` : "—"} />
                <Row label="Filler words" value={String(score.speech.fillerWords)} />
                <Row label="Long pauses" value={String(score.speech.longPauses)} />
                <Row label="Words spoken" value={String(score.speech.candidateWords)} />
              </dl>
            </section>
          )}

          <section className="rounded-card border border-line bg-paper p-6 text-sm">
            <h2 className="font-bold">Integrity signals</h2>
            {flags > 0 ? (
              <div className="mt-3">
                <Alert tone="amber">
                  <span className="inline-flex items-center gap-1.5 font-semibold">
                    <AlertTriangle className="size-4" aria-hidden /> Left the interview tab {d.integrity.tabHidden}×, window lost focus {d.integrity.windowBlur}×
                  </span>
                </Alert>
                <p className="mt-2 text-ink-faint">A signal to look into, not proof of cheating.</p>
              </div>
            ) : (
              <p className="mt-2 text-ink-soft">No tab switches recorded.</p>
            )}
          </section>

          {d.reviews.length > 0 && (
            <section className="rounded-card border border-line bg-paper p-6 text-sm">
              <h2 className="font-bold">Review history</h2>
              <ul className="mt-3 space-y-3">
                {d.reviews.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-2">
                      <DecisionBadge value={r.decision} />
                      <span className="text-ink-faint">{r.reviewer}</span>
                    </div>
                    {r.notes && <p className="mt-1 leading-relaxed text-ink-soft">{r.notes}</p>}
                    <p className="mt-0.5 text-xs text-ink-faint">{formatDateTime(r.createdAt)}</p>
                  </li>
                ))}
              </ul>
            </section>
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
