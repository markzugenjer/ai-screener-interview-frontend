import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "@/components/admin-bits";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Badge, EmptyState, LinkButton } from "@/components/ui";
import { fmt, formatDate } from "@/i18n/format";
import { getI18n } from "@/i18n/server";
import { apiServer } from "@/lib/api-server";
import type { Job } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.jobs };
}

const statusTone = { open: "sage", draft: "neutral", closed: "blush" } as const;

export default async function JobsPage() {
  const [{ t, locale }, { jobs }] = await Promise.all([getI18n(), apiServer<{ jobs: Job[] }>("/api/v1/admin/jobs")]);
  const a = t.admin;
  return (
    <>
      <PageTitle
        title={a.jobs}
        action={
          <LinkButton href="/admin/jobs/new">
            <Plus className="size-4" aria-hidden /> {a.newJob}
          </LinkButton>
        }
      >
        {a.jobsLead}
      </PageTitle>
      {jobs.length === 0 ? (
        <Reveal>
          <EmptyState title={a.noJobs} action={<LinkButton href="/admin/jobs/new">{a.createFirst}</LinkButton>}>
            {a.noJobsBody}
          </EmptyState>
        </Reveal>
      ) : (
        <Stagger as="ul" className="divide-y divide-line overflow-hidden rounded-card border border-line bg-paper">
          {jobs.map((j) => (
            <StaggerItem as="li" key={j.id}>
              <Link href={`/admin/jobs/${j.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 transition-colors hover:bg-mist">
                <div className="min-w-56 flex-1">
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-sm text-ink-faint">
                    {fmt(a.jobMeta, { division: j.division, level: t.level[j.level], date: formatDate(j.updatedAt, locale) })}
                  </p>
                </div>
                <span className="text-sm text-ink-soft tabular">{fmt(a.questionsCount, { n: j.questionCount })}</span>
                <Badge tone={statusTone[j.status]}>{a.jobStatus[j.status]}</Badge>
              </Link>
            </StaggerItem>
          ))}
        </Stagger>
      )}
    </>
  );
}
