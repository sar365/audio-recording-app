import { useEffect, useRef, useState } from "react";
import RecordingControls, { RecordingState } from "../components/RecordingControls";
import VUMeter from "../components/VUMeter";
import SessionInfo from "../components/SessionInfo";
import DeviceSelector from "../components/DeviceSelector";
import WaveformDisplay from "../components/WaveformDisplay";
import SessionLog, { RecordedSession } from "../components/SessionLog";
import StatusBar from "../components/StatusBar";

type CaptureMode = "wasapi" | "asio" | "dj-software" | "hardware";

function DiscIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1A1625" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="2" x2="12" y2="9" />
      <line x1="12" y1="15" x2="12" y2="22" />
      <line x1="2" y1="12" x2="9" y2="12" />
      <line x1="15" y1="12" x2="22" y2="12" />
    </svg>
  );
}

function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function getErrorMessage(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      return "Audio capture was cancelled or denied. Allow capture in your browser and try again.";
    }
    if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      return "No usable audio input was found. Connect an audio device and try again.";
    }
    if (error.name === "NotReadableError") {
      return "The selected audio source is busy or unavailable. Close other apps using it and retry.";
    }
    return error.message || "The browser could not start audio capture.";
  }
  return error instanceof Error ? error.message : "The browser could not start audio capture.";
}

