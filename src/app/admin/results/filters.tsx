"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button, Input, Select } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
import type { Job } from "@/lib/types";

/** Filter bar. Every change updates the URL, so filtered views can be bookmarked and shared. */
export function ResultFilters({ jobs }: { jobs: Job[] }) {
  const { t } = useI18n();
  const a = t.admin;
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  function apply(form: HTMLFormElement) {
    const fd = new FormData(form);
    const qs = new URLSearchParams();
    for (const [k, v] of fd.entries()) {
      const s = String(v).trim();
      if (s && !(k === "minOverall" && s === "0")) qs.set(k, s);
    }
    startTransition(() => router.replace(`${pathname}?${qs.toString()}`, { scroll: false }));
  }

  const v = (k: string) => params.get(k) ?? "";

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        apply(e.currentTarget);
      }}
      onChange={(e) => {
        // Selects and checkboxes apply immediately; text and number inputs wait for Enter or Apply.
        const target = e.target as unknown as HTMLInputElement;
        if (target.tagName !== "INPUT" || target.type === "checkbox") apply(e.currentTarget);
      }}
      className="rounded-card border border-line bg-mist p-4"
      aria-busy={pending}
    >
      <div className="grid gap-3 md:grid-cols-[1fr_12rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" aria-hidden />
          <Input name="q" defaultValue={v("q")} placeholder={a.search} className="pl-10" aria-label={a.searchAria} />
        </div>
        <Select name="sort" defaultValue={v("sort") || "-date"} aria-label={a.sortAria}>
          <option value="-date">{a.sortNewest}</option>
          <option value="-overall">{a.sortHighest}</option>
          <option value="overall">{a.sortLowest}</option>
          <option value="date">{a.sortOldest}</option>
        </Select>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select name="jobId" defaultValue={v("jobId")} aria-label={a.jobAria}>
          <option value="">{a.allJobs}</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </Select>
        <Select name="recommendation" defaultValue={v("recommendation")} aria-label={a.recommendationAria}>
          <option value="">{a.anyRecommendation}</option>
          <option value="strong_yes">{t.recommendation.strong_yes}</option>
          <option value="yes">{t.recommendation.yes}</option>
          <option value="maybe">{t.recommendation.maybe}</option>
          <option value="no">{t.recommendation.no}</option>
        </Select>
        <Select name="decision" defaultValue={v("decision")} aria-label={a.decisionAria}>
          <option value="">{a.anyDecision}</option>
          <option value="none">{t.decision.none}</option>
          <option value="shortlist">{t.decision.shortlist}</option>
          <option value="hold">{t.decision.hold}</option>
          <option value="reject">{t.decision.reject}</option>
        </Select>
        <Select name="status" defaultValue={v("status")} aria-label={a.statusAria}>
          <option value="">{a.anyStatus}</option>
          <option value="scored">{t.status.scoredShort}</option>
          <option value="completed">{t.status.completed}</option>
          <option value="in_progress">{t.status.in_progress}</option>
          <option value="failed">{a.statusFailed}</option>
          <option value="abandoned">{t.status.abandoned}</option>
        </Select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink-soft">
          {a.minOverall}
          <span className="w-20">
            <Input name="minOverall" type="number" min={0} max={100} step={5} defaultValue={v("minOverall") || "0"} className="h-10 tabular" />
          </span>
        </label>
        <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink-soft">
          {a.minTechnical}
          <span className="w-32">
            <Select name="minTechnical" defaultValue={v("minTechnical")} className="h-10">
              <option value="">{a.any}</option>
              <option value="3">{fmt(a.ofFive, { n: 3 })}</option>
              <option value="4">{fmt(a.ofFive, { n: 4 })}</option>
              <option value="4.5">{fmt(a.ofFive, { n: 4.5 })}</option>
            </Select>
          </span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
          <input type="checkbox" name="practice" value="true" defaultChecked={v("practice") === "true"} className="size-4 accent-sage-600" />
          {a.includePractice}
        </label>
        <Button type="submit" variant="secondary" size="sm" className="ml-auto" loading={pending}>
          {!pending && <SlidersHorizontal className="size-4" aria-hidden />}
          {a.apply}
        </Button>
      </div>
    </form>
  );
}
