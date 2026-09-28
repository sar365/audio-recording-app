import { useState } from "react";

type CaptureMode = "wasapi" | "asio" | "dj-software" | "hardware";

interface DeviceGroup {
  label: string;
  devices: string[];
}

const DEVICE_GROUPS: Record<CaptureMode, DeviceGroup[]> = {
  wasapi: [
    {
      label: "System Loopback",
      devices: [
        "System Default Output (Loopback)",
        "Speakers / Headphones (Loopback)",
        "Digital Output S/PDIF (Loopback)",
        "HDMI Audio Output (Loopback)",
      ],
    },
    {
      label: "USB / Onboard",
      devices: [
        "Realtek HD Audio — Stereo Mix",
        "USB Audio Device (Shared)",
        "Bluetooth A2DP Output (Loopback)",
      ],
    },
  ],
  asio: [
    {
      label: "Professional Interfaces",
      devices: [
        "Focusrite Scarlett 2i2 (ASIO)",
        "Focusrite Scarlett 4i4 (ASIO)",
        "Native Instruments Komplete Audio 6 (ASIO)",
        "Native Instruments Traktor Audio 10 (ASIO)",
        "Universal Audio Apollo Twin (ASIO)",
        "RME Babyface Pro (ASIO)",
        "MOTU M4 (ASIO)",
        "PreSonus AudioBox USB (ASIO)",
        "Behringer UMC202HD (ASIO)",
        "SSL 2+ (ASIO)",
      ],
    },
    {
      label: "Steinberg",
      devices: [
        "Steinberg UR22C (ASIO)",
        "Steinberg UR44C (ASIO)",
        "Steinberg UR816C (ASIO)",
        "Steinberg UR-RT2 (ASIO)",
        "Steinberg UR-RT4 (ASIO)",
        "Steinberg AXR4 (ASIO)",
        "Yamaha Steinberg USB ASIO",
      ],
    },
    {
      label: "Legacy Interfaces",
      devices: [
        "M-Audio Fast Track Ultra (ASIO)",
        "M-Audio Fast Track Pro (ASIO)",
        "M-Audio Audiophile USB (ASIO)",
        "Edirol UA-25EX (ASIO)",
        "Edirol UA-101 (ASIO)",
        "Tascam US-144MkII (ASIO)",
        "Tascam US-122MkII (ASIO)",
        "Lexicon Alpha (ASIO)",
        "Line 6 UX2 (ASIO)",
        "NI Audio Kontrol 1 (ASIO)",
      ],
    },
    {
      label: "Generic / Bridge",
      devices: [
        "ASIO4ALL v2",
        "FlexASIO",
        "WASAPI-ASIO Bridge",
      ],
    },
  ],
  "dj-software": [
    {
      label: "Serato DJ",
      devices: [
        "Serato DJ — Master Output",
        "Serato DJ — Booth Output",
        "Serato DJ — Headphone Cue",
        "Serato DJ — Record Channel",
      ],
    },
    {
      label: "Traktor Pro",
      devices: [
        "Traktor Pro — Master Out (ASIO)",
        "Traktor Pro — Record Bus",
        "Traktor Pro — Mix Recorder",
        "Traktor Audio 10 — Output 1/2",
      ],
    },
    {
      label: "rekordbox",
      devices: [
        "rekordbox — Master Output",
        "rekordbox — Booth Output",
        "rekordbox DJ — Record Bus",
      ],
    },
    {
      label: "Virtual DJ",
      devices: [
        "VirtualDJ — Master Output",
        "VirtualDJ — Record Channel",
        "VirtualDJ — Headphone Monitor",
      ],
    },
    {
      label: "Ableton / DAW",
      devices: [
        "Ableton Live — Master Out",
        "FL Studio — ASIO Output",
        "Logic Pro — Output Bus (macOS)",
      ],
    },
  ],
  hardware: [
    {
      label: "Pioneer DJ",
      devices: [
        "Pioneer DJM-900NXS2 (USB Audio)",
        "Pioneer DJM-750MK2 (USB Audio)",
        "Pioneer DJM-S9 (USB Audio)",
        "Pioneer XDJ-RX3 (USB Audio)",
        "Pioneer XDJ-XZ (USB Audio)",
      ],
    },
    {
      label: "Allen & Heath",
      devices: [
        "Allen & Heath Xone:96 (USB Audio)",
        "Allen & Heath DB4 (USB Audio)",
      ],
    },
    {
      label: "Rane / Denon",
      devices: [
        "Rane MP2015 (USB Audio)",
        "Denon SC Live 4 (USB Audio)",
        "Denon DJ Prime 4 (USB Audio)",
      ],
    },
    {
      label: "Native Instruments",
      devices: [
        "NI Traktor Kontrol S4 MK3 (USB Audio)",
        "NI Traktor Kontrol S2 MK3 (USB Audio)",
      ],
    },
    {
      label: "Native Instruments — Legacy",
      devices: [
        "NI Maschine MK2 (USB Audio)",
        "NI Maschine MK1 (USB Audio)",
        "NI Maschine Mikro MK2 (USB Audio)",
        "NI Maschine Mikro MK1 (USB Audio)",
        "NI Maschine Studio (USB Audio)",
        "NI Traktor Kontrol S4 MK1 (USB Audio)",
        "NI Traktor Kontrol S2 MK1 (USB Audio)",
        "NI Traktor Kontrol X1 MK1 (USB Audio)",
        "NI Traktor Audio 2 MK2 (USB Audio)",
        "NI Traktor Audio 6 (USB Audio)",
        "NI Komplete Audio 1 (USB Audio)",
      ],
    },
    {
      label: "Pioneer DJ — Legacy",
      devices: [
        "Pioneer DJM-800 (USB Audio)",
        "Pioneer DJM-700 (USB Audio)",
        "Pioneer DDJ-SX (USB Audio)",
        "Pioneer DDJ-SX2 (USB Audio)",
        "Pioneer DDJ-SR (USB Audio)",
        "Pioneer CDJ-2000NXS (USB Audio)",
      ],
    },
    {
      label: "Legacy & Other Hardware",
      devices: [
        "Numark Mixtrack Platinum FX (USB Audio)",
        "Numark NS7II (USB Audio)",
        "Numark NS7 (USB Audio)",
        "Behringer DDM4000 (USB Audio)",
        "Behringer BCD3000 (USB Audio)",
        "Roland DJ-505 (USB Audio)",
        "Roland DJ-202 (USB Audio)",
        "Hercules Inpulse T7 (USB Audio)",
        "Hercules DJ Console RMX (USB Audio)",
        "Hercules DJ Console MK4 (USB Audio)",
        "Reloop Terminal Mix 4 (USB Audio)",
        "Vestax VCI-400 (USB Audio)",
        "Denon DN-MC6000MK2 (USB Audio)",
      ],
    },
  ],
};

