# Smart Auto-Detect Recording Defaults — Feature Plan

## Context

The user wants the app to intelligently configure its recording defaults based on whatever setup is connected — DJ software, ASIO interface, MIDI/controller hardware, or headphones (wired or Bluetooth). Right now the app starts with a static default ("System Default Output (Loopback)" / WASAPI) and the user has to manually navigate four tabs to pick the right source. The goal is a **smart setup wizard / auto-detect panel** that scans the simulated environment and recommends the correct capture mode + device, with one-tap confirmation.

---

## What to build

### 1. `src/components/AutoDetect.tsx` — new component

A collapsible "Smart Setup" panel that sits above the DeviceSelector. It simulates device scanning and surfaces a ranked list of detected audio sources, each with a recommended capture mode and one-click "Use This" button.

**Detected source categories and their priority logic:**

| Priority | What's detected | Recommended mode | Recommended device |
|---|---|---|---|
| 1 | ASIO driver present | `asio` | Matched ASIO device name |
| 2 | DJ software running (Serato / Traktor / rekordbox / VDJ) | `dj-software` | Software's master/record bus |
| 3 | USB DJ hardware / controller | `hardware` | Hardware USB audio device |
| 4 | Bluetooth headphones (A2DP output) | `wasapi` | "Bluetooth A2DP Output (Loopback)" |
| 5 | Wired headphones / analog output | `wasapi` | "Speakers / Headphones (Loopback)" |
| 6 | System default fallback | `wasapi` | "System Default Output (Loopback)" |

**Simulated scan flow (UI only — no real Web Audio API needed):**
- On mount, show a "Scanning audio devices…" state with an animated progress bar (1.5s)
- After scan completes, show a prioritised list of 2–4 "detected" sources
- Each row: device icon, name, capture mode badge, sample rate recommendation, and "Use This" button
- "Use This" calls `onApply(captureMode, device, sampleRate, bitDepth)` back to Index
- A "Manual setup" link collapses the panel and reveals the existing DeviceSelector tabs as-is

**Simulated detections (seeded realistically, vary by randomising which subset appears):**
The scan always shows System Default + Bluetooth if present, and randomly surfaces 1–2 of: ASIO interface, DJ software bus, USB hardware — so each session feels like a real scan.

