"use client";

import {
  useLocalParticipant,
  useRoomContext,
  useTrackVolume,
  useTranscriptions,
  useVoiceAssistant,
} from "@livekit/components-react";
import type { LocalAudioTrack } from "livekit-client";
import { Mic, MicOff, PhoneOff, RotateCcw } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { ConfirmDialog } from "@/components/confirm-dialog";
import { api } from "@/lib/api-client";
import { cn, formatDuration } from "@/lib/format";
import type { Interview } from "@/lib/types";

const agentStateText: Record<string, string> = {
  disconnected: "Joining…",
  connecting: "Joining…",
  initializing: "Getting ready…",
  idle: "Listening",
  listening: "Listening",
  thinking: "Thinking…",
  speaking: "Speaking",
};

export function CallStage({
  interview,
  firstName,
  ending,
  onLeave,
  onReset,
}: {
  interview: Interview;
  firstName: string;
  ending: boolean;
  onLeave: () => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const room = useRoomContext();
  const { state: agentState, audioTrack: agentTrack, agent } = useVoiceAssistant();
  const { localParticipant, isMicrophoneEnabled, microphoneTrack } = useLocalParticipant();
  const agentVolume = useTrackVolume(agentTrack);
  const myVolume = useTrackVolume(microphoneTrack?.track as LocalAudioTrack | undefined);
  const transcriptions = useTranscriptions();
  const [confirm, setConfirm] = useState<"leave" | "reset" | null>(null);
  const elapsed = useElapsed(interview.startedAt);
  const canReset = interview.canReset && elapsed < 120;

  useIntegritySignals(interview.id);

  // Subtitles: the latest two lines, pink for Nara, green for you.
  const lines = useMemo(
    () =>
      transcriptions
        .filter((t) => t.text.trim())
        .slice(-2)
        .map((t) => ({
          id: t.streamInfo.id,
          mine: t.participantInfo.identity === room.localParticipant.identity,
          text: t.text,
        })),
    [transcriptions, room.localParticipant.identity],
  );

  const agentSpeaking = agentState === "speaking";
  const iAmSpeaking = isMicrophoneEnabled && myVolume > 0.08;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-6 sm:px-6">
      <div className="mb-4 flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 font-semibold text-blush-700">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-blush-400 opacity-70 motion-reduce:hidden" />
            <span className="relative inline-flex size-2.5 rounded-full bg-blush-600" />
          </span>
          Live
        </span>
        <span className="tabular font-semibold text-ink-soft" aria-label="Time elapsed">
          {formatDuration(elapsed)}
        </span>
      </div>

      <div className="grid flex-1 gap-4 md:grid-cols-2">
        <Tile
          tone="blush"
          name="Nara"
          role="AI interviewer"
          status={agent ? agentStateText[agentState] ?? "Listening" : "Joining…"}
          active={agentSpeaking}
          volume={agentVolume}
          initial="N"
        />
        <Tile
          tone="sage"
          name={firstName}
          role="You"
          status={isMicrophoneEnabled ? (iAmSpeaking ? "Speaking" : "Mic on") : "Muted"}
          active={iAmSpeaking}
          volume={isMicrophoneEnabled ? myVolume : 0}
          initial={firstName[0] ?? "Y"}
        />
      </div>

      <section aria-label="Live subtitles" aria-live="polite" className="mt-4 min-h-[6.5rem] rounded-card border border-line bg-paper px-5 py-4">
        {lines.length === 0 ? (
          <p className="text-ink-faint">{agent ? "Subtitles will appear here as you talk." : "Nara is joining the call…"}</p>
        ) : (
          <div className="space-y-1.5">
            {lines.map((l, i) => (
              <p key={l.id} className={cn("leading-relaxed", i === lines.length - 1 ? "text-[1.0625rem] text-ink" : "text-sm text-ink-faint")}>
                <span className={cn("mr-2 font-bold", l.mine ? "text-sage-600" : "text-blush-600")}>{l.mine ? "You" : "Nara"}</span>
                {l.text}
              </p>
            ))}
          </div>
        )}
      </section>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <ControlButton
          onClick={() => void localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled)}
          label={isMicrophoneEnabled ? "Mute" : "Unmute"}
          pressed={!isMicrophoneEnabled}
          icon={isMicrophoneEnabled ? <Mic className="size-5" aria-hidden /> : <MicOff className="size-5" aria-hidden />}
        />
        <ControlButton
          onClick={() => setConfirm("reset")}
          label="Reset interview"
          disabled={!canReset || ending}
          title={canReset ? undefined : "Reset is only available once, in the first 2 minutes"}
          icon={<RotateCcw className="size-5" aria-hidden />}
        />
        <button
          type="button"
          onClick={() => setConfirm("leave")}
          disabled={ending}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-blush-600 px-6 font-semibold text-paper transition-colors hover:bg-blush-700 disabled:opacity-60"
        >
          <PhoneOff className="size-5" aria-hidden />
          {ending ? "Ending…" : "Leave interview"}
        </button>
      </div>

      <ConfirmDialog
        open={confirm === "leave"}
        title="Leave the interview?"
        confirmLabel="Leave and see feedback"
        tone="danger"
        onClose={() => setConfirm(null)}
        onConfirm={onLeave}
      >
        Your answers so far will be scored. You won&apos;t be able to continue this interview.
      </ConfirmDialog>
      <ConfirmDialog
        open={confirm === "reset"}
        title="Start over?"
        confirmLabel="Reset interview"
        onClose={() => setConfirm(null)}
        onConfirm={onReset}
      >
        Everything said so far is cleared and Nara starts again. You can only do this once.
      </ConfirmDialog>
    </main>
  );
}

