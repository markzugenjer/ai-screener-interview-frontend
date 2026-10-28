import type { Metadata } from "next";

import { InterviewCard, JobCard } from "@/components/cards";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, LinkButton } from "@/components/ui";
import { apiServer, requireUser } from "@/lib/api-server";
import type { Interview, Job } from "@/lib/types";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Dashboard() {
  const user = await requireUser("/dashboard");
  const [{ jobs }, { interviews }] = await Promise.all([
    apiServer<{ jobs: Job[] }>("/api/v1/jobs"),
    apiServer<{ interviews: Interview[] }>("/api/v1/me/interviews"),
  ]);
  const first = user.fullName.split(" ")[0];

  return (
    <>
      <SiteHeader user={user} />
      <main className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
        <h1 className="text-[2rem] font-extrabold">Hi {first}</h1>
        <p className="mt-1.5 text-ink-soft">
          {interviews.length > 0 ? "Pick up a role below or review your past interviews." : "Choose a role to start your first interview."}
        </p>

        <section id="interviews" className="mt-12 scroll-mt-20" aria-labelledby="interviews-title">
          <h2 id="interviews-title" className="text-xl font-bold">
            Your interviews
          </h2>
          {interviews.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No interviews yet" action={<LinkButton href="#jobs" variant="secondary">Browse open roles</LinkButton>}>
                When you finish an interview, your score and feedback appear here.
              </EmptyState>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {interviews.map((iv) => (
                <InterviewCard key={iv.id} interview={iv} />
              ))}
            </div>
          )}
        </section>

        <section id="jobs" className="mt-14 scroll-mt-20" aria-labelledby="jobs-title">
          <h2 id="jobs-title" className="text-xl font-bold">
            Open roles
          </h2>
          {jobs.length === 0 ? (
            <div className="mt-5">
              <EmptyState title="No open roles right now">New roles are added every week.</EmptyState>
            </div>
          ) : (
            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} href={`/jobs/${job.slug}`} />
              ))}
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
