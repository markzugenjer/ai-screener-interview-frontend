import type { Interview, JobBrief } from "./types";

/** All of a candidate's attempts for one job, shown as a single card. */
export interface InterviewGroup {
  jobId: string;
  job?: JobBrief;
  /** The most recent attempt: decides the date, status and main button. */
  latest: Interview;
  /** The most recent attempt that has a score, if any. */
  lastScored?: Interview;
  attempts: number;
}

const live = (iv: Interview) => iv.status === "pending" || iv.status === "in_progress";

/**
 * Groups interviews by job, newest attempt first, newest group first.
 * Example: three "Left early" attempts for one role become one card with "3 attempts".
 */
export function groupByJob(interviews: Interview[]): InterviewGroup[] {
  const byJob = new Map<string, Interview[]>();
  for (const iv of interviews) {
    const list = byJob.get(iv.jobId) ?? [];
    list.push(iv);
    byJob.set(iv.jobId, list);
  }
  const groups: InterviewGroup[] = [];
  for (const [jobId, list] of byJob) {
    list.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const latest = list[0]!;
    groups.push({
      jobId,
      job: latest.job,
      latest,
      lastScored: list.find((iv) => iv.status === "scored" && iv.overall !== undefined),
      attempts: list.length,
    });
  }
  return groups.sort((a, b) => Date.parse(b.latest.createdAt) - Date.parse(a.latest.createdAt));
}

/** Where the card's button goes: continue a live attempt, else the most useful feedback. */
export function groupHref(g: InterviewGroup): string {
  if (live(g.latest)) return `/interview/${g.latest.id}`;
  const target = g.latest.status === "abandoned" && g.lastScored ? g.lastScored : g.latest;
  return `/interview/${target.id}/feedback`;
}

export const isLive = live;
