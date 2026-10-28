"use client";

import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { Alert, Button, Field, Input, Select, Textarea } from "@/components/ui";
import { ClientApiError, api } from "@/lib/api-client";
import { cn } from "@/lib/format";
import type { Job, Question, Weights } from "@/lib/types";

type Q = Omit<Question, "jobId" | "sort"> & { key: string };

const weightLabels: { key: keyof Weights; label: string }[] = [
  { key: "technical", label: "Technical knowledge" },
  { key: "problemSolving", label: "Problem solving" },
  { key: "communication", label: "Communication" },
  { key: "speech", label: "Speech delivery" },
  { key: "motivation", label: "Motivation & attitude" },
];

const defaultWeights: Weights = { technical: 40, problemSolving: 20, communication: 20, speech: 10, motivation: 10 };
const lines = (s: string) => s.split("\n").map((l) => l.trim()).filter(Boolean);
let counter = 0;
const newKey = () => `q${++counter}`;

export function JobForm({ job, questions, canDelete }: { job?: Job; questions?: Question[]; canDelete?: boolean }) {
  const router = useRouter();
  const [weights, setWeights] = useState<Weights>(job?.weights ?? defaultWeights);
  const [qs, setQs] = useState<Q[]>(
    (questions ?? []).map((q) => ({ ...q, key: newKey() })),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const total = Object.values(weights).reduce((a, b) => a + (Number(b) || 0), 0);

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
    const body = {
      title: String(fd.get("title") ?? ""),
      division: String(fd.get("division") ?? ""),
      category: String(fd.get("category") ?? ""),
      level: String(fd.get("level") ?? "junior"),
      location: String(fd.get("location") ?? ""),
      employmentType: String(fd.get("employmentType") ?? ""),
      description: String(fd.get("description") ?? ""),
      requirements: lines(String(fd.get("requirements") ?? "")),
      skills: String(fd.get("skills") ?? "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
      durationMinutes: Number(fd.get("durationMinutes") ?? 20),
      status: String(fd.get("status") ?? "draft"),
      weights,
      questions: qs.map((q) => ({ id: q.id, skill: q.skill, difficulty: q.difficulty, type: q.type, text: q.text, expectedPoints: q.expectedPoints, followUps: q.followUps })),
    };
    if (total !== 100) {
      setErrors({ weights: `Weights must add up to 100 (now ${total}).` });
      return;
    }
    setBusy(true);
    setErrors({});
    setFormError("");
    setSaved(false);
    try {
      const res = await api<{ job: Job }>(job ? "PUT" : "POST", job ? `/admin/jobs/${job.id}` : "/admin/jobs", body);
      setSaved(true);
      if (!job) router.replace(`/admin/jobs/${res.job.id}`);
      router.refresh();
    } catch (err) {
      if (err instanceof ClientApiError && Object.keys(err.fields).length) {
        setErrors(err.fields);
        setFormError("Some fields need attention.");
      } else setFormError(err instanceof Error ? err.message : "Couldn't save the job.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8">
      <section className="space-y-5 rounded-card border border-line bg-paper p-6">
        <h2 className="text-lg font-bold">Role</h2>
        <Field label="Job title" htmlFor="title" error={errors.title}>
          <Input id="title" name="title" defaultValue={job?.title} required placeholder="Junior Frontend Developer" invalid={!!errors.title} />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Division" htmlFor="division" error={errors.division}>
            <Input id="division" name="division" defaultValue={job?.division ?? "Engineering"} />
          </Field>
          <Field label="Category" htmlFor="category" hint="Shown on the card tab.">
            <Input id="category" name="category" defaultValue={job?.category ?? "Technical"} />
          </Field>
          <Field label="Level" htmlFor="level" error={errors.level}>
            <Select id="level" name="level" defaultValue={job?.level ?? "junior"}>
              <option value="junior">Junior</option>
              <option value="mid">Mid-level</option>
              <option value="senior">Senior</option>
            </Select>
          </Field>
          <Field label="Status" htmlFor="status" error={errors.status}>
            <Select id="status" name="status" defaultValue={job?.status ?? "draft"}>
              <option value="draft">Draft (hidden)</option>
              <option value="open">Open (on the job board)</option>
              <option value="closed">Closed</option>
            </Select>
          </Field>
        </div>
        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Location" htmlFor="location">
            <Input id="location" name="location" defaultValue={job?.location} placeholder="Yogyakarta (Hybrid)" />
          </Field>
          <Field label="Employment type" htmlFor="employmentType">
            <Input id="employmentType" name="employmentType" defaultValue={job?.employmentType ?? "Full-time"} />
          </Field>
          <Field label="Interview length (minutes)" htmlFor="durationMinutes" error={errors.durationMinutes}>
            <Input id="durationMinutes" name="durationMinutes" type="number" min={5} max={60} defaultValue={job?.durationMinutes ?? 20} />
          </Field>
        </div>
        <Field label="Description" htmlFor="description" error={errors.description}>
          <Textarea id="description" name="description" defaultValue={job?.description} rows={4} />
        </Field>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Requirements" htmlFor="requirements" hint="One per line." error={errors.requirements}>
            <Textarea id="requirements" name="requirements" defaultValue={job?.requirements.join("\n")} rows={5} />
          </Field>
          <Field label="Skill tags" htmlFor="skills" hint="Comma-separated, e.g. react, tailwind, javascript." error={errors.skills}>
            <Input id="skills" name="skills" defaultValue={job?.skills.join(", ")} />
          </Field>
        </div>
      </section>

      <section className="rounded-card border border-line bg-paper p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">Score weights</h2>
          <span className={cn("tabular text-sm font-semibold", total === 100 ? "text-sage-700" : "text-danger")}>Total {total}/100</span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">How much each area counts toward the overall score.</p>
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
            <h2 className="text-lg font-bold">Question bank</h2>
            <p className="mt-1 text-sm text-ink-soft">
              Write questions in Bahasa Indonesia. Nara picks from these, adapting difficulty to each candidate. Expected
              points are never read aloud.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setQs((l) => [...l, { key: newKey(), id: "", skill: "", difficulty: 1, type: "technical", text: "", expectedPoints: [], followUps: [] }])
            }
          >
            <Plus className="size-4" aria-hidden /> Add question
          </Button>
        </div>
        {errors.questions && <p className="mt-3 text-sm text-danger">{errors.questions}</p>}
        <ol className="mt-5 space-y-4">
          {qs.map((q, i) => (
            <li key={q.key} className={cn("rounded-2xl border bg-mist/60 p-4", errors[`questions.${i}`] ? "border-danger" : "border-line")}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="tabular text-sm font-bold text-ink-faint">{i + 1}</span>
                <span className="w-44"><Input aria-label="Skill" placeholder="Skill, e.g. React" value={q.skill} onChange={(e) => update(i, { skill: e.target.value })} className="h-9" /></span>
                <span className="w-36"><Select aria-label="Type" value={q.type} onChange={(e) => update(i, { type: e.target.value as Q["type"] })} className="h-9">
                  <option value="technical">Technical</option>
                  <option value="scenario">Scenario</option>
                  <option value="soft">Soft skill</option>
                </Select></span>
                <span className="w-36"><Select aria-label="Difficulty" value={q.difficulty} onChange={(e) => update(i, { difficulty: Number(e.target.value) as Q["difficulty"] })} className="h-9">
                  <option value={1}>Basic</option>
                  <option value={2}>Intermediate</option>
                  <option value={3}>Advanced</option>
                </Select></span>
                <div className="ml-auto flex gap-1">
                  <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                    <ChevronUp className="size-4" />
                  </IconBtn>
                  <IconBtn label="Move down" disabled={i === qs.length - 1} onClick={() => move(i, 1)}>
                    <ChevronDown className="size-4" />
                  </IconBtn>
                  <IconBtn label="Remove question" onClick={() => setQs((l) => l.filter((_, j) => j !== i))}>
                    <Trash2 className="size-4" />
                  </IconBtn>
                </div>
              </div>
              <Textarea
                aria-label="Question"
                placeholder="Apa perbedaan props dan state di React?"
                value={q.text}
                onChange={(e) => update(i, { text: e.target.value })}
                className="mt-3 min-h-16"
              />
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Textarea
                  aria-label="Expected points"
                  placeholder="Expected points, one per line"
                  defaultValue={q.expectedPoints.join("\n")}
                  onChange={(e) => update(i, { expectedPoints: lines(e.target.value) })}
                  className="min-h-20 text-sm"
                />
                <Textarea
                  aria-label="Follow-up questions"
                  placeholder="Optional follow-up questions, one per line"
                  defaultValue={q.followUps.join("\n")}
                  onChange={(e) => update(i, { followUps: lines(e.target.value) })}
                  className="min-h-20 text-sm"
                />
              </div>
              {errors[`questions.${i}`] && <p className="mt-2 text-sm text-danger">{errors[`questions.${i}`]}</p>}
            </li>
          ))}
        </ol>
        {qs.length === 0 && <p className="mt-5 text-sm text-ink-faint">No questions yet. Add at least 3 before opening the job.</p>}
      </section>

      {formError && <Alert>{formError}</Alert>}
      {saved && <Alert tone="sage">Job saved.</Alert>}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" size="lg" loading={busy}>
          {job ? "Save changes" : "Create job"}
        </Button>
        {job && canDelete && (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="size-4" aria-hidden /> Delete job
          </Button>
        )}
      </div>

      {job && (
        <ConfirmDialog
          open={confirmDelete}
          title="Delete this job?"
          confirmLabel="Delete job"
          tone="danger"
          onClose={() => setConfirmDelete(false)}
          onConfirm={async () => {
            await api("DELETE", `/admin/jobs/${job.id}`);
            router.replace("/admin/jobs");
            router.refresh();
          }}
        >
          This also deletes every interview and score for {job.title}. To stop new interviews but keep results, set the
          status to Closed instead.
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
      className="grid size-9 place-items-center rounded-full text-ink-faint hover:bg-paper hover:text-ink disabled:opacity-30"
    >
      {children}
    </button>
  );
}
