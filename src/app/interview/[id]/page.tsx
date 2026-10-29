import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { getI18n, getLocale } from "@/i18n/server";
import { ApiError, apiServer, requireUser } from "@/lib/api-server";
import type { Interview } from "@/lib/types";
import { InterviewRoom } from "./room";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: t.meta.interview, robots: { index: false } };
}

export default async function InterviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireUser(`/interview/${id}`);
  let interview: Interview;
  try {
    interview = (await apiServer<{ interview: Interview }>(`/api/v1/interviews/${encodeURIComponent(id)}?lang=${await getLocale()}`)).interview;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound();
    throw err;
  }
  if (interview.status !== "pending" && interview.status !== "in_progress") redirect(`/interview/${id}/feedback`);

  return <InterviewRoom interview={interview} firstName={user.fullName.split(" ")[0] ?? "You"} />;
}
