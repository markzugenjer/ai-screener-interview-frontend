import Link from "next/link";

import { PageTitle } from "@/components/admin-bits";
import { JobForm } from "../job-form";

export const metadata = { title: "New job" };

export default function NewJobPage() {
  return (
    <>
      <Link href="/admin/jobs" className="text-sm font-medium text-ink-soft hover:text-ink">
        ← Jobs
      </Link>
      <div className="mt-4">
        <PageTitle title="New job">Save as a draft first if you&apos;re still writing questions.</PageTitle>
      </div>
      <JobForm />
    </>
  );
}
