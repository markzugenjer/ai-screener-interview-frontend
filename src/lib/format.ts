import type { InterviewStatus, Level, Recommendation } from "./types";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Jakarta",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => `${dateTimeFmt.format(new Date(iso))} WIB`;

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export const levelLabel: Record<Level, string> = { junior: "Junior", mid: "Mid-level", senior: "Senior" };

export const statusLabel: Record<InterviewStatus, string> = {
  pending: "Not started",
  in_progress: "In progress",
  completed: "Scoring",
  scored: "Feedback ready",
  failed: "Scoring delayed",
  abandoned: "Left early",
};

export const recommendationLabel: Record<Recommendation, string> = {
  strong_yes: "Strong yes",
  yes: "Yes",
  maybe: "Maybe",
  no: "Not recommended",
};

/** Two letters for the job badge, e.g. "Junior Frontend Developer" -> "FE". */
export function monogram(title: string): string {
  const known: Record<string, string> = { frontend: "FE", backend: "BE", fullstack: "FS", mobile: "MB", data: "DA", devops: "DO", design: "UX", qa: "QA" };
  const words = title.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of words) if (known[w]) return known[w];
  const meaningful = words.filter((w) => !["junior", "senior", "mid", "the", "and", "of"].includes(w));
  return (meaningful.slice(0, 2).map((w) => w[0]).join("") || "JB").toUpperCase();
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
