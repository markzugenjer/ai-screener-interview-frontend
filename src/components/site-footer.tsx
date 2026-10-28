import { ShieldCheck } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="inline-flex items-center gap-2">
          <ShieldCheck className="size-4 text-sage-500" aria-hidden />
          Your WhatsApp number and resume are encrypted. Recruiters make every hiring decision.
        </p>
        <p>© {new Date().getFullYear()} Nara AI Screening</p>
      </div>
    </footer>
  );
}
