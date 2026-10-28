import type { Metadata } from "next";
import Link from "next/link";

import { PageTitle } from "@/components/admin-bits";
import { getI18n } from "@/i18n/server";
import { JobForm } from "../job-form";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.newJob };
}

export default async function NewJobPage() {
  const { t } = await getI18n();
  return (
    <>
      <Link href="/admin/jobs" className="text-sm font-medium text-ink-soft hover:text-ink">
        {t.admin.backToJobs}
      </Link>
      <div className="mt-4">
        <PageTitle title={t.admin.newJob}>{t.admin.newJobLead}</PageTitle>
      </div>
      <JobForm />
    </>
  );
}
