import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { getI18n } from "@/i18n/server";
import { requireStaff } from "@/lib/api-server";
import { AdminNav } from "./admin-nav";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return { title: { default: t.meta.recruiter, template: `%s · ${t.meta.recruiter} · Dicy Talks` }, robots: { index: false } };
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff("/admin");
  return (
    <>
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminNav />
        </aside>
        <div className="isolate min-w-0">{children}</div>
      </div>
    </>
  );
}
