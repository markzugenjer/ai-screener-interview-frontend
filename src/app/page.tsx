import { JobCard } from "@/components/cards";
import { HeroDemo } from "@/components/hero-demo";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { EmptyState, LinkButton } from "@/components/ui";
import { apiServer, currentUser } from "@/lib/api-server";
import type { Job } from "@/lib/types";

async function openJobs(): Promise<Job[] | null> {
  try {
    return (await apiServer<{ jobs: Job[] }>("/api/v1/jobs")).jobs;
  } catch {
    return null;
  }
}

const steps = [
  { title: "Create your account", body: "Add your name, WhatsApp number and resume. It takes about two minutes." },
  { title: "Talk with Nara", body: "A 15–20 minute voice interview in Bahasa Indonesia. Use a quiet room and headphones if you have them." },
  { title: "Read your feedback", body: "See your scores, what went well and what to practise. A recruiter reviews every result." },
];

export default async function Home() {
  const [user, jobs] = await Promise.all([currentUser().catch(() => null), openJobs()]);

  return (
    <>
      <SiteHeader user={user} />
      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 md:grid-cols-[1.05fr_1fr] md:pt-20">
          <div>
            <h1 className="text-[2.5rem] font-extrabold leading-[1.05] sm:text-[3.25rem]">
              Your first interview, whenever you&apos;re ready.
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-ink-soft">
              Talk with Nara, our AI interviewer, in Bahasa Indonesia. About 20 minutes from wherever you are, with
              feedback as soon as you finish.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <LinkButton href={user ? "/dashboard" : "/register"} size="lg">
                {user ? "Go to my dashboard" : "Create an account"}
              </LinkButton>
              <LinkButton href="#jobs" variant="secondary" size="lg">
                See open roles
              </LinkButton>
            </div>
          </div>
          <HeroDemo />
        </section>

        <section id="jobs" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-[1.75rem] font-bold">Open roles</h2>
              <p className="mt-1 text-ink-soft">We&apos;re starting with programmers. More divisions are coming.</p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {jobs?.map((job) => <JobCard key={job.id} job={job} href={`/jobs/${job.slug}`} />)}
          </div>
          {jobs?.length === 0 && <EmptyState title="No open roles right now">Check back soon — new roles are added every week.</EmptyState>}
          {jobs === null && (
            <EmptyState title="Roles couldn't be loaded">The server didn&apos;t respond. Refresh the page in a moment.</EmptyState>
          )}
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <h2 className="text-[1.75rem] font-bold">How it works</h2>
          <ol className="mt-8 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s.title} className="rounded-card bg-mist p-6">
                <span className="grid size-9 place-items-center rounded-full bg-paper text-sm font-bold text-sage-700 tabular">
                  {i + 1}
                </span>
                <h3 className="mt-4 text-lg font-bold">{s.title}</h3>
                <p className="mt-1.5 leading-relaxed text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
