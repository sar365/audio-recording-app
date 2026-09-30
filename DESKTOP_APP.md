# DJ Companion desktop app

DJ Companion is packaged as a standalone Electron app for Windows, macOS, and Linux. It runs the built interface locally; it does not require a web host or account sign-in.

## Build locally

Requirements: Node.js 22 and pnpm 11.25.0.

```bash
pnpm install --frozen-lockfile
pnpm desktop:build
```

The default command builds for the current operating system. Platform-specific commands are also available:

```bash
pnpm desktop:linux  # AppImage and .deb (x64)
pnpm desktop:win    # NSIS installer (x64)
pnpm desktop:mac    # .dmg and .zip (Intel and Apple silicon)
```

Artifacts are written to `release/`. The macOS command must run on macOS; the Windows command must run on Windows. Use GitHub Actions → **Desktop app builds** → **Run workflow** to build all three operating systems. CI artifacts are private to the repository and available for 30 days.

## Audio capture

- Microphone/input capture uses the audio devices exposed by the operating system.
- Desktop/system capture asks you to select a screen or window. Only the audio track is recorded; the video track is not saved.
- On macOS, grant microphone and screen/system-audio access in **System Settings → Privacy & Security** when prompted. System audio capture requires macOS 13 or later; macOS 14.2+ uses Apple's audio capture permission.
- Recordings are encoded by Electron's MediaRecorder engine (typically WebM/Opus). The ASIO/DJ presets are labels only; this package does not include native ASIO drivers or a native lossless engine.
- Each save opens the operating system's Save dialog. Completed session rows and their temporary download links are kept only until the app closes.

## Signing

The generated packages are currently unsigned because no platform signing certificates are configured. Windows SmartScreen or macOS Gatekeeper may show an unsigned-app warning. For public distribution, sign the Windows installer and notarize the macOS app with the developer's own certificates.
