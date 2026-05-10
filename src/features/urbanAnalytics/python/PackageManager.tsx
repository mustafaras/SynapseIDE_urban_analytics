// Urban Analytics Workbench — Package Manager
// List installed packages, install via pip, one-click "Install Urban Stack"
import { useCallback, useState } from "react";

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

export type PkgStatus = "installed" | "outdated" | "missing";

export interface PackageInfo {
  readonly name: string;
  readonly version: string;
  readonly latestVersion: string;
  readonly status: PkgStatus;
}

export interface InstallProgress {
  readonly name: string;
  readonly phase: "queued" | "downloading" | "installing" | "done" | "error";
  readonly message: string;
}

/* ------------------------------------------------------------------ */
/*  Urban stack definition                                            */
/* ------------------------------------------------------------------ */

/** Core Python packages required for the Urban Analytics Workbench. */
export const URBAN_STACK_PACKAGES = [
  "geopandas",
  "osmnx",
  "networkx",
  "pysal",
  "libpysal",
  "esda",
  "momepy",
  "pandana",
  "rasterio",
  "rasterstats",
  "shapely",
  "fiona",
  "folium",
  "mapclassify",
  "contextily",
  "matplotlib",
  "seaborn",
  "scikit-learn",
  "scipy",
  "numpy",
  "pandas",
  "h3",
  "pydeck",
  "xarray",
  "pyproj",
] as const;

/* ------------------------------------------------------------------ */
/*  Simulated backend (replace with real subprocess in Electron/Tauri) */
/* ------------------------------------------------------------------ */

async function fetchInstalledPackages(): Promise<PackageInfo[]> {
  await new Promise(r => setTimeout(r, 500));
  return [
    { name: "geopandas", version: "0.14.3", latestVersion: "0.14.3", status: "installed" },
    { name: "osmnx", version: "1.9.1", latestVersion: "1.9.3", status: "outdated" },
    { name: "networkx", version: "3.2.1", latestVersion: "3.2.1", status: "installed" },
    { name: "pysal", version: "24.1", latestVersion: "24.1", status: "installed" },
    { name: "rasterio", version: "1.3.9", latestVersion: "1.3.10", status: "outdated" },
    { name: "shapely", version: "2.0.3", latestVersion: "2.0.3", status: "installed" },
    { name: "folium", version: "0.16.0", latestVersion: "0.16.0", status: "installed" },
    { name: "matplotlib", version: "3.8.3", latestVersion: "3.8.3", status: "installed" },
    { name: "numpy", version: "1.26.4", latestVersion: "1.26.4", status: "installed" },
    { name: "pandas", version: "2.2.0", latestVersion: "2.2.1", status: "outdated" },
    { name: "momepy", version: "", latestVersion: "0.7.0", status: "missing" },
    { name: "pandana", version: "", latestVersion: "0.7.0", status: "missing" },
  ];
}

async function simulateInstall(name: string, onProgress: (p: InstallProgress) => void): Promise<void> {
  onProgress({ name, phase: "downloading", message: `Downloading ${name}…` });
  await new Promise(r => setTimeout(r, 800));
  onProgress({ name, phase: "installing", message: `Installing ${name}…` });
  await new Promise(r => setTimeout(r, 600));
  onProgress({ name, phase: "done", message: `${name} installed successfully.` });
}

/* ------------------------------------------------------------------ */
/*  Hook                                                              */
/* ------------------------------------------------------------------ */

export function usePackageManager() {
  const [packages, setPackages] = useState<PackageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [installing, setInstalling] = useState<InstallProgress | null>(null);
  const [filter, setFilter] = useState<"all" | PkgStatus>("all");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const pkgs = await fetchInstalledPackages();
      setPackages(pkgs);
    } finally {
      setLoading(false);
    }
  }, []);

  const install = useCallback(async (name: string) => {
    setInstalling({ name, phase: "queued", message: `Queued ${name}` });
    try {
      await simulateInstall(name, setInstalling);
      // Mark package as installed after success
      setPackages(prev =>
        prev.map(p =>
          p.name === name ? { ...p, status: "installed" as const, version: p.latestVersion } : p,
        ),
      );
    } catch {
      setInstalling({ name, phase: "error", message: `Failed to install ${name}` });
    }
  }, []);

  const installUrbanStack = useCallback(async () => {
    const missing = packages.filter(p => p.status === "missing");
    for (const pkg of missing) {
      await install(pkg.name);
    }
    setInstalling(null);
  }, [packages, install]);

  const filtered = filter === "all" ? packages : packages.filter(p => p.status === filter);

  return { packages: filtered, allPackages: packages, loading, installing, filter, setFilter, refresh, install, installUrbanStack } as const;
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

