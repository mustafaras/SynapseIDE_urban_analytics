// Urban Analytics Workbench — Python Environment Manager
// Detects available Python environments, displays version/packages, activate/switch
import { useCallback, useEffect, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export interface PythonEnvironment {
  readonly name: string;
  readonly path: string;
  readonly version: string;
  readonly type: "venv" | "conda" | "system";
  readonly packageCount: number;
  readonly isActive: boolean;
}

export type DetectionStatus = "idle" | "detecting" | "ready" | "error";

/* ------------------------------------------------------------------ */
/*  Detection helpers (simulated — no real subprocess in browser)     */
/* ------------------------------------------------------------------ */

/** Simulated environment detection. In a real Electron/Tauri host these
 *  would call child_process or Command API.  For the web-based IDE we
 *  expose a mock that can be replaced by a real backend adapter.        */
async function detectEnvironments(): Promise<PythonEnvironment[]> {
  // Simulated delay
  await new Promise(r => setTimeout(r, 600));

  // Return common placeholder environments — real impl would shell out
  return [
    {
      name: "urban-analytics",
      path: "~/.conda/envs/urban-analytics",
      version: "3.11.7",
      type: "conda",
      packageCount: 142,
      isActive: true,
    },
    {
      name: ".venv",
      path: "./venv",
      version: "3.12.1",
      type: "venv",
      packageCount: 38,
      isActive: false,
    },
    {
      name: "system",
      path: "/usr/bin/python3",
      version: "3.10.12",
      type: "system",
      packageCount: 214,
      isActive: false,
    },
  ];
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function usePythonEnvironments() {
  const [envs, setEnvs] = useState<PythonEnvironment[]>([]);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const detect = useCallback(async () => {
    setStatus("detecting");
    setError(null);
    try {
      const result = await detectEnvironments();
      setEnvs(result);
      setStatus("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  const activate = useCallback((name: string) => {
    setEnvs(prev =>
      prev.map(env => ({
        ...env,
        isActive: env.name === name,
      })),
    );
  }, []);

  useEffect(() => { void detect(); }, [detect]);

  return { envs, status, error, detect, activate } as const;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                            */
/* ------------------------------------------------------------------ */

const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 10,
  padding: 14,
  background: "#1a1a1a",
  borderRadius: 8,
  color: "#e0e0e0",
  fontFamily: "var(--font-mono, monospace)",
  fontSize: 13,
};

const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#f5a623",
};

const refreshBtn: React.CSSProperties = {
  padding: "3px 10px",
  borderRadius: 4,
  border: "1px solid #333",
  background: "#262626",
  color: "#e0e0e0",
  cursor: "pointer",
  fontSize: 11,
};

const envRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  padding: "8px 10px",
  borderRadius: 6,
  background: "#222",
  cursor: "pointer",
  transition: "background 0.15s",
};

const activeRow: React.CSSProperties = {
  ...envRow,
  background: "#2a2410",
  border: "1px solid #f5a62366",
};

const badge: React.CSSProperties = {
  padding: "1px 7px",
  borderRadius: 3,
  fontSize: 10,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};

const activeBadge: React.CSSProperties = {
  ...badge,
  background: "#2e7d32",
  color: "#c8e6c9",
};

const inactiveBadge: React.CSSProperties = {
  ...badge,
  background: "#333",
  color: "#999",
};

const typeBadge = (type: PythonEnvironment["type"]): React.CSSProperties => {
  const colors: Record<string, string> = {
    conda: "#44a340",
    venv: "#2979ff",
    system: "#888",
  };
  return {
    ...badge,
    background: `${colors[type] ?? "#888"  }22`,
    color: colors[type] ?? "#888",
    border: `1px solid ${colors[type] ?? "#888"}44`,
  };
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export interface PythonEnvironmentManagerProps {
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export default function PythonEnvironmentManager({
  className,
  style,
}: PythonEnvironmentManagerProps) {
  const { envs, status, error, detect, activate } = usePythonEnvironments();

  return (
    <div style={{ ...containerStyle, ...style }} className={className}>
      {/* Header */}
      <div style={headerStyle}>
        <span style={titleStyle}>Python Environments</span>
        <button type="button" style={refreshBtn} onClick={() => void detect()} disabled={status === "detecting"}>
          {status === "detecting" ? "Scanning…" : "Refresh"}
        </button>
      </div>

      {/* Status */}
      {status === "detecting" && (
        <div style={{ color: "#aaa", fontSize: 12 }}>Scanning for Python environments…</div>
      )}
      {status === "error" && (
        <div style={{ color: "#ef5350", fontSize: 12 }}>Error: {error}</div>
      )}

      {/* Environment list */}
      {envs.map(env => (
        <div
          key={env.name}
          style={env.isActive ? activeRow : envRow}
          onClick={() => activate(env.name)}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if (e.key === "Enter") activate(env.name); }}
        >
          {/* Status dot */}
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: env.isActive ? "#4caf50" : "#555",
              flexShrink: 0,
            }}
          />

          {/* Name + path */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{env.name}</div>
            <div style={{ fontSize: 11, color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {env.path}
            </div>
          </div>

          {/* Type badge */}
          <span style={typeBadge(env.type)}>{env.type}</span>

          {/* Version */}
          <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>
            v{env.version}
          </span>

          {/* Package count */}
          <span style={{ fontSize: 11, color: "#aaa", whiteSpace: "nowrap" }}>
            {env.packageCount} pkgs
          </span>

          {/* Active badge */}
          <span style={env.isActive ? activeBadge : inactiveBadge}>
            {env.isActive ? "Active" : "Inactive"}
          </span>
        </div>
      ))}

      {/* Empty state */}
      {status === "ready" && envs.length === 0 && (
        <div style={{ color: "#888", fontSize: 12, padding: "12px 0", textAlign: "center" }}>
          No Python environments detected. Install Python or create a virtual environment.
        </div>
      )}
    </div>
  );
}
