import Link from "next/link";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/admin-bits";
import { ApiError, apiServer, currentUser } from "@/lib/api-server";
import type { Job, Question } from "@/lib/types";
import { JobForm } from "../job-form";

export const metadata = { title: "Edit job" };

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: { job: Job; questions: Question[] };
  try {
    data = await apiServer(`/api/v1/admin/jobs/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const user = await currentUser();
  return (
    <>
      <Link href="/admin/jobs" className="text-sm font-medium text-ink-soft hover:text-ink">
        ← Jobs
      </Link>
      <div className="mt-4">
        <PageTitle title={data.job.title}>
          {data.job.status === "open" ? (
            <Link href={`/jobs/${data.job.slug}`} className="text-sage-700 hover:underline">
              View on the job board
            </Link>
          ) : (
            "Not visible to candidates."
          )}
        </PageTitle>
      </div>
      <JobForm job={data.job} questions={data.questions} canDelete={user?.role === "admin"} />
    </>
  );
}