**Format recommendation logic per source type:**
- ASIO interface → 48 kHz / 32f (or match the interface's native rate)
- DJ software → 44.1 kHz / 32f (Serato default), 48 kHz / 32f (Traktor/rekordbox)
- USB hardware → 48 kHz / 24
- Bluetooth → 48 kHz / 16 (A2DP cap)
- Wired headphones → 48 kHz / 32f
- System default → 48 kHz / 32f

### 2. Updates to `src/pages/Index.tsx`

- Import and place `<AutoDetect>` between the header and the `<DeviceSelector>`
- Pass `onApply` callback that calls `setDevice`, `setSampleRate`, `setBitDepth`, `setCaptureMode` together
- Keep `<DeviceSelector>` below as the manual fallback — AutoDetect panel collapses to a small "Re-scan" link when a source is already confirmed

### 3. Visual design (matching existing aesthetic)

- Panel card: `var(--card)` background, champagne gold border tint
- Scanning state: thin animated progress bar in champagne gold (`rec-pulse`-style)
- Detected row: icon (SVG inline), device name in DM Sans, mode badge in JetBrains Mono
- "Use This" button: small, champagne gold, with soft glow on hover
- Bluetooth rows get a Bluetooth icon; wired gets a headphone icon; hardware gets a USB icon; ASIO gets a waveform icon; DJ software gets a disc icon

---

## Files to modify

- **New**: `src/components/AutoDetect.tsx`
- **Edit**: `src/pages/Index.tsx` — add AutoDetect above DeviceSelector, wire `onApply`

## Verification

1. On load, the scanning animation plays for ~1.5s then reveals detected sources
2. Clicking "Use This" on any row immediately updates the DeviceSelector + StatusBar to reflect the chosen mode/device
3. "Manual setup" link hides AutoDetect and shows DeviceSelector tabs directly
4. Confirmed source persists correctly into RecordingControls (device stays locked during recording)
5. Bluetooth source correctly recommends 48 kHz / 16-bit (A2DP ceiling)

---

# Lossless Audio & DJ Set Recorder — Implementation Plan

## Context

Building a full-featured React/TypeScript web companion UI for a lossless audio recorder targeting DJ sets and live sessions. The app wraps a native Windows WASAPI loopback engine but its web UI needs to feel like a precision instrument: dark ground, sharp type, VU metering, recording controls, session management. This is a greenfield build — only `src/App.tsx` and `src/index.css` exist.

---

## Aesthetic Stance

**Soft, elegant, feminine dark luxury.** App name: **DJ Companion** — tagline: *"The tool that does it all, without interfering with the quality of your tracks."* Full commitment:
- **Background**: deep twilight plum (`#1A1625`)
- **Surfaces**: soft charcoal (`#252033`) for cards/panels
- **Accent**: muted champagne gold (`#E5C3A6`) — knobs, active controls, highlights
- **Secondary accent**: soft blush pink (`#F3C5C5`) — hover states, secondary indicators
- **Text**: crisp warm-ivory (`#F9F6F0`)
- **Active waveform**: warm-ivory with soft glow
- **Muted text**: `rgba(249,246,240,0.45)`
- **Borders**: hairline `1px` at `rgba(229,195,166,0.15)` (champagne gold tint)
- **Active button glow**: `box-shadow: 0 0 12px rgba(229,195,166,0.35)`
- **Fonts**: `Cormorant Garamond` (display headings — warm, high-end) + `DM Sans` (UI body) + `JetBrains Mono` (data labels, dBFS, time)
- **Radius**: `8px` — soft but not bubbly
- **Overall feel**: warm, sophisticated, minimalist, high-end

---

## File Structure

```
src/
  index.css                 — Google Fonts @imports, Tailwind, CSS tokens
  App.tsx                   — React Router shell (keep routes here per instructions)
  pages/
    Index.tsx               — Main recorder page (default route "/")
  components/
    VUMeter.tsx             — Animated SVG/canvas peak + RMS bar meter (stereo L/R)
    RecordingControls.tsx   — Record / Pause / Stop + status badge
    SessionInfo.tsx         — Live session stats: duration, file size, sample rate, bit depth
    DeviceSelector.tsx      — WASAPI loopback device dropdown + format picker
    SessionLog.tsx          — Table of recorded sessions with filename, duration, size, download
    WaveformDisplay.tsx     — Scrolling waveform visualization (CSS animation placeholder)
    StatusBar.tsx           — Bottom bar: engine status, buffer health, write queue depth
```

---

## Implementation Plan

### 1. `src/index.css`
- Add Google Fonts `@import` for Cormorant Garamond, DM Sans, and JetBrains Mono at the top
- After `@import 'tailwindcss'`, add CSS custom properties in `:root`:
  ```css
  --background: #1A1625;
  --foreground: #F9F6F0;
  --card: #252033;
  --card-foreground: #F9F6F0;
  --primary: #E5C3A6;
  --primary-foreground: #1A1625;
  --secondary: #F3C5C5;
  --secondary-foreground: #1A1625;
  --muted: #1e1a2e;
  --muted-foreground: rgba(249,246,240,0.45);
  --border: rgba(229,195,166,0.15);
  --accent: #E5C3A6;
  --accent-foreground: #1A1625;
  --destructive: #e07b7b;
  --radius: 8px;
  ```
- Wire `font-family: 'DM Sans', sans-serif` on `body`; `font-family: 'Cormorant Garamond', serif` on display headings via `.font-display`

### 2. `src/App.tsx`
- Wire React Router with `BrowserRouter` + `Routes`
- Single route: `"/"` → `<Index />`

### 3. `src/pages/Index.tsx`
Layout in CSS Grid:
```
[Header — app name + engine status badge]
[DeviceSelector]
[WaveformDisplay — scrolling visualization strip]
[VUMeter (L+R)] | [RecordingControls + SessionInfo]
[SessionLog — recorded sessions table]
[StatusBar]
```

### 4. `src/components/VUMeter.tsx`
- Stereo (L/R) vertical bar meters
- React state animating via `requestAnimationFrame` + `useState` with simulated peak data (random walk when recording, flat when stopped)
- Peak hold indicator (small line at max reached)
- Color gradient: green → yellow → red zones
- dBFS labels in JetBrains Mono

### 5. `src/components/RecordingControls.tsx`
- Record (●), Pause (⏸), Stop (■) buttons using shadcn/ui `Button`
- State machine: `idle | recording | paused | stopped`
- Pulsing red dot animation when recording
- Status badge ("ARMED", "REC", "PAUSED", "READY")

### 6. `src/components/SessionInfo.tsx`
- Live counters: recording duration (HH:MM:SS), estimated file size (MB/GB), sample rate, bit depth, codec (WAV PCM 32-bit float)
- All values in JetBrains Mono on muted background chips

### 7. `src/components/DeviceSelector.tsx`
- shadcn/ui `Select` for device (pre-populated with realistic fake devices: "Realtek WASAPI Loopback", "Focusrite USB ASIO", "System Default")
- Format picker: sample rate (44.1k / 48k / 96k / 192k) + bit depth (16 / 24 / 32f)

### 8. `src/components/SessionLog.tsx`
- shadcn/ui `Table` with columns: #, Filename, Date, Duration, Size, Format, Actions
- 3–4 pre-seeded realistic sessions (e.g. "2026-09-12_DJ-Set_Live-at-Fabric.wav")
- Row hover: subtle cyan left border highlight
- Actions: Download icon, Delete icon

### 9. `src/components/WaveformDisplay.tsx`
- CSS-animated scrolling waveform strip (SVG sine-based bars sliding left)
- Dimmed when not recording, cyan-lit when active
- Shows "NO SIGNAL" label when idle

### 10. `src/components/StatusBar.tsx`
- Fixed bottom strip: Engine status dot, Buffer health %, Write queue depth, Output path
- Mono text, very muted

---

## Key Patterns

- Dark theme throughout — no light mode toggle needed
- shadcn/ui components: `Button`, `Select`, `Table`, `Badge`, `Separator`
- `lucide-react` icons: `Mic`, `Square`, `Pause`, `Play`, `Download`, `Trash2`, `Activity`, `HardDrive`, `Cpu`
- All number/data displays use `font-mono` / JetBrains Mono
- React state for recording state machine, simulated meter animation via `useEffect` + `setInterval`

---

## Verification

1. Preview renders in Figma Make panel — full dark layout visible
2. Record button cycles through states (idle → recording → paused → stopped)
3. VU meters animate when "recording" state is active
4. Session log table shows pre-seeded rows
5. DeviceSelector dropdowns open and close correctly
