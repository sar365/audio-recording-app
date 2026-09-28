import { useEffect, useRef, useState } from "react";

interface VUMeterProps {
  isRecording: boolean;
}

interface ChannelState {
  level: number;
  peak: number;
  rms: number;
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function dbToPercent(db: number) {
  // map -60dBFS..0dBFS → 0..100%
  return clamp(((db + 60) / 60) * 100, 0, 100);
}

function formatDb(db: number) {
  if (db <= -60) return "-∞";
  return db.toFixed(1);
}

function MeterChannel({ label, state }: { label: string; state: ChannelState }) {
  const levelPct = dbToPercent(state.level);
  const peakPct = dbToPercent(state.peak);
  const isClipping = state.peak > -1;

  const barColor =
    state.level > -6
      ? isClipping
        ? "#e07b7b"
        : "#F3C5C5"
      : state.level > -18
      ? "#E5C3A6"
      : "#c8bfb0";

  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className="font-mono text-xs tracking-widest"
        style={{ color: "var(--muted-foreground)" }}
      >
        {label}
      </span>

      {/* Vertical meter */}
      <div className="relative flex gap-0.5">
        {/* dBFS scale labels */}
        <div
          className="font-mono text-[9px] flex flex-col justify-between pr-1 select-none"
          style={{ color: "var(--muted-foreground)", height: 160 }}
        >
          <span>0</span>
          <span>-6</span>
          <span>-12</span>
          <span>-18</span>
          <span>-30</span>
          <span>-60</span>
        </div>

        {/* Bar track */}
        <div
          className="relative rounded-sm overflow-hidden"
          style={{
            width: 20,
            height: 160,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid var(--border)",
          }}
        >
          {/* Level fill — grows from bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-75"
            style={{
              height: `${levelPct}%`,
              background: barColor,
              opacity: 0.85,
            }}
          />
          {/* Peak hold line */}
          <div
            className="absolute left-0 right-0 transition-all duration-300"
            style={{
              bottom: `${peakPct}%`,
              height: 2,
              background: isClipping ? "#e07b7b" : "#E5C3A6",
              boxShadow: isClipping
                ? "0 0 6px rgba(224,123,123,0.7)"
                : "0 0 5px rgba(229,195,166,0.6)",
            }}
          />
        </div>
      </div>

      {/* dBFS readout */}
      <span
        className="font-mono text-[10px] tracking-tight"
        style={{ color: isClipping ? "#e07b7b" : "var(--muted-foreground)" }}
      >
        {formatDb(state.peak)} dBFS
      </span>
    </div>
  );
}

export default function VUMeter({ isRecording }: VUMeterProps) {
  const [left, setLeft] = useState<ChannelState>({ level: -60, peak: -60, rms: -60 });
  const [right, setRight] = useState<ChannelState>({ level: -60, peak: -60, rms: -60 });
  const rafRef = useRef<number>(0);
  const peakHoldRef = useRef({ left: -60, right: -60, timer: 0 });

  useEffect(() => {
    if (!isRecording) {
      // Decay to silence
      setLeft({ level: -60, peak: -60, rms: -60 });
      setRight({ level: -60, peak: -60, rms: -60 });
      peakHoldRef.current = { left: -60, right: -60, timer: 0 };
      return;
    }

    // Smooth independent momentum for each channel
    let velL = 0;
    let velR = 0;
    let prevL = -20;
    let prevR = -22;
    let lastUpdate = 0;
    const FRAME_MS = 1000 / 24; // ~24fps updates feel like real metering

    function tick(now: number) {
      rafRef.current = requestAnimationFrame(tick);
      if (now - lastUpdate < FRAME_MS) return;
      lastUpdate = now;

      // Velocity-based random walk: small nudges, momentum carries it smoothly
      velL = velL * 0.72 + (Math.random() - 0.46) * 2.2;
      velR = velR * 0.72 + (Math.random() - 0.46) * 2.2;
      velL = clamp(velL, -3, 3);
      velR = clamp(velR, -3, 3);
      prevL = clamp(prevL + velL, -38, -2);
      prevR = clamp(prevR + velR, -38, -2);

      const ph = peakHoldRef.current;
      if (prevL > ph.left) ph.left = prevL;
      if (prevR > ph.right) ph.right = prevR;

      ph.timer++;
      if (ph.timer > 48) {
        ph.left = Math.max(ph.left - 0.3, prevL);
        ph.right = Math.max(ph.right - 0.3, prevR);
      }

      setLeft({ level: prevL, peak: ph.left, rms: prevL - 5 });
      setRight({ level: prevR, peak: ph.right, rms: prevR - 5 });
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [isRecording]);

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-3"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <h3
        className="font-display text-sm font-medium tracking-wider uppercase"
        style={{ color: "var(--muted-foreground)" }}
      >
        Level Meters
      </h3>
      {/* Mic isolation badge */}
      <div
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-md"
        style={{
          background: "rgba(224,123,123,0.07)",
          border: "1px solid rgba(224,123,123,0.18)",
        }}
      >
        {/* Mic blocked icon */}
        <svg width="11" height="13" viewBox="0 0 11 13" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="3" y="0.5" width="5" height="7" rx="2.5" fill="none" stroke="#e07b7b" strokeWidth="1.1" />
          <line x1="1" y1="11.5" x2="10" y2="11.5" stroke="#e07b7b" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="5.5" y1="9.5" x2="5.5" y2="11.5" stroke="#e07b7b" strokeWidth="1.1" strokeLinecap="round" />
          <path d="M1 5.5C1 8.26 3.01 10.5 5.5 10.5C7.99 10.5 10 8.26 10 5.5" stroke="#e07b7b" strokeWidth="1.1" strokeLinecap="round" fill="none" />
          {/* Strike-through */}
          <line x1="1.5" y1="1.5" x2="9.5" y2="11.5" stroke="#e07b7b" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
        <span
          className="font-mono text-[9px] tracking-widest uppercase"
          style={{ color: "#e07b7b" }}
        >
          Mic Input Isolated
        </span>
        <span
          className="ml-auto font-mono text-[9px]"
          style={{ color: "rgba(224,123,123,0.55)" }}
        >
          No bleed
        </span>
      </div>

      <div className="flex gap-6 justify-center">
        <MeterChannel label="L" state={left} />
        <MeterChannel label="R" state={right} />
      </div>
      <div
        className="font-mono text-[9px] text-center tracking-widest uppercase"
        style={{ color: "var(--muted-foreground)" }}
      >
        PCM · 32-bit float · WASAPI Loopback
      </div>
    </div>
  );
}
