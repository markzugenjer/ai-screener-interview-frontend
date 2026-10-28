import type { Metadata } from "next";
import Link from "next/link";

import { BackLink } from "@/components/ui";

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
      <BackLink href="/admin/jobs">{t.admin.backToJobs}</BackLink>
      <div className="mt-4">
        <PageTitle title={t.admin.newJob}>{t.admin.newJobLead}</PageTitle>
      </div>
      <JobForm />
    </>
  );
}