function Tile({
  tone,
  name,
  role,
  status,
  active,
  volume,
  initial,
}: {
  tone: "blush" | "sage";
  name: string;
  role: string;
  status: string;
  active: boolean;
  volume: number;
  initial: string;
}) {
  const reduce = useReducedMotion();
  const pink = tone === "blush";
  const scale = reduce ? 1 : 1 + Math.min(volume, 1) * 0.55;
  return (
    <div className={cn("relative grid min-h-56 place-items-center overflow-hidden rounded-[1.75rem] md:min-h-80", pink ? "bg-blush-50" : "bg-sage-50")}>
      <div className="relative grid place-items-center">
        <motion.span
          aria-hidden
          className={cn("absolute size-36 rounded-full", pink ? "bg-blush-200" : "bg-sage-200")}
          animate={{ scale: active ? scale : 1, opacity: active ? 0.85 : 0.35 }}
          transition={{ type: "spring", stiffness: 220, damping: 18, mass: 0.6 }}
        />
        <motion.span
          aria-hidden
          className={cn("absolute size-28 rounded-full", pink ? "bg-blush-100" : "bg-sage-100")}
          animate={{ scale: active ? 1 + (scale - 1) * 0.5 : 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        />
        <span
          className={cn(
            "relative grid size-20 place-items-center rounded-full text-2xl font-extrabold text-paper",
            pink ? "bg-blush-600" : "bg-sage-600",
          )}
        >
          {initial.toUpperCase()}
        </span>
      </div>
      <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-2">
        <p className="text-sm">
          <span className="font-bold text-ink">{name}</span> <span className="text-ink-faint">{role}</span>
        </p>
        <span className={cn("rounded-full bg-paper/80 px-2.5 py-1 text-xs font-semibold", pink ? "text-blush-700" : "text-sage-700")}>
          {status}
        </span>
      </div>
    </div>
  );
}

function ControlButton({
  icon,
  label,
  onClick,
  disabled,
  pressed,
  title,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={pressed}
      title={title}
      className={cn(
        "inline-flex h-12 items-center gap-2 rounded-full border px-5 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45",
        pressed ? "border-ink bg-ink text-paper" : "border-line bg-paper text-ink hover:border-sage-200 hover:bg-sage-50",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function useElapsed(startedAt: string | null): number {
  const [start] = useState(() => (startedAt ? new Date(startedAt).getTime() : Date.now()));
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  return Math.max(0, Math.floor((now - start) / 1000));
}

/** Reports tab switches and window blur so recruiters see them as flags (never auto-reject). */
function useIntegritySignals(id: string) {
  useEffect(() => {
    let last = 0;
    const send = (type: "tab_hidden" | "window_blur") => {
      if (Date.now() - last < 2000) return;
      last = Date.now();
      void api("POST", `/interviews/${id}/events`, { type }).catch(() => {});
    };
    const onVisibility = () => document.visibilityState === "hidden" && send("tab_hidden");
    const onBlur = () => send("window_blur");
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [id]);
}