const MODE_LABELS: Record<CaptureMode, string> = {
  wasapi: "WASAPI Loopback",
  asio: "ASIO Driver",
  "dj-software": "DJ Software",
  hardware: "Hardware Device",
};

const MODE_DESCRIPTIONS: Record<CaptureMode, string> = {
  wasapi: "Capture system audio output directly via Windows WASAPI loopback. Works with any app.",
  asio: "Low-latency professional audio interface capture via ASIO driver. Best for hardware interfaces.",
  "dj-software": "Tap directly into the record bus or master output of your DJ application.",
  hardware: "Capture from a DJ mixer or controller via its built-in USB audio class.",
};

const SAMPLE_RATES = ["44.1", "48", "96", "192"];
const BIT_DEPTHS = ["16", "24", "32f"];

interface DeviceSelectorProps {
  device: string;
  sampleRate: string;
  bitDepth: string;
  captureMode: CaptureMode;
  onDeviceChange: (v: string) => void;
  onSampleRateChange: (v: string) => void;
  onBitDepthChange: (v: string) => void;
  onCaptureModeChange: (v: CaptureMode) => void;
  disabled?: boolean;
}

function GroupedSelect({
  value,
  groups,
  onChange,
  disabled,
}: {
  value: string;
  groups: DeviceGroup[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const safeGroups = groups ?? [];
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-md px-3 py-2 pr-8 text-sm font-medium cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed outline-none"
        style={{
          background: "var(--muted)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          fontFamily: "inherit",
        }}
      >
        {safeGroups.map((g) => (
          <optgroup
            key={g.label}
            label={g.label}
            style={{ background: "#1e1a2e", color: "rgba(249,246,240,0.5)", fontSize: 10 }}
          >
            {g.devices.map((d) => (
              <option key={d} value={d} style={{ background: "#252033", color: "#F9F6F0" }}>
                {d}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        ▾
      </span>
    </div>
  );
}

function NativeSelect({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full appearance-none rounded-md px-3 py-2 pr-8 text-sm font-medium cursor-pointer transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed outline-none"
        style={{
          background: "var(--muted)",
          color: "var(--foreground)",
          border: "1px solid var(--border)",
          fontFamily: "inherit",
        }}
      >
        {options.map((o) => (
          <option key={o} value={o} style={{ background: "#252033" }}>
            {o}
          </option>
        ))}
      </select>
      <span
        className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-xs"
        style={{ color: "var(--muted-foreground)" }}
      >
        ▾
      </span>
    </div>
  );
}

const MODE_ORDER: CaptureMode[] = ["wasapi", "asio", "dj-software", "hardware"];

export default function DeviceSelector({
  device,
  sampleRate,
  bitDepth,
  captureMode,
  onDeviceChange,
  onSampleRateChange,
  onBitDepthChange,
  onCaptureModeChange,
  disabled,
}: DeviceSelectorProps) {
  function handleModeChange(mode: CaptureMode) {
    onCaptureModeChange(mode);
    const groups = DEVICE_GROUPS[mode] ?? [];
    if (groups.length > 0 && groups[0].devices.length > 0) {
      onDeviceChange(groups[0].devices[0]);
    }
  }

  return (
    <div
      className="rounded-lg p-4 flex flex-col gap-4"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}
    >
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3
          className="font-display text-sm font-medium tracking-wider uppercase"
          style={{ color: "var(--muted-foreground)" }}
        >
          Audio Source
        </h3>
        {disabled && (
          <span
            className="font-mono text-[10px] tracking-wide"
            style={{ color: "rgba(243,197,197,0.7)" }}
          >
            Locked during recording
          </span>
        )}
      </div>

      {/* Capture mode tabs */}
      <div
        className="flex rounded-md overflow-hidden"
        style={{ border: "1px solid var(--border)" }}
      >
        {MODE_ORDER.map((mode) => (
          <button
            key={mode}
            onClick={() => !disabled && handleModeChange(mode)}
            disabled={disabled}
            className="flex-1 px-2 py-2 text-[10px] font-medium tracking-wider uppercase transition-all duration-150 disabled:cursor-not-allowed"
            style={{
              background:
                captureMode === mode ? "var(--primary)" : "var(--muted)",
              color:
                captureMode === mode
                  ? "var(--primary-foreground)"
                  : "var(--muted-foreground)",
              borderRight: mode !== "hardware" ? "1px solid var(--border)" : "none",
              boxShadow:
                captureMode === mode
                  ? "0 0 10px rgba(229,195,166,0.25)"
                  : "none",
            }}
          >
            {MODE_LABELS[mode]}
          </button>
        ))}
      </div>

      {/* Mode description */}
      <p
        className="text-[11px] leading-relaxed -mt-1"
        style={{ color: "var(--muted-foreground)" }}
      >
        {MODE_DESCRIPTIONS[captureMode]}
      </p>

      {/* Device picker */}
      <div className="flex flex-col gap-1.5">
        <label
          className="text-[10px] uppercase tracking-widest"
          style={{ color: "var(--muted-foreground)" }}
        >
          {captureMode === "dj-software"
            ? "Software & Output Bus"
            : captureMode === "hardware"
            ? "Hardware Device"
            : captureMode === "asio"
            ? "ASIO Driver"
            : "Loopback Device"}
        </label>
        <GroupedSelect
          value={device}
          groups={DEVICE_GROUPS[captureMode] ?? []}
          onChange={onDeviceChange}
          disabled={disabled}
        />
      </div>

      {/* Format row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Sample Rate (kHz)
          </label>
          <NativeSelect
            value={sampleRate}
            options={SAMPLE_RATES}
            onChange={onSampleRateChange}
            disabled={disabled}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label
            className="text-[10px] uppercase tracking-widest"
            style={{ color: "var(--muted-foreground)" }}
          >
            Bit Depth
          </label>
          <NativeSelect
            value={bitDepth}
            options={BIT_DEPTHS}
            onChange={onBitDepthChange}
            disabled={disabled}
          />
        </div>
      </div>

      {/* Compatibility note */}
      <div
        className="flex items-start gap-2 px-3 py-2 rounded-md"
        style={{ background: "rgba(229,195,166,0.07)", border: "1px solid rgba(229,195,166,0.12)" }}
      >
        <span style={{ color: "var(--primary)", fontSize: 11, lineHeight: 1.6 }}>◈</span>
        <p
          className="font-mono text-[10px] leading-relaxed"
          style={{ color: "var(--muted-foreground)" }}
        >
          {captureMode === "asio" &&
            "ASIO capture bypasses the Windows audio mixer. Ensure your interface driver is installed and no other ASIO application holds exclusive access."}
          {captureMode === "wasapi" &&
            "WASAPI Loopback captures the final mixed output from Windows. Compatible with all playback software — no driver install required."}
          {captureMode === "dj-software" &&
            "Select the record bus or master output of your DJ app. Make sure the virtual audio routing is configured in your software's audio settings."}
          {captureMode === "hardware" &&
            "Captures audio over USB directly from your DJ hardware's built-in audio class interface. Plug in the device and ensure it appears in Windows Sound settings."}
        </p>
      </div>
    </div>
  );
}
