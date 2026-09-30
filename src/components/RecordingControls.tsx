export type RecordingState = "idle" | "recording" | "paused";

interface RecordingControlsProps {
  state: RecordingState;
  isStarting: boolean;
  onRecord: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}

const STATUS_LABELS: Record<RecordingState, string> = {
  idle: "READY",
  recording: "REC",
  paused: "PAUSED",
};

const STATUS_COLORS: Record<RecordingState, string> = {
  idle: "rgba(229,195,166,0.5)",
  recording: "#e07b7b",
  paused: "#F3C5C5",
};

export default function RecordingControls({
  state,
  isStarting,
  onRecord,
  onPause,
  onResume,
  onStop,
}: RecordingControlsProps) {
  return (
    <div
      className="rounded-lg p-5 flex flex-col gap-5"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <span
          className={`inline-block w-2 h-2 rounded-full ${state === "recording" ? "rec-pulse" : ""}`}
          style={{ background: STATUS_COLORS[state] }}
        />
        <span className="font-mono text-xs tracking-[0.2em] uppercase" style={{ color: STATUS_COLORS[state] }}>
          {isStarting ? "CONNECTING" : STATUS_LABELS[state]}
        </span>
      </div>

      <div className="flex items-center gap-3">
        {state === "paused" ? (
          <button
            onClick={onResume}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 glow-gold"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <span>▶</span> Resume
          </button>
        ) : state === "idle" ? (
          <button
            onClick={onRecord}
            disabled={isStarting}
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-wait"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)", boxShadow: "0 0 14px rgba(229,195,166,0.35)" }}
          >
            <span>{isStarting ? "◌" : "⏺"}</span> {isStarting ? "Connecting…" : "Record"}
          </button>
        ) : (
          <button
            disabled
            className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium"
            style={{ background: "rgba(224,123,123,0.15)", color: "#e07b7b", border: "1px solid rgba(224,123,123,0.3)", boxShadow: "0 0 16px rgba(224,123,123,0.2)", cursor: "default" }}
          >
            <span className="rec-pulse">⏺</span> Recording…
          </button>
        )}

        {state === "recording" && (
          <button
            onClick={onPause}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            style={{ background: "var(--muted)", color: "var(--foreground)", border: "1px solid var(--border)" }}
          >
            <span>⏸</span> Pause
          </button>
        )}

        {state !== "idle" && (
          <button
            onClick={onStop}
            className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200"
            style={{ background: "rgba(224,123,123,0.15)", color: "#e07b7b", border: "1px solid rgba(224,123,123,0.25)" }}
          >
            <span>⏹</span> Stop & Save
          </button>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
        Record a selected desktop audio source or input as WebM/Opus. Screen video is not saved; native lossless WASAPI/ASIO is not included.
      </p>
    </div>
  );
}
