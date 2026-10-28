import type { Metadata } from "next";

import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/api-server";
import { AdminNav } from "./admin-nav";

export const metadata: Metadata = { title: { default: "Recruiter area", template: "%s · Recruiter · Nara" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireStaff("/admin");
  return (
    <>
      <SiteHeader user={user} />
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[13rem_1fr] lg:gap-10">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <AdminNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </>
  );
}
