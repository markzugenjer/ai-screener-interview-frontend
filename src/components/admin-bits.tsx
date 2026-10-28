import { recommendationLabel, statusLabel } from "@/lib/format";
import type { Decision, InterviewStatus, Recommendation } from "@/lib/types";
import { Badge } from "./ui";

export function RecommendationBadge({ value }: { value: Recommendation | "" }) {
  if (!value) return <span className="text-ink-faint">—</span>;
  const tone = value === "strong_yes" || value === "yes" ? "sage" : value === "maybe" ? "amber" : "blush";
  return <Badge tone={tone}>{recommendationLabel[value]}</Badge>;
}

export function StatusBadge({ value }: { value: InterviewStatus }) {
  const tone = value === "scored" ? "sage" : value === "failed" ? "danger" : value === "in_progress" ? "blush" : value === "completed" ? "amber" : "neutral";
  return <Badge tone={tone}>{value === "scored" ? "Scored" : statusLabel[value]}</Badge>;
}

const decisionLabel: Record<Decision, string> = { shortlist: "Shortlisted", reject: "Rejected", hold: "On hold" };

export function DecisionBadge({ value }: { value: Decision | "" }) {
  if (!value) return <Badge>To review</Badge>;
  return <Badge tone={value === "shortlist" ? "sage" : value === "reject" ? "blush" : "amber"}>{decisionLabel[value]}</Badge>;
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
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-[1.75rem] font-extrabold">{title}</h1>
        {children && <p className="mt-1 text-ink-soft">{children}</p>}
      </div>
      {action}
    </div>
  );
}
