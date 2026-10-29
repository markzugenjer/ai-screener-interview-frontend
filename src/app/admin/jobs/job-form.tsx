"use client";

import { ChevronDown, ChevronUp, Languages, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { localeNames, type Locale } from "@/i18n/config";
import { fmt } from "@/i18n/format";
import { ClientApiError, api } from "@/lib/api-client";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/format";
import type { Job, JobText, Question, Weights } from "@/lib/types";

type Q = Omit<Question, "jobId" | "sort"> & { key: string };

const defaultWeights: Weights = { technical: 40, problemSolving: 20, communication: 20, speech: 10, motivation: 10 };
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
let counter = 0;
const newKey = () => `q${++counter}`;

// Public job text per language, as edited in the form (requirements as one-per-line text).
type FormText = Omit<JobText, "requirements"> & { requirements: string };
const LANGS: Locale[] = ["id", "en"];
const otherOf = (l: Locale): Locale => (l === "id" ? "en" : "id");
const blankText: FormText = { title: "", division: "", category: "", location: "", employmentType: "", description: "", requirements: "" };
const toForm = (t?: Partial<JobText>): FormText => ({
  title: t?.title ?? "",
  division: t?.division ?? "",
  category: t?.category ?? "",
  location: t?.location ?? "",
  employmentType: t?.employmentType ?? "",
  description: t?.description ?? "",
  requirements: (t?.requirements ?? []).join("\n"),
});
const fromForm = (t: FormText): JobText => ({ ...t, requirements: lines(t.requirements) });
const hasText = (t: FormText) => Boolean((t.title + t.description + t.requirements).trim());

/** The job's text in both languages: the original plus its translation (if any). */
function initialTexts(job?: Job): { source: Locale; texts: Record<Locale, FormText> } {
  if (!job) {
    return {
      source: "id",
      texts: { id: { ...blankText, division: "Engineering", category: "Technical", employmentType: "Full-time" }, en: blankText },
    };
  }
  const source = job.sourceLang ?? "id";
  const other = otherOf(source);
  return {
    source,
    texts: { [source]: toForm(job), [other]: toForm(job.translations?.[other]) } as Record<Locale, FormText>,
  };
}

export function JobForm({
  job,
  questions,
  canDelete,
  createdNotice,
}: {
  job?: Job;
  questions?: Question[];
  canDelete?: boolean;
  /** After creating a job: "translated" or "missing", from the URL. */
  createdNotice?: string;
}) {
  const { t } = useI18n();
  const f = t.jobForm;
  const router = useRouter();
  const [weights, setWeights] = useState<Weights>(job?.weights ?? defaultWeights);
  const [qs, setQs] = useState<Q[]>((questions ?? []).map((q) => ({ ...q, key: newKey() })));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [{ source, texts }, setDoc] = useState(() => initialTexts(job));
  const [lang, setLang] = useState<Locale>(source);
  const [translating, setTranslating] = useState(false);
  const [notice, setNotice] = useState(() => {
    if (!job || !createdNotice) return "";
    const otherName = localeNames[otherOf(job.sourceLang ?? "id")];
    return fmt(createdNotice === "translated" ? f.autoTranslated : f.missingTranslation, { lang: otherName });
  });
  const text = texts[lang];
  const setField = (key: keyof FormText, value: string) =>
    setDoc((d) => ({ ...d, texts: { ...d.texts, [lang]: { ...d.texts[lang], [key]: value } } }));

  async function translateNow() {
    const to = otherOf(lang);
    setNotice("");
    setFormError("");
    if (!hasText(text)) {
      setFormError(f.translateEmpty);
      return;
    }
    setTranslating(true);
    try {
      const res = await api<{ text: JobText }>("POST", "/admin/jobs/translate", { from: lang, to, text: fromForm(text) });
      setDoc((d) => ({ ...d, texts: { ...d.texts, [to]: toForm(res.text) } }));
      setLang(to);
      setNotice(fmt(f.translateFilled, { from: localeNames[lang] }));
    } catch (err) {
      setFormError(errorMessage(err, t, f.saveError));
    } finally {
      setTranslating(false);
    }
  }
  const total = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0);

  const weightLabels: { key: keyof Weights; label: string }[] = [
    { key: "technical", label: t.dimensions.technical },
    { key: "problemSolving", label: t.dimensions.problemSolving },
    { key: "communication", label: t.dimensions.communication },
    { key: "speech", label: t.dimensions.speech },
    { key: "motivation", label: t.dimensions.motivation },
  ];

  function update(i: number, patch: Partial<Q>) {
    setQs((list) => list.map((q, j) => (j === i ? { ...q, ...patch } : q)));
  }
  function move(i: number, dir: -1 | 1) {
    setQs((list) => {
      const next = [...list];
      const [item] = next.splice(i, 1);
      next.splice(i + dir, 0, item!);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    // The original is the language the job was written in; if only the other tab
    // was filled in, that one becomes the original.
    let src = source;
    if (!hasText(texts[src]) && hasText(texts[otherOf(src)])) src = otherOf(src);
    const base = fromForm(texts[src]);
    const other = otherOf(src);
    const body = {
      ...base,
      sourceLang: src,
      translations: hasText(texts[other]) ? { [other]: fromForm(texts[other]) } : {},
      level: String(fd.get("level") ?? "junior"),
      skills: String(fd.get("skills") ?? "")
        .split(",")
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean),
      durationMinutes: Number(fd.get("durationMinutes") ?? 20),
      status: String(fd.get("status") ?? "draft"),
      weights,
      questions: qs.map((q) => ({
        id: q.id,
        skill: q.skill,
        difficulty: q.difficulty,
        type: q.type,
        text: q.text,
        expectedPoints: q.expectedPoints,
        followUps: q.followUps,
      })),
    };
    if (total !== 100) {
      setErrors({ weights: fmt(f.weightsSum, { n: total }) });
      return;
    }
    setBusy(true);
    setErrors({});
    setFormError("");
    setSaved(false);
    setNotice("");
    try {
      const res = await api<{ job: Job; translated?: string[] }>(job ? "PUT" : "POST", job ? `/admin/jobs/${job.id}` : "/admin/jobs", body);
      setSaved(true);
      setDoc(initialTexts(res.job));
      const otherName = localeNames[otherOf(res.job.sourceLang ?? src)];
      const kind = res.translated?.length ? "translated" : res.job.translations?.[otherOf(res.job.sourceLang ?? src)] ? "" : "missing";
      if (kind) setNotice(fmt(kind === "translated" ? f.autoTranslated : f.missingTranslation, { lang: otherName }));
      if (!job) router.replace(`/admin/jobs/${res.job.id}${kind ? `?created=${kind}` : ""}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
        setFormError(f.needsAttention);
      } else setFormError(errorMessage(err, t, f.saveError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <section className="space-y-5 rounded-card border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold">{f.role}</h2>
          <div className="flex flex-wrap items-center gap-2">
            <div role="tablist" aria-label={f.textLanguage} className="inline-flex rounded-full bg-mist p-1">
              {LANGS.map((l) => (
                <button
                  key={l}
                  type="button"
                  role="tab"
                  aria-selected={lang === l}
                  onClick={() => setLang(l)}
                  className={cn(
                    "inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold",
                    lang === l ? "bg-paper text-ink shadow-sm" : "text-ink-soft hover:text-ink",
                  )}
                >
                  {localeNames[l]}
                  {l === source ? (
                    <span className="rounded-full bg-sage-100 px-1.5 py-0.5 text-[0.6875rem] font-bold text-sage-700">{f.original}</span>
                  ) : (
                    !hasText(texts[l]) && <span className="size-1.5 rounded-full bg-blush-400" title={f.notTranslated} aria-label={f.notTranslated} />
                  )}
                </button>
              ))}
            </div>
            <Button type="button" variant="secondary" size="sm" loading={translating} onClick={translateNow}>
              {!translating && <Languages className="size-4" aria-hidden />}
              {translating ? f.translating : fmt(f.translateTo, { lang: localeNames[otherOf(lang)] })}
            </Button>
          </div>
        </div>
        <p className="-mt-2 text-sm text-ink-soft">{f.langHint}</p>
        {notice && <Alert tone="sage">{notice}</Alert>}
        <Field label={f.title} htmlFor="title" error={lang === source ? errors.title : undefined}>
          <Input
            id="title"
            lang={lang}
            value={text.title}
            onChange={(e) => setField("title", e.target.value)}
            required={lang === source}
            placeholder={f.titlePlaceholder}
            invalid={lang === source && !!errors.title}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label={f.division} htmlFor="division" error={errors.division}>
            <Input id="division" lang={lang} value={text.division} onChange={(e) => setField("division", e.target.value)} />
          </Field>
          <Field label={f.category} htmlFor="category" hint={f.categoryHint}>
            <Input id="category" lang={lang} value={text.category} onChange={(e) => setField("category", e.target.value)} />
          </Field>
          <Field label={f.level} htmlFor="level" error={errors.level}>
            <Select id="level" name="level" defaultValue={job?.level ?? "junior"}>
              <option value="junior">{t.level.junior}</option>
              <option value="mid">{t.level.mid}</option>
              <option value="senior">{t.level.senior}</option>
            </Select>
          </Field>
          <Field label={f.status} htmlFor="status" error={errors.status}>
            <Select id="status" name="status" defaultValue={job?.status ?? "draft"}>
              <option value="draft">{f.statusDraft}</option>
              <option value="open">{f.statusOpen}</option>
              <option value="closed">{f.statusClosed}</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label={f.location} htmlFor="location">
            <Input id="location" lang={lang} value={text.location} onChange={(e) => setField("location", e.target.value)} placeholder={f.locationPlaceholder} />
          </Field>
          <Field label={f.employmentType} htmlFor="employmentType">
            <Input id="employmentType" lang={lang} value={text.employmentType} onChange={(e) => setField("employmentType", e.target.value)} />
          </Field>
          <Field label={f.length} htmlFor="durationMinutes" error={errors.durationMinutes}>
            <Input id="durationMinutes" name="durationMinutes" type="number" min={5} max={60} defaultValue={job?.durationMinutes ?? 20} />
          </Field>
        </div>
        <Field label={f.description} htmlFor="description" error={errors.description}>
          <Textarea id="description" lang={lang} value={text.description} onChange={(e) => setField("description", e.target.value)} rows={4} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label={f.requirements} htmlFor="requirements" hint={f.oneperline} error={errors.requirements ?? errors[`translations.${lang}`]}>
            <Textarea id="requirements" lang={lang} value={text.requirements} onChange={(e) => setField("requirements", e.target.value)} rows={5} />
          </Field>
          <Field label={f.skills} htmlFor="skills" hint={f.skillsHint} error={errors.skills}>
            <Input id="skills" name="skills" defaultValue={job?.skills.join(", ")} />
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">{f.weights}</h2>
          <motion.span
            key={total === 100 ? "ok" : "bad"}
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            className={cn("tabular text-sm font-semibold", total === 100 ? "text-sage-700" : "text-danger")}
          >
            {fmt(f.total, { n: total })}
          </motion.span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{f.weightsLead}</p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {weightLabels.map(({ key, label }) => (
            <Field key={key} label={label} htmlFor={`w-${key}`}>
              <Input
                id={`w-${key}`}
                type="number"
                min={0}
                max={100}
                value={weights[key]}
                onChange={(e) => setWeights((w) => ({ ...w, [key]: Number(e.target.value) }))}
                className="tabular"
              />
            </Field>
          ))}
        </div>
        {errors.weights && <p className="mt-3 text-sm text-danger">{errors.weights}</p>}
      </section>

      <section className="rounded-card border border-line bg-paper p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold">{f.bank}</h2>
            <p className="mt-1 text-sm text-ink-soft">{f.bankLead}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setQs((l) => [...l, { key: newKey(), id: "", skill: "", difficulty: 1, type: "technical", text: "", expectedPoints: [], followUps: [] }])
            }
          >
            <Plus className="size-4" aria-hidden /> {f.addQuestion}
          </Button>
        </div>
        {errors.questions && <p className="mt-3 text-sm text-danger">{errors.questions}</p>}
        <ol className="mt-5 space-y-4">
          <AnimatePresence initial={false}>
            {qs.map((q, i) => (
              <motion.li
                key={q.key}
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 380, damping: 32 }}
                className={cn("rounded-2xl border bg-mist/60 p-4", errors[`questions.${i}`] ? "border-danger" : "border-line")}
              >
                <div className="flex flex-wrap items-center gap-3">
                  <span className="tabular text-sm font-bold text-ink-faint">{i + 1}</span>
                  <span className="w-44">
                    <Input aria-label={f.skill} placeholder={f.skillPlaceholder} value={q.skill} onChange={(e) => update(i, { skill: e.target.value })} className="h-9" />
                  </span>
                  <span className="w-36">
                    <Select aria-label={f.type} value={q.type} onChange={(e) => update(i, { type: e.target.value as Q["type"] })} className="h-9">
                      <option value="technical">{f.typeTechnical}</option>
                      <option value="scenario">{f.typeScenario}</option>
                      <option value="soft">{f.typeSoft}</option>
                    </Select>
                  </span>
                  <span className="w-36">
                    <Select
                      aria-label={f.difficulty}
                      value={q.difficulty}
                      onChange={(e) => update(i, { difficulty: Number(e.target.value) as Q["difficulty"] })}
                      className="h-9"
                    >
                      <option value={1}>{f.basic}</option>
                      <option value={2}>{f.intermediate}</option>
                      <option value={3}>{f.advanced}</option>
                    </Select>
                  </span>
                  <div className="ml-auto flex gap-1">
                    <IconBtn label={f.moveUp} disabled={i === 0} onClick={() => move(i, -1)}>
                      <ChevronUp className="size-4" />
                    </IconBtn>
                    <IconBtn label={f.moveDown} disabled={i === qs.length - 1} onClick={() => move(i, 1)}>
                      <ChevronDown className="size-4" />
                    </IconBtn>
                    <IconBtn label={f.remove} onClick={() => setQs((l) => l.filter((_, j) => j !== i))}>
                      <Trash2 className="size-4" />
                    </IconBtn>
                  </div>
                </div>
                <Textarea
                  aria-label={f.question}
                  placeholder={f.questionPlaceholder}
                  value={q.text}
                  onChange={(e) => update(i, { text: e.target.value })}
                  className="mt-3 min-h-16"
                />
                <div className="mt-3 grid gap-3 md:grid-cols-2">
                  <Textarea
                    aria-label={f.expectedAria}
                    placeholder={f.expected}
                    defaultValue={q.expectedPoints.join("\n")}
                    onChange={(e) => update(i, { expectedPoints: lines(e.target.value) })}
                    className="min-h-20 text-sm"
                  />
                  <Textarea
                    aria-label={f.followUpsAria}
                    placeholder={f.followUps}
                    defaultValue={q.followUps.join("\n")}
                    onChange={(e) => update(i, { followUps: lines(e.target.value) })}
                    className="min-h-20 text-sm"
                  />
                </div>
                {errors[`questions.${i}`] && <p className="mt-2 text-sm text-danger">{errors[`questions.${i}`]}</p>}
              </motion.li>
            ))}
          </AnimatePresence>
        </ol>
        {qs.length === 0 && <p className="mt-5 text-sm text-ink-faint">{f.noQuestions}</p>}
      </section>

      {formError && <Alert>{formError}</Alert>}
      <AnimatePresence>
        {saved && (
          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <Alert tone="sage">{f.saved}</Alert>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={busy}>
          {job ? f.save : f.create}
        </Button>
        {job && canDelete && (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden /> {f.delete}
          </Button>
        )}
      </div>

      {job && (
        <ConfirmDialog
          open={confirmDelete}
          title={f.deleteTitle}
          confirmLabel={f.delete}
          tone="danger"
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await api("DELETE", `/admin/jobs/${job.id}`);
            router.replace("/admin/jobs");
            router.refresh();
          }}
        >
          {fmt(f.deleteBody, { title: job.title })}
        </ConfirmDialog>
      )}
    </form>
  );
}

function IconBtn({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid size-9 place-items-center rounded-full text-ink-faint transition-[background-color,color,transform,translate,scale] hover:bg-paper hover:text-ink active:scale-90 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
