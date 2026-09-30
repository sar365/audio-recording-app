import { useEffect, useRef, useState } from "react";
import { RecordingState } from "./RecordingControls";

interface SessionInfoProps {
  state: RecordingState;
  sampleRate: string;
  bitDepth: string;
  fileSizeBytes: number;
  outputFormat: string;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

interface StatChipProps {
  label: string;
  value: string;
  highlight?: boolean;
}

function StatChip({ label, value, highlight }: StatChipProps) {
  return (
    <div className="flex flex-col gap-0.5 px-3 py-2 rounded-md" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
      <span className="text-[9px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>{label}</span>
      <span className="font-mono text-sm font-medium" style={{ color: highlight ? "var(--primary)" : "var(--foreground)" }}>{value}</span>
    </div>
  );
}

export default function SessionInfo({ state, sampleRate, bitDepth, fileSizeBytes, outputFormat }: SessionInfoProps) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (state === "recording") {
      intervalRef.current = setInterval(() => setElapsed((value) => value + 1), 1000);
    } else if (state === "idle") {
      setElapsed(0);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state]);

  return (
    <div className="rounded-lg p-4 flex flex-col gap-3" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <h3 className="font-display text-sm font-medium tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
        Session Info
      </h3>
      <div className="grid grid-cols-2 gap-2">
        <StatChip label="Duration" value={formatDuration(elapsed)} highlight />
        <StatChip label="Recorded Size" value={formatSize(fileSizeBytes)} />
        <StatChip label="Target Rate" value={`${sampleRate} kHz`} />
        <StatChip label="Target Depth" value={bitDepth === "32f" ? "32-bit float" : `${bitDepth}-bit`} />
      </div>
      <div className="font-mono text-[9px] tracking-wider break-all" style={{ color: "var(--muted-foreground)" }}>
        {outputFormat}
      </div>
      <p className="text-[9px] leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        Audio encoding is managed by Electron's MediaRecorder; target rate/depth settings are not applied by this build.
      </p>
    </div>
  );
}
