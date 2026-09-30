export interface RecordedSession {
  id: number;
  filename: string;
  date: string;
  duration: string;
  size: string;
  format: string;
  downloadUrl: string;
}

interface SessionLogProps {
  sessions: RecordedSession[];
  onDelete: (session: RecordedSession) => void;
}

export default function SessionLog({ sessions, onDelete }: SessionLogProps) {
  return (
    <div className="rounded-lg flex flex-col" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-display text-sm font-medium tracking-wider uppercase" style={{ color: "var(--muted-foreground)" }}>
          Recorded Sessions
        </h3>
        <span className="font-mono text-[10px] tracking-widest" style={{ color: "var(--muted-foreground)" }}>
          {sessions.length} {sessions.length === 1 ? "file" : "files"}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["#", "Filename", "Date", "Duration", "Size", "Format", ""].map((column) => (
                <th key={column} className="text-left px-4 py-2.5 font-normal text-[10px] uppercase tracking-widest" style={{ color: "var(--muted-foreground)" }}>
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session, index) => (
              <tr key={session.id} className="group transition-all duration-150" style={{ borderBottom: "1px solid var(--border)" }}>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted-foreground)" }}>{String(index + 1).padStart(2, "0")}</td>
                <td className="px-4 py-3">
                  <span className="font-mono text-[11px] truncate block max-w-[280px]" style={{ color: "var(--foreground)" }} title={session.filename}>
                    {session.filename}
                  </span>
                </td>
                <td className="px-4 py-3 font-mono text-xs whitespace-nowrap" style={{ color: "var(--muted-foreground)" }}>{session.date}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--foreground)" }}>{session.duration}</td>
                <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--primary)" }}>{session.size}</td>
                <td className="px-4 py-3 font-mono text-[10px]" style={{ color: "var(--muted-foreground)" }}>{session.format}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-150">
                    <a
                      href={session.downloadUrl}
                      download={session.filename}
                      className="p-1.5 rounded-md text-sm transition-colors duration-150"
                      style={{ color: "var(--primary)" }}
                      title={`Download ${session.filename}`}
                      aria-label={`Download ${session.filename}`}
                    >
                      ↓
                    </a>
                    <button
                      onClick={() => onDelete(session)}
                      className="p-1.5 rounded-md text-sm transition-colors duration-150"
                      style={{ color: "var(--destructive)" }}
                      title={`Remove ${session.filename}`}
                      aria-label={`Remove ${session.filename}`}
                    >
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center font-mono text-xs tracking-widest uppercase" style={{ color: "var(--muted-foreground)" }}>
                  No recordings yet — completed captures will appear here
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-2.5 font-mono text-[9px] tracking-widest" style={{ color: "var(--muted-foreground)", borderTop: "1px solid var(--border)" }}>
        Choose a save location in the operating system's Save dialog.
      </div>
    </div>
  );
}
