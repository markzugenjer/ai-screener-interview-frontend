"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button, Input, Select } from "@/components/ui";
import type { Job } from "@/lib/types";

/** Filter bar. Every change updates the URL, so filtered views can be bookmarked and shared. */
export function ResultFilters({ jobs }: { jobs: Job[] }) {
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
          <Input name="q" defaultValue={v("q")} placeholder="Search by name, email or words they said" className="pl-10" aria-label="Search candidates" />
        </div>
        <Select name="sort" defaultValue={v("sort") || "-date"} aria-label="Sort">
          <option value="-date">Newest first</option>
          <option value="-overall">Highest score</option>
          <option value="overall">Lowest score</option>
          <option value="date">Oldest first</option>
        </Select>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Select name="jobId" defaultValue={v("jobId")} aria-label="Job">
          <option value="">All jobs</option>
          {jobs.map((j) => (
            <option key={j.id} value={j.id}>
              {j.title}
            </option>
          ))}
        </Select>
        <Select name="recommendation" defaultValue={v("recommendation")} aria-label="AI recommendation">
          <option value="">Any AI rating</option>
          <option value="strong_yes">Strong yes</option>
          <option value="yes">Yes</option>
          <option value="maybe">Maybe</option>
          <option value="no">Not recommended</option>
        </Select>
        <Select name="decision" defaultValue={v("decision")} aria-label="Your decision">
          <option value="">Any decision</option>
          <option value="none">To review</option>
          <option value="shortlist">Shortlisted</option>
          <option value="hold">On hold</option>
          <option value="reject">Rejected</option>
        </Select>
        <Select name="status" defaultValue={v("status")} aria-label="Status">
          <option value="">Any status</option>
          <option value="scored">Scored</option>
          <option value="completed">Scoring</option>
          <option value="in_progress">In progress</option>
          <option value="failed">Scoring failed</option>
          <option value="abandoned">Left early</option>
        </Select>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink-soft">
          Min. overall
          <span className="w-20">
            <Input name="minOverall" type="number" min={0} max={100} step={5} defaultValue={v("minOverall") || "0"} className="h-10 tabular" />
          </span>
        </label>
        <label className="inline-flex items-center gap-2 whitespace-nowrap text-sm font-medium text-ink-soft">
          Min. technical
          <span className="w-32">
            <Select name="minTechnical" defaultValue={v("minTechnical")} className="h-10">
              <option value="">Any</option>
              <option value="3">3+ of 5</option>
              <option value="4">4+ of 5</option>
              <option value="4.5">4.5+ of 5</option>
            </Select>
          </span>
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft">
          <input type="checkbox" name="practice" value="true" defaultChecked={v("practice") === "true"} className="size-4 accent-sage-600" />
          Include practice attempts
        </label>
        <Button type="submit" variant="secondary" size="sm" className="ml-auto" loading={pending}>
          {!pending && <SlidersHorizontal className="size-4" aria-hidden />}
          Apply
        </Button>
      </div>
    </form>
  );
}
