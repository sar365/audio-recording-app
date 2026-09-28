interface WaveformDisplayProps {
  isRecording: boolean;
}

function generateBars(count: number) {
  const bars = [];
  for (let i = 0; i < count; i++) {
    const h = 10 + Math.abs(Math.sin(i * 0.4) * 55) + Math.abs(Math.sin(i * 0.13) * 30);
    bars.push(Math.min(h, 90));
  }
  return bars;
}

const BARS = generateBars(120);

export default function WaveformDisplay({ isRecording }: WaveformDisplayProps) {
  return (
    <div
      className="rounded-lg overflow-hidden relative"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
        height: 80,
      }}
    >
      {/* Gradient overlays on sides */}
      <div
        className="absolute inset-y-0 left-0 w-12 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to right, var(--card), transparent)",
        }}
      />
      <div
        className="absolute inset-y-0 right-0 w-12 z-10 pointer-events-none"
        style={{
          background: "linear-gradient(to left, var(--card), transparent)",
        }}
      />

      {/* Playhead line */}
      <div
        className="absolute left-1/2 inset-y-0 w-px z-20 pointer-events-none"
        style={{
          background: isRecording
            ? "rgba(229,195,166,0.6)"
            : "rgba(249,246,240,0.1)",
          boxShadow: isRecording ? "0 0 8px rgba(229,195,166,0.5)" : "none",
        }}
      />

      {/* Waveform bars */}
      <div
        className={`absolute inset-0 flex items-center gap-px px-2 ${
          isRecording ? "waveform-animate" : ""
        }`}
        style={{ width: "200%" }}
      >
        {[...BARS, ...BARS].map((h, i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-sm transition-all duration-150"
            style={{
              width: 3,
              height: `${h}%`,
              background: isRecording
                ? i % 2 === 0
                  ? "rgba(229,195,166,0.7)"
                  : "rgba(243,197,197,0.5)"
                : "rgba(249,246,240,0.08)",
              boxShadow:
                isRecording && h > 70
                  ? "0 0 4px rgba(229,195,166,0.4)"
                  : "none",
            }}
          />
        ))}
      </div>

      {/* NO SIGNAL label */}
      {!isRecording && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className="font-mono text-[10px] tracking-[0.3em] uppercase"
            style={{ color: "var(--muted-foreground)" }}
          >
            No Signal
          </span>
        </div>
      )}
    </div>
  );
}
