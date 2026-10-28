import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/ui";
import { notFound } from "next/navigation";

import { PageTitle } from "@/components/admin-bits";
import { getI18n } from "@/i18n/server";
import { ApiError, apiServer, currentUser } from "@/lib/api-server";
import type { Job, Question } from "@/lib/types";
import { JobForm } from "../job-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.editJob };
}

export default async function EditJobPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data: { job: Job; questions: Question[] };
  try {
    data = await apiServer(`/api/v1/admin/jobs/${encodeURIComponent(id)}`);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  const [user, { t }] = await Promise.all([currentUser(), getI18n()]);
  return (
    <>
      <BackLink href="/admin/jobs">{t.admin.backToJobs}</BackLink>
      <div className="mt-4">
        <PageTitle title={data.job.title}>
          {data.job.status === "open" ? (
            <Link href={`/jobs/${data.job.slug}`} className="text-sage-700 underline decoration-transparent hover:decoration-current">
              {t.admin.viewOnBoard}
            </Link>
          ) : (
            t.admin.notVisible
          )}
        </PageTitle>
      </div>
      <JobForm job={data.job} questions={data.questions} canDelete={user?.role === "admin"} />
    </>
  );
}
