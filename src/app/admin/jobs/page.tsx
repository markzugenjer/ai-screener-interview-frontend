import { Plus } from "lucide-react";
import Link from "next/link";

import { PageTitle } from "@/components/admin-bits";
import { Badge, EmptyState, LinkButton } from "@/components/ui";
import { apiServer } from "@/lib/api-server";
import { formatDate, levelLabel } from "@/lib/format";
import type { Job } from "@/lib/types";

export const metadata = { title: "Jobs" };

const statusTone = { open: "sage", draft: "neutral", closed: "blush" } as const;
const statusText = { open: "Open", draft: "Draft", closed: "Closed" } as const;

export default async function JobsPage() {
  const { jobs } = await apiServer<{ jobs: Job[] }>("/api/v1/admin/jobs");
  return (
    <>
      <PageTitle
        title="Jobs"
        action={
          <LinkButton href="/admin/jobs/new">
            <Plus className="size-4" aria-hidden /> New job
          </LinkButton>
        }
      >
        Open jobs appear on the job board. Each needs at least 3 interview questions.
      </PageTitle>
      {jobs.length === 0 ? (
        <EmptyState title="No jobs yet" action={<LinkButton href="/admin/jobs/new">Create the first job</LinkButton>}>
          Add a role, its question bank and how answers are weighted.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-card border border-line bg-paper">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/admin/jobs/${j.id}`} className="flex flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 hover:bg-mist">
                <div className="min-w-56 flex-1">
                  <p className="font-semibold">{j.title}</p>
                  <p className="text-sm text-ink-faint">
                    {j.division}, {levelLabel[j.level]}, updated {formatDate(j.updatedAt)}
                  </p>
                </div>
                <span className="text-sm text-ink-soft tabular">{j.questionCount} questions</span>
                <Badge tone={statusTone[j.status]}>{statusText[j.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
