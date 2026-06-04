import { afterEach, describe, expect, it, vi } from "vitest";

function createMemoryStorage(): Storage {
  const store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { for (const key of Object.keys(store)) delete store[key]; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] ?? null,
  };
}

function ensureLocalStorage(options: { clear?: boolean } = {}): Storage {
  if (typeof globalThis.localStorage === "undefined") {
    Object.defineProperty(globalThis, "localStorage", {
      value: createMemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
  if (options.clear !== false) {
    globalThis.localStorage.clear();
  }
  return globalThis.localStorage;
}

async function freshToolbarPreferencesStore(options: { clearStorage?: boolean } = {}) {
  ensureLocalStorage({ clear: options.clearStorage });
  vi.resetModules();
  const mod = await import("../useMapToolbarPreferencesStore");
  return mod.useMapToolbarPreferencesStore;
}

afterEach(() => {
  vi.resetModules();
  globalThis.localStorage?.clear();
});

describe("useMapToolbarPreferencesStore", () => {
  it("defaults to the analyst lens with comfortable density", async () => {
    const store = await freshToolbarPreferencesStore();

    expect(store.getState().taskLens).toBe("analyst");
    expect(store.getState().density).toBe("comfortable");
  });

  it("persists only lightweight toolbar layout preferences", async () => {
    const store = await freshToolbarPreferencesStore();

    store.getState().setTaskLens("reviewer");
    store.getState().setDensity("comfortable");

    const raw = globalThis.localStorage.getItem("synapse-map-toolbar-preferences");
    expect(raw).toBeTruthy();
    const parsed = JSON.parse(raw!) as { state: Record<string, unknown> };

    expect(parsed.state).toEqual({
      density: "comfortable",
      taskLens: "reviewer",
    });
    expect(Object.keys(parsed.state).sort()).toEqual(["density", "taskLens"]);
  });

  it("normalizes legacy or invalid persisted preferences to lightweight defaults", async () => {
    const storage = ensureLocalStorage();
    storage.setItem("synapse-map-toolbar-preferences", JSON.stringify({
      state: {
        density: "expert",
        taskLens: "unknown",
        overlayLayers: [{ id: "should-not-hydrate" }],
      },
      version: 0,
    }));

    const store = await freshToolbarPreferencesStore({ clearStorage: false });

    expect(store.getState().density).toBe("comfortable");
    expect(store.getState().taskLens).toBe("analyst");
    expect("overlayLayers" in store.getState()).toBe(false);
  });
});
