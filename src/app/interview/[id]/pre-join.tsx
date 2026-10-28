"use client";

import { Mic, MicOff } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Alert, Button, Select } from "@/components/ui";
import { useI18n } from "@/i18n/client";
import { fmt } from "@/i18n/format";
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
  const { t } = useI18n();
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
          stream.getTracks().forEach((tr) => tr.stop());
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
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    };
  }, [deviceId]);

  const status = { asking: t.room.micAsking, ready: heard ? t.room.micHeard : t.room.micSay, denied: t.room.micDenied, missing: t.room.micMissing }[mic];

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="rounded-[1.75rem] border border-line bg-paper p-6 shadow-lift sm:p-8"
      >
        <h1 className="text-2xl font-extrabold">{fmt(t.room.readyTitle, { title })}</h1>
        <p className="mt-2 leading-relaxed text-ink-soft">
          {fmt(t.room.readyBody, { n: minutes })}
          {isPractice && t.room.practice}
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl bg-sage-50 p-4">
          <motion.span
            className={cn("grid size-11 shrink-0 place-items-center rounded-full", mic === "ready" ? "bg-sage-600 text-paper" : "bg-paper text-ink-faint")}
            animate={{ scale: mic === "ready" ? 1 + level * 0.25 : 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 18 }}
          >
            {mic === "ready" ? <Mic className="size-5" aria-hidden /> : <MicOff className="size-5" aria-hidden />}
          </motion.span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{status}</p>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-paper"
              role="meter"
              aria-label={t.room.micLevel}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(level * 100)}
            >
              <div className="h-full origin-left rounded-full bg-sage-500 transition-transform duration-75" style={{ transform: `scaleX(${level})` }} />
            </div>
          </div>
        </div>

        {devices.length > 1 && (
          <div className="mt-4">
            <label htmlFor="mic" className="mb-1.5 block text-sm font-semibold">
              {t.room.micLabel}
            </label>
            <Select id="mic" value={deviceId ?? ""} onChange={(e) => setDeviceId(e.target.value || undefined)}>
              <option value="">{t.room.micDefault}</option>
              {devices.map((d, i) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || fmt(t.room.micNumbered, { n: i + 1 })}
                </option>
              ))}
            </Select>
          </div>
        )}

        {mic === "denied" && (
          <div className="mt-4">
            <Alert tone="amber">{t.room.micDeniedHelp}</Alert>
          </div>
        )}
        {error && (
          <div className="mt-4">
            <Alert>{error}</Alert>
          </div>
        )}

        <Button size="lg" className="mt-7 w-full" disabled={mic !== "ready"} loading={connecting} onClick={() => onJoin(deviceId)}>
          {connecting ? t.room.connecting : t.room.join}
        </Button>
        <p className="mt-4 text-center text-xs leading-relaxed text-ink-faint">{t.room.consent}</p>
      </motion.div>
    </main>
  );
}
