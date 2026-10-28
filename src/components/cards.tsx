import { CalendarDays, Clock3, MapPin, Sparkles } from "lucide-react";
import Link from "next/link";

import { cn, formatDate, levelLabel, monogram, statusLabel } from "@/lib/format";
import type { Interview, Job, JobBrief } from "@/lib/types";
import { Badge, buttonClass } from "./ui";

/** Job badge: a two-letter monogram tile (replace with your company logo if you have one). */
function JobBadge({ title, tone }: { title: string; tone: "sage" | "blush" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-14 place-items-center rounded-2xl text-lg font-extrabold tracking-tight",
        tone === "sage" ? "bg-sage-100 text-sage-700" : "bg-blush-100 text-blush-700",
      )}
    >
      {monogram(title)}
    </span>
  );
}

/** Skill chips shown at the bottom-left of each card. */
function SkillChips({ skills }: { skills: string[] }) {
  if (skills.length === 0) return <span />;
  return (
    <ul className="flex min-w-0 flex-nowrap gap-1.5 overflow-hidden" aria-label="Skills">
      {skills.slice(0, 2).map((s) => (
        <li key={s} className="shrink-0 rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft">
          {s}
        </li>
      ))}
      {skills.length > 2 && (
        <li className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-faint" title={skills.slice(2).join(", ")}>
          +{skills.length - 2}
        </li>
      )}
    </ul>
  );
}

/** The category tab sitting in the card's top-right corner (as in the reference design). */
function CornerTab({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-0 top-0 rounded-bl-2xl rounded-tr-card bg-mist px-4 py-2 text-xs font-semibold text-ink-soft">
      {children}
    </span>
  );
}

const cardShell =
  "relative flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-lift transition-[border-color,box-shadow] " +
  "hover:border-sage-200";

/** A finished or ongoing interview, modelled on the reference card. */
export function InterviewCard({ interview }: { interview: Interview & { job?: JobBrief } }) {
  const job = interview.job;
  const scored = interview.status === "scored" && interview.overall !== undefined;
  const live = interview.status === "pending" || interview.status === "in_progress";
  const href = live ? `/interview/${interview.id}` : `/interview/${interview.id}/feedback`;
  return (
    <article className={cardShell}>
      <CornerTab>{job?.category ?? "Interview"}</CornerTab>
      <JobBadge title={job?.title ?? "Interview"} tone={scored ? "sage" : "blush"} />
      <h3 className="mt-5 text-xl font-bold leading-snug">{job?.title ?? "Interview"}</h3>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4 text-ink-faint" aria-hidden />
          {formatDate(interview.createdAt)}
        </span>
        {scored ? (
          <span className="inline-flex items-center gap-1.5">
            <Sparkles className="size-4 text-sage-500" aria-hidden />
            <span className="tabular">
              <strong className="font-bold text-ink">{interview.overall}</strong>/100
            </span>
          </span>
        ) : (
          <Badge tone={live ? "blush" : interview.status === "abandoned" ? "neutral" : "amber"}>{statusLabel[interview.status]}</Badge>
        )}
        {interview.isPractice && <Badge>Practice</Badge>}
      </div>
      <p className="mt-4 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-soft">
        {interview.summary ||
          (interview.status === "pending"
            ? "You haven't started this interview yet. Find a quiet room, then join when you're ready."
            : live
            ? "You started this interview but haven't finished it yet. You can pick up where you left off."
            : interview.status === "abandoned"
              ? "This session ended before any answers were recorded."
              : "Your answers are being reviewed. Feedback usually appears within a few minutes.")}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <SkillChips skills={job?.skills ?? []} />
        <Link href={href} className={buttonClass(live ? "primary" : "secondary", "sm")}>
          {interview.status === "pending" ? "Start interview" : live ? "Continue interview" : "View interview"}
        </Link>
      </div>
    </article>
  );
}

/** An open role the candidate can interview for. */
export function JobCard({ job, href }: { job: Job; href: string }) {
  return (
    <article className={cardShell}>
      <CornerTab>{job.category}</CornerTab>
      <JobBadge title={job.title} tone="sage" />
      <h3 className="mt-5 text-xl font-bold leading-snug">{job.title}</h3>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4 text-ink-faint" aria-hidden />
          {job.location || job.division}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-4 text-ink-faint" aria-hidden />
          {job.durationMinutes} min interview
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-soft">{job.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <SkillChips skills={job.skills} />
        <Link href={href} className={buttonClass("primary", "sm")} aria-label={`View ${job.title}`}>
          View role
        </Link>
      </div>
      <span className="sr-only">{levelLabel[job.level]} level</span>
    </article>
  );
}
