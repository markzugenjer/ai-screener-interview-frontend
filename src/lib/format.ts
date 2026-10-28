// Language-independent helpers. Translated labels live in src/i18n/dictionaries;
// date formatting lives in src/i18n/format.ts.

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Two letters for the job badge, e.g. "Junior Frontend Developer" -> "FE". */
export function monogram(title: string): string {
  const known: Record<string, string> = { frontend: "FE", backend: "BE", fullstack: "FS", mobile: "MB", data: "DA", devops: "DO", design: "UX", qa: "QA" };
  const words = title.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean);
  for (const w of words) if (known[w]) return known[w];
  const meaningful = words.filter((w) => !["junior", "senior", "mid", "the", "and", "of"].includes(w));
  return (meaningful.slice(0, 2).map((w) => w[0]).join("") || "JB").toUpperCase();
}

export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
