interface StatusBarProps {
  isRecording: boolean;
  device: string;
  captureMode?: string;
}

const MODE_SHORT: Record<string, string> = {
  wasapi: "WASAPI",
  asio: "ASIO",
  "dj-software": "DJ SW",
  hardware: "HW USB",
};

export default function StatusBar({ isRecording, device, captureMode }: StatusBarProps) {
  return (
    <div
      className="flex items-center gap-6 px-4 py-2 flex-wrap"
      style={{
        background: "var(--muted)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${isRecording ? "rec-pulse" : ""}`}
          style={{
            background: isRecording ? "#e07b7b" : "rgba(249,246,240,0.3)",
          }}
        />
        <span
          className="font-mono text-[10px] tracking-widest uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          {isRecording ? "Engine Active" : "Engine Idle"}
        </span>
      </div>

      <div className="w-px h-3" style={{ background: "var(--border)" }} />

      <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        Buffer:{" "}
        <span style={{ color: isRecording ? "#c8d9a0" : "var(--muted-foreground)" }}>
          {isRecording ? "98%" : "—"}
        </span>
      </span>

      <div className="w-px h-3" style={{ background: "var(--border)" }} />

      <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        Write queue:{" "}
        <span>{isRecording ? "2 frames" : "—"}</span>
      </span>

      <div className="w-px h-3" style={{ background: "var(--border)" }} />

      <span className="font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>
        {isRecording ? "1.2% CPU" : "—"}
      </span>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        {captureMode && (
          <span
            className="font-mono text-[9px] tracking-widest uppercase px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(229,195,166,0.12)",
              color: "var(--primary)",
              border: "1px solid rgba(229,195,166,0.2)",
            }}
          >
            {MODE_SHORT[captureMode] ?? captureMode}
          </span>
        )}
        <span
          className="font-mono text-[10px] truncate max-w-[200px]"
          style={{ color: "var(--muted-foreground)" }}
          title={device}
        >
          {device}
        </span>
      </div>
    </div>
  );
}
