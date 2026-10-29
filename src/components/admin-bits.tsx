import Link from "next/link";
import { TriangleAlert } from "lucide-react";
import type { Dictionary } from "@/i18n/config";
import type { Decision, InterviewStatus, Recommendation } from "@/lib/types";
import { Reveal } from "./motion";
import { Badge } from "./ui";

export function RecommendationBadge({ value, t }: { value: Recommendation | ""; t: Dictionary }) {
  if (!value) return <span className="text-ink-faint">—</span>;
  const tone = value === "strong_yes" || value === "yes" ? "sage" : value === "maybe" ? "amber" : "blush";
  return <Badge tone={tone}>{t.recommendation[value]}</Badge>;
}

export function StatusBadge({ value, t }: { value: InterviewStatus; t: Dictionary }) {
  const tone = value === "scored" ? "sage" : value === "failed" ? "danger" : value === "in_progress" ? "blush" : value === "completed" ? "amber" : "neutral";
  return <Badge tone={tone}>{value === "scored" ? t.status.scoredShort : t.status[value]}</Badge>;
}

export function DecisionBadge({ value, t }: { value: Decision | ""; t: Dictionary }) {
  if (!value) return <Badge>{t.decision.none}</Badge>;
  return <Badge tone={value === "shortlist" ? "sage" : value === "reject" ? "blush" : "amber"}>{t.decision[value]}</Badge>;
}

/** Overall score with a small bar; the bar is green at 50+ and pink below. */
export function ScoreBar({ value }: { value: number | undefined }) {
  if (value === undefined) return <span className="text-ink-faint">—</span>;
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="tabular w-7 text-right font-bold">{value}</span>
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-mist" aria-hidden>
        <span className={value >= 50 ? "block h-full bg-sage-500" : "block h-full bg-blush-400"} style={{ width: `${Math.max(4, value)}%` }} />
      </span>
    </span>
  );
}

export function PageTitle({ title, children, action }: { title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return (
    <Reveal className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] font-extrabold">{title}</h1>
        {children && <p className="mt-1 text-ink-soft">{children}</p>}
      </div>
      {action}
    </Reveal>
  );
}

/** Shown while OPEN_RECRUITER_ACCESS is on: everyone signed in can see candidates' data. */
export function OpenAccessBanner({ t, showTeamLink }: { t: Dictionary; showTeamLink?: boolean }) {
  return (
    <div role="status" className="mb-6 flex gap-3 rounded-card border border-amber/30 bg-amber-soft p-4 text-sm">
      <TriangleAlert className="mt-0.5 size-5 shrink-0 text-amber" aria-hidden />
      <div>
        <p className="font-bold text-ink">{t.admin.openAccessTitle}</p>
        <p className="mt-1 leading-relaxed text-ink-soft">{t.admin.openAccessBody}</p>
        {showTeamLink && (
          <Link href="/admin/team" className="mt-2 inline-block font-semibold text-sage-700 underline decoration-transparent underline-offset-4 hover:decoration-current">
            {t.admin.team} →
          </Link>
        )}
      </div>
    </div>
  );
}
