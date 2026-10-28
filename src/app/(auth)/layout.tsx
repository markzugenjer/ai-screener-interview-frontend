import { Brand } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh bg-mist lg:grid-cols-[1fr_minmax(0,34rem)]">
      <aside className="relative hidden overflow-hidden bg-sage-100 p-12 lg:flex lg:flex-col">
        <Brand />
        <div className="mt-auto max-w-md">
          <p className="text-[2rem] font-extrabold leading-tight text-sage-700">
            Answer in your own words. Nara listens, then a recruiter decides.
          </p>
          <p className="mt-4 leading-relaxed text-sage-700/80">
            The AI only screens. Every result is reviewed by a person before anyone is invited or turned down.
          </p>
        </div>
        <span aria-hidden className="absolute -right-24 -top-24 size-80 rounded-full bg-blush-100" />
        <span aria-hidden className="absolute -right-6 top-40 size-24 rounded-full bg-blush-200/70" />
      </aside>
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Brand />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