const titleStyle: React.CSSProperties = {
  fontWeight: 600,
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  color: "#f5a623",
};

const headerRow: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
};

const pillBtn = (active: boolean): React.CSSProperties => ({
  padding: "3px 10px",
  borderRadius: 4,
  border: active ? "1px solid #f5a623" : "1px solid #333",
  background: active ? "#f5a62322" : "#262626",
  color: active ? "#f5a623" : "#aaa",
  cursor: "pointer",
  fontSize: 11,
  fontWeight: active ? 600 : 400,
});

const actionBtn: React.CSSProperties = {
  padding: "5px 14px",
  borderRadius: 5,
  border: "none",
  background: "#f5a623",
  color: "#1a1a1a",
  cursor: "pointer",
  fontSize: 12,
  fontWeight: 600,
};

const pkgRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "6px 10px",
  borderRadius: 5,
  background: "#222",
};

const statusDot = (status: PkgStatus): React.CSSProperties => {
  const colorMap: Record<PkgStatus, string> = {
    installed: "#4caf50",
    outdated: "#ff9800",
    missing: "#ef5350",
  };
  return { width: 8, height: 8, borderRadius: "50%", background: colorMap[status], flexShrink: 0 };
};

/* ------------------------------------------------------------------ */
/*  Component                                                         */
/* ------------------------------------------------------------------ */

export interface PackageManagerProps {
  className?: string | undefined;
  style?: React.CSSProperties | undefined;
}

export default function PackageManager({ className, style }: PackageManagerProps) {
  const {
    packages,
    allPackages,
    loading,
    installing,
    filter,
    setFilter,
    refresh,
    install,
    installUrbanStack,
  } = usePackageManager();

  // auto-load on mount
  useState(() => { void refresh(); });

  const missingCount = allPackages.filter(p => p.status === "missing").length;

  return (
    <div style={{ ...containerStyle, ...style }} className={className}>
      {/* Header */}
      <div style={headerRow}>
        <span style={titleStyle}>Packages</span>
        <div style={{ display: "flex", gap: 4 }}>
          {(["all", "installed", "outdated", "missing"] as const).map(f => (
            <button key={f} type="button" style={pillBtn(filter === f)} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
        <button type="button" style={{ ...actionBtn, background: "#333", color: "#e0e0e0" }} onClick={() => void refresh()} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {/* Install Urban Stack */}
      {missingCount > 0 && (
        <button
          type="button"
          style={actionBtn}
          onClick={() => void installUrbanStack()}
          disabled={installing !== null}
        >
          Install Urban Stack ({missingCount} missing)
        </button>
      )}

      {/* Progress indicator */}
      {!!installing && (
        <div style={{ fontSize: 12, padding: "6px 10px", borderRadius: 5, background: "#1e3a1e", color: "#a5d6a7" }}>
          {installing.phase === "error"
            ? <span style={{ color: "#ef5350" }}>{installing.message}</span>
            : <span>{installing.message}</span>}
        </div>
      )}

      {/* Package list */}
      {packages.map(pkg => (
        <div key={pkg.name} style={pkgRow}>
          <span style={statusDot(pkg.status)} title={pkg.status} />
          <span style={{ flex: 1, fontWeight: 500 }}>{pkg.name}</span>
          <span style={{ fontSize: 11, color: "#aaa", width: 60, textAlign: "right" }}>
            {pkg.version || "—"}
          </span>
          {pkg.status === "outdated" && (
            <span style={{ fontSize: 10, color: "#ff9800" }}>→ {pkg.latestVersion}</span>
          )}
          {(pkg.status === "missing" || pkg.status === "outdated") && (
            <button
              type="button"
              style={{ ...actionBtn, padding: "2px 8px", fontSize: 11 }}
              onClick={() => void install(pkg.name)}
              disabled={installing !== null}
            >
              {pkg.status === "missing" ? "Install" : "Update"}
            </button>
          )}
        </div>
      ))}

      {/* Empty state */}
      {!loading && packages.length === 0 && (
        <div style={{ color: "#888", fontSize: 12, textAlign: "center", padding: "12px 0" }}>
          No packages match this filter.
        </div>
      )}
    </div>
  );
}
