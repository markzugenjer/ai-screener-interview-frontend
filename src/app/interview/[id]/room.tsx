"use client";

import { RoomAudioRenderer, RoomContext, StartAudio } from "@livekit/components-react";
import { Room, RoomEvent } from "livekit-client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { Brand } from "@/components/brand";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useI18n } from "@/i18n/client";
import { errorMessage } from "@/lib/errors";
import { api } from "@/lib/api-client";
import type { Interview } from "@/lib/types";
import { CallStage } from "./stage";
import { PreJoin } from "./pre-join";

type Phase = "prejoin" | "connecting" | "live" | "ending" | "error";

/**
 * Owns the LiveKit connection lifecycle: pre-join mic check -> connect -> live call -> finish.
 * The room is created once per mount and always disconnected on unmount.
 */
export function InterviewRoom({ interview: initial, firstName }: { interview: Interview; firstName: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [interview, setInterview] = useState(initial);
  const [phase, setPhase] = useState<Phase>("prejoin");
  const [error, setError] = useState("");
  const [room] = useState(() => new Room({ adaptiveStream: true, dynacast: true }));
  const endingRef = useRef(false);

  const finish = useCallback(async () => {
    if (endingRef.current) return;
    endingRef.current = true;
    setPhase("ending");
    await room.disconnect().catch(() => {});
    await api("POST", `/interviews/${interview.id}/finish`).catch(() => {});
    router.replace(`/interview/${interview.id}/feedback`);
  }, [interview.id, room, router]);

  // If Dicy ends the call (all questions done or time is up), the room closes: go to feedback.
  useEffect(() => {
    const onDisconnected = () => {
      if (!endingRef.current && phase === "live") void finish();
    };
    const onParticipantLeft = () => {
      // The agent leaving means the interview is over.
      if (room.remoteParticipants.size === 0 && phase === "live") void finish();
    };
    room.on(RoomEvent.Disconnected, onDisconnected);
    room.on(RoomEvent.ParticipantDisconnected, onParticipantLeft);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.ParticipantDisconnected, onParticipantLeft);
    };
  }, [room, phase, finish]);

  useEffect(() => () => void room.disconnect(), [room]);

  const join = useCallback(
    async (deviceId?: string) => {
      setPhase("connecting");
      setError("");
      try {
        const { url, token, interview: iv } = await api<{ url: string; token: string; interview: Interview }>(
          "POST",
          `/interviews/${interview.id}/token`,
        );
        setInterview(iv);
        await room.connect(url, token);
        await room.localParticipant.setMicrophoneEnabled(true, deviceId ? { deviceId } : undefined);
        setPhase("live");
      } catch (err) {
        await room.disconnect().catch(() => {});
        setError(errorMessage(err, t, t.room.connectError));
        setPhase("error");
      }
    },
    [interview.id, room, t],
  );

  const reset = useCallback(async () => {
    const { interview: iv } = await api<{ interview: Interview }>("POST", `/interviews/${interview.id}/reset`);
    await room.disconnect().catch(() => {});
    setInterview(iv);
    setPhase("prejoin");
  }, [interview.id, room]);

  return (
    <div className="flex min-h-dvh flex-col bg-mist">
      <header className="flex h-16 items-center justify-between px-4 sm:px-6">
        <Brand href="/dashboard" />
        <div className="flex min-w-0 items-center gap-2">
          <p className="hidden truncate pl-4 text-sm font-semibold text-ink-soft sm:block">{interview.job?.title}</p>
          <LanguageSwitcher />
        </div>
      </header>

      {phase === "prejoin" || phase === "error" || phase === "connecting" ? (
        <PreJoin
          title={interview.job?.title ?? "Interview"}
          minutes={interview.job?.durationMinutes ?? 20}
          isPractice={interview.isPractice}
          connecting={phase === "connecting"}
          error={error}
          onJoin={join}
        />
      ) : (
        <RoomContext.Provider value={room}>
          <CallStage
            interview={interview}
            firstName={firstName}
            ending={phase === "ending"}
            onLeave={finish}
            onReset={reset}
          />
          <RoomAudioRenderer />
          <StartAudio
            label={t.room.tapToHear}
            className="fixed bottom-28 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper shadow-lift"
          />
        </RoomContext.Provider>
      )}
    </div>
  );
}
