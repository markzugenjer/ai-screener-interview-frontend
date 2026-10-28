"use client";

import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Alert, Button, Select } from "@/components/ui";
import { cn } from "@/lib/format";

type MicState = "asking" | "ready" | "denied" | "missing";

/** Mic check before joining: permission, device choice and a live input level meter. */
export function PreJoin({
  title,
  minutes,
  isPractice,
  connecting,
  error,
  onJoin,
}: {
  title: string;
  minutes: number;
  isPractice: boolean;
  connecting: boolean;
  error: string;
  onJoin: (deviceId?: string) => void;
}) {
  const [mic, setMic] = useState<MicState>("asking");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [deviceId, setDeviceId] = useState<string>();
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    let raf = 0;
    let ctx: AudioContext | undefined;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: deviceId ? { exact: deviceId } : undefined, echoCancellation: true, noiseSuppression: true },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        setMic("ready");
        const list = await navigator.mediaDevices.enumerateDevices();
        setDevices(list.filter((d) => d.kind === "audioinput"));

        ctx = new AudioContext();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 512;
        ctx.createMediaStreamSource(stream).connect(analyser);
        const data = new Uint8Array(analyser.fftSize);
        const tick = () => {
          analyser.getByteTimeDomainData(data);
          let sum = 0;
          for (const v of data) sum += ((v - 128) / 128) ** 2;
          const rms = Math.min(1, Math.sqrt(sum / data.length) * 4);
          setLevel(rms);
          if (rms > 0.15) setHeard(true);
          raf = requestAnimationFrame(tick);
        };
        tick();
      } catch (err) {
        if (cancelled) return;
        const name = err instanceof DOMException ? err.name : "";
        setMic(name === "NotFoundError" || name === "OverconstrainedError" ? "missing" : "denied");
      }
    }
    void start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      void ctx?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [deviceId]);

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 pb-16">
      <div className="rounded-[1.75rem] border border-line bg-paper p-6 shadow-lift sm:p-8">
        <h1 className="text-2xl font-extrabold">Ready for your {title} interview?</h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          About {minutes} minutes with Nara, in Bahasa Indonesia. Say something to check your microphone.
          {isPractice && " This is a practice attempt."}
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-sage-50 p-4">
          <span
            className={cn(
              "grid size-11 shrink-0 place-items-center rounded-full",
              mic === "ready" ? "bg-sage-600 text-paper" : "bg-paper text-ink-faint",
            )}
          >
            {mic === "ready" ? <Mic className="size-5" aria-hidden /> : <MicOff className="size-5" aria-hidden />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {mic === "asking" && "Waiting for microphone permission…"}
              {mic === "ready" && (heard ? "We can hear you" : "Say a few words")}
              {mic === "denied" && "Microphone is blocked"}
              {mic === "missing" && "No microphone found"}
            </p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-paper"
              role="meter"
              aria-label="Microphone level"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level * 100)}
            >
              <div className="h-full rounded-full bg-sage-500 transition-[width] duration-75" style={{ width: `${Math.round(level * 100)}%` }} />
            </div>
          </div>
        </div>

        {devices.length > 1 && (
          <div className="mt-4">
            <label htmlFor="mic" className="mb-1.5 block text-sm font-semibold">
              Microphone
            </label>
            <Select id="mic" value={deviceId ?? ""} onChange={(e) => setDeviceId(e.target.value || undefined)}>
              <option value="">System default</option>
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${i + 1}`}
                </option>
              ))}
            </Select>
          </div>
        )}

        {mic === "denied" && (
          <div className="mt-4">
            <Alert tone="amber">
              Allow microphone access in your browser&apos;s address bar (the lock or mic icon), then reload this page.
            </Alert>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <Button size="lg" className="mt-7 w-full" disabled={mic !== "ready"} loading={connecting} onClick={() => onJoin(deviceId)}>
          {connecting ? "Connecting…" : "Join interview"}
        </Button>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">
          By joining, you agree that this interview is recorded as a transcript and evaluated by AI. A recruiter reviews
          every result and makes the hiring decision.
        </p>
      </div>
    </main>
  );
}
