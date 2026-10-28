import { CalendarDays, Clock3, MapPin, RotateCcw, Sparkles } from "lucide-react";
import Link from "next/link";

import type { Dictionary, Locale } from "@/i18n/config";
import { fmt, formatDate } from "@/i18n/format";
import { cn, monogram } from "@/lib/format";
import { groupHref, isLive, type InterviewGroup } from "@/lib/interviews";
import type { Job } from "@/lib/types";
import { Badge, buttonClass } from "./ui";

type I18n = { t: Dictionary; locale: Locale };

/** Job badge: a two-letter monogram tile (replace with your company logo if you have one). */
function JobBadge({ title, tone }: { title: string; tone: "sage" | "blush" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-14 place-items-center rounded-2xl text-lg font-extrabold tracking-tight transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-105",
        tone === "sage" ? "bg-sage-100 text-sage-700" : "bg-blush-100 text-blush-700",
      )}
    >
      {monogram(title)}
    </span>
  );
}

/** The first skill, then "+N" (full list on hover), so the footer never wraps or squashes. */
function SkillChips({ skills, t }: { skills: string[]; t: Dictionary }) {
  if (skills.length === 0) return <span />;
  return (
    <ul className="flex min-w-0 flex-nowrap gap-1.5" aria-label={t.card.skills}>
      <li className="min-w-0 truncate rounded-full border border-line bg-paper px-2.5 py-1 text-xs font-medium text-ink-soft" title={skills[0]}>
        {skills[0]}
      </li>
      {skills.length > 1 && (
        <li className="shrink-0 rounded-full bg-mist px-2.5 py-1 text-xs font-medium text-ink-faint" title={skills.slice(1).join(", ")}>
          {fmt(t.card.more, { n: skills.length - 1 })}
        </li>
      )}
    </ul>
  );
}

/** The category tab sitting in the card's top-right corner (as in the reference design). */
function CornerTab({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute right-0 top-0 rounded-bl-2xl rounded-tr-card bg-blush-50 px-4 py-2 text-xs font-semibold text-blush-700">
      {children}
    </span>
  );
}

const cardShell =
  "group relative flex h-full flex-col rounded-card border border-line bg-paper p-6 shadow-lift " +
  "transition-[transform,translate,scale,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-sage-200 " +
  "hover:shadow-[0_2px_4px_rgb(29_43_35/0.04),0_18px_36px_-16px_rgb(29_43_35/0.18)]";

/** All attempts for one job in a single card: latest date, attempt count, latest score. */
export function InterviewCard({ group, t, locale }: { group: InterviewGroup } & I18n) {
  const { latest, lastScored, attempts, job } = group;
  const live = isLive(latest);
  const showScore = lastScored && !live;
  const status = latest.status;
  const body = live
    ? status === "pending"
      ? t.card.pendingBody
      : t.card.liveBody
    : lastScored?.summary ||
      (status === "abandoned" ? t.card.abandonedBody : status === "scored" ? "" : t.card.scoringBody);

  return (
    <article className={cardShell}>
      <CornerTab>{job?.category ?? t.meta.interview}</CornerTab>
      <JobBadge title={job?.title ?? "Interview"} tone={showScore ? "sage" : "blush"} />
      <h3 className="mt-5 text-xl font-bold leading-snug">{job?.title ?? t.meta.interview}</h3>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-soft">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays className="size-4 text-ink-faint" aria-hidden />
          {fmt(t.card.lastInterview, { date: formatDate(latest.createdAt, locale) })}
        </span>
        {attempts > 1 && (
          <span className="inline-flex items-center gap-1.5">
            <RotateCcw className="size-3.5 text-ink-faint" aria-hidden />
            {fmt(t.card.attempts, { n: attempts })}
          </span>
        )}
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
        {showScore && (
          <span className="inline-flex items-center gap-1.5 text-ink-soft">
            <Sparkles className="size-4 text-sage-500" aria-hidden />
            <span className="tabular">
              <strong className="font-bold text-ink">{lastScored.overall}</strong>/100
            </span>
          </span>
        )}
        {/* With a score on show, only mention the latest attempt when it is still being scored. */}
        {status !== "scored" && (!showScore || status === "completed" || status === "failed") && (
          <Badge tone={live ? "blush" : status === "abandoned" ? "neutral" : "amber"}>{t.status[status]}</Badge>
        )}
      </div>
      {body && <p className="mt-4 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-soft">{body}</p>}
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <SkillChips skills={job?.skills ?? []} t={t} />
        <Link href={groupHref(group)} className={cn(buttonClass(live ? "primary" : "secondary", "sm"), "shrink-0")}>
          {status === "pending" ? t.card.start : live ? t.card.continue : t.card.view}
        </Link>
      </div>
    </article>
  );
}

/** An open role the candidate can interview for. */
export function JobCard({ job, href, t }: { job: Job; href: string } & I18n) {
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
          {fmt(t.card.minInterview, { n: job.durationMinutes })}
        </span>
      </div>
      <p className="mt-4 line-clamp-3 text-[0.9375rem] leading-relaxed text-ink-soft">{job.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-6">
        <SkillChips skills={job.skills} t={t} />
        <Link href={href} className={cn(buttonClass("primary", "sm"), "shrink-0")} aria-label={fmt(t.card.viewRoleAria, { title: job.title })}>
          {t.card.viewRole}
        </Link>
      </div>
      <span className="sr-only">{fmt(t.card.levelSr, { level: t.level[job.level] })}</span>
    </article>
  );
}