export default function Index() {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [device, setDevice] = useState("System Default Output (Loopback)");
  const [sampleRate, setSampleRate] = useState("48");
  const [bitDepth, setBitDepth] = useState("32f");
  const [captureMode, setCaptureMode] = useState<CaptureMode>("wasapi");
  const [isStarting, setIsStarting] = useState(false);
  const [recordingSizeBytes, setRecordingSizeBytes] = useState(0);
  const [outputFormat, setOutputFormat] = useState("WebM / Opus · browser capture");
  const [sessions, setSessions] = useState<RecordedSession[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const captureStreamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);
  const pausedAtRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);
  const sessionIdRef = useRef(0);
  const isStartingRef = useRef(false);
  const sessionUrlsRef = useRef(new Set<string>());

  const isRecording = recordingState === "recording";

  useEffect(() => {
    return () => {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") recorder.stop();
      captureStreamRef.current?.getTracks().forEach((track) => track.stop());
      sessionUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      sessionUrlsRef.current.clear();
    };
    // This cleanup should only run when the page component unmounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getAudioCaptureStream() {
    if (!navigator.mediaDevices) {
      throw new Error("Audio capture requires a secure browser context (HTTPS or localhost). ");
    }

    if (captureMode === "wasapi") {
      if (!navigator.mediaDevices.getDisplayMedia) {
        throw new Error("This browser cannot share system or tab audio. Try a current version of Chrome or Edge.");
      }
      const sharedStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      if (sharedStream.getAudioTracks().length === 0) {
        sharedStream.getTracks().forEach((track) => track.stop());
        throw new Error("No shared audio was received. In the browser share dialog, choose a tab or screen and enable its audio option.");
      }
      setNotice("Capturing audio from the tab or screen you selected in the browser share dialog.");
      return sharedStream;
    }

    // ASIO and DJ-device names in this prototype are native-engine presets.
    // The browser can only access audio inputs that the operating system exposes.
    const defaultStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    const audioInputs = (await navigator.mediaDevices.enumerateDevices()).filter(
      (item) => item.kind === "audioinput" && item.deviceId,
    );
    const selectedName = device.toLocaleLowerCase();
    const matchedInput = audioInputs.find((item) => {
      const label = item.label.toLocaleLowerCase();
      return label && (label.includes(selectedName) || selectedName.includes(label));
    });

    if (matchedInput && matchedInput.deviceId !== defaultStream.getAudioTracks()[0]?.getSettings().deviceId) {
      defaultStream.getTracks().forEach((track) => track.stop());
      const selectedStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: matchedInput.deviceId } },
        video: false,
      });
      setNotice(`Capturing from ${matchedInput.label}. Browser recordings are WebM/Opus, not lossless WASAPI/ASIO files.`);
      return selectedStream;
    }

    const actualLabel = defaultStream.getAudioTracks()[0]?.label || "the browser's default microphone input";
    setNotice(`Capturing from ${actualLabel}. The selected ASIO/DJ preset is not connected to a native engine in this browser preview.`);
    return defaultStream;
  }

  async function handleRecord() {
    if (isStartingRef.current || mediaRecorderRef.current) return;
    isStartingRef.current = true;
    setIsStarting(true);
    setError("");
    setNotice(captureMode === "wasapi"
      ? "Choose a tab or screen in the browser dialog and enable audio sharing."
      : "Requesting access to an audio input…");

    let stream: MediaStream | null = null;
    try {
      stream = await getAudioCaptureStream();
      const audioOnlyStream = new MediaStream(stream.getAudioTracks());
      const mimeCandidates = ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"];
      const preferredType = mimeCandidates.find((candidate) => MediaRecorder.isTypeSupported(candidate));
      const recorder = new MediaRecorder(audioOnlyStream, preferredType ? { mimeType: preferredType } : undefined);
      chunksRef.current = [];
      setRecordingSizeBytes(0);
      startedAtRef.current = Date.now();
      pausedAtRef.current = null;
      pausedDurationRef.current = 0;
      captureStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      setOutputFormat(`${recorder.mimeType || "Browser audio"} · browser capture`);

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
          setRecordingSizeBytes((current) => current + event.data.size);
        }
      });
      recorder.addEventListener("stop", () => {
        const actualMimeType = recorder.mimeType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: actualMimeType });
        const stopTime = pausedAtRef.current ?? Date.now();
        const activeDuration = Math.max(0, (stopTime - startedAtRef.current - pausedDurationRef.current) / 1000);
        stream?.getTracks().forEach((track) => track.stop());
        captureStreamRef.current = null;
        mediaRecorderRef.current = null;
        pausedAtRef.current = null;
        setRecordingState("idle");
        setRecordingSizeBytes(blob.size);

        if (blob.size === 0) {
          setError("No audio data was recorded. Check the selected source and try again.");
          chunksRef.current = [];
          return;
        }

        const extension = actualMimeType.includes("ogg") ? "ogg" : "webm";
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
        const filename = `${timestamp}_Audio-Recording.${extension}`;
        const downloadUrl = URL.createObjectURL(blob);
        sessionUrlsRef.current.add(downloadUrl);
        const finishedSession: RecordedSession = {
          id: ++sessionIdRef.current,
          filename,
          date: new Date().toLocaleString(),
          duration: formatDuration(activeDuration),
          size: formatSize(blob.size),
          format: actualMimeType.replace(";codecs=", " / ").replace("audio/", "").toUpperCase(),
          downloadUrl,
        };
        setSessions((current) => [finishedSession, ...current]);
        setOutputFormat(`${actualMimeType} · browser capture`);
        setNotice(`Recording ready: ${filename}. Use Download in Recorded Sessions if your browser did not download it automatically.`);
        setError("");

        // Attempt a direct download at stop; the session table retains a second download link.
        const link = document.createElement("a");
        link.href = downloadUrl;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        link.remove();
        chunksRef.current = [];
      });
      recorder.addEventListener("error", () => {
        setError("The browser encountered an error while recording. Stop and try another audio source.");
      });

      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.addEventListener("ended", () => {
          if (recorder.state !== "inactive") {
            setNotice("The shared audio source ended; the recording has been finalized.");
            recorder.stop();
          }
        }, { once: true });
      }

      recorder.start(1000);
      setRecordingState("recording");
    } catch (captureError) {
      stream?.getTracks().forEach((track) => track.stop());
      setRecordingState("idle");
      setNotice("");
      setError(getErrorMessage(captureError));
    } finally {
      isStartingRef.current = false;
      setIsStarting(false);
    }
  }

  function handlePause() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "recording") return;
    recorder.pause();
    pausedAtRef.current = Date.now();
    setRecordingState("paused");
  }

  function handleResume() {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state !== "paused") return;
    if (pausedAtRef.current !== null) {
      pausedDurationRef.current += Date.now() - pausedAtRef.current;
      pausedAtRef.current = null;
    }
    recorder.resume();
    setRecordingState("recording");
  }

  function handleStop() {
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== "inactive") recorder.stop();
  }

  function handleDeleteSession(session: RecordedSession) {
    URL.revokeObjectURL(session.downloadUrl);
    sessionUrlsRef.current.delete(session.downloadUrl);
    setSessions((current) => current.filter((item) => item.id !== session.id));
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--background)" }}>
      <header className="flex items-center justify-between px-6 py-4 flex-wrap gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--primary)", boxShadow: "0 0 16px rgba(229,195,166,0.4)" }}>
            <DiscIcon />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-wide leading-none" style={{ color: "var(--foreground)" }}>DJ Companion</h1>
            <p className="text-[10px] tracking-wide mt-0.5" style={{ color: "var(--muted-foreground)" }}>
              The tool that does it all, without interfering with the quality of your tracks
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md" style={{ background: "var(--muted)", border: "1px solid var(--border)" }}>
          <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? "rec-pulse" : ""}`} style={{ background: isRecording ? "#e07b7b" : "rgba(249,246,240,0.25)" }} />
          <span className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>SL.STUDIO Engine</span>
          <span className="font-mono text-[10px]" style={{ color: isRecording ? "#e07b7b" : "var(--primary)" }}>
            {isStarting ? "CONNECTING" : isRecording ? "RECORDING" : recordingState === "paused" ? "PAUSED" : "READY"}
          </span>
        </div>
      </header>

      <main className="flex-1 px-6 py-5 flex flex-col gap-4 overflow-auto">
        <DeviceSelector
          device={device}
          sampleRate={sampleRate}
          bitDepth={bitDepth}
          captureMode={captureMode}
          onDeviceChange={setDevice}
          onSampleRateChange={setSampleRate}
          onBitDepthChange={setBitDepth}
          onCaptureModeChange={setCaptureMode}
          disabled={isRecording || recordingState === "paused" || isStarting}
        />

        {(notice || error) && (
          <div
            role={error ? "alert" : "status"}
            className="rounded-md px-4 py-3 text-xs leading-relaxed"
            style={{
              background: error ? "rgba(224,123,123,0.1)" : "rgba(229,195,166,0.07)",
              border: `1px solid ${error ? "rgba(224,123,123,0.3)" : "var(--border)"}`,
              color: error ? "#f0a0a0" : "var(--muted-foreground)",
            }}
          >
            {error || notice}
          </div>
        )}

        <WaveformDisplay isRecording={isRecording} />

        <div className="grid gap-4" style={{ gridTemplateColumns: "auto 1fr 1fr" }}>
          <VUMeter isRecording={isRecording} />
          <RecordingControls
            state={recordingState}
            isStarting={isStarting}
            onRecord={handleRecord}
            onPause={handlePause}
            onResume={handleResume}
            onStop={handleStop}
          />
          <SessionInfo
            state={recordingState}
            sampleRate={sampleRate}
            bitDepth={bitDepth}
            fileSizeBytes={recordingSizeBytes}
            outputFormat={outputFormat}
          />
        </div>

        <SessionLog sessions={sessions} onDelete={handleDeleteSession} />
      </main>

      <StatusBar isRecording={isRecording} device={device} captureMode={captureMode} />
    </div>
  );
}
