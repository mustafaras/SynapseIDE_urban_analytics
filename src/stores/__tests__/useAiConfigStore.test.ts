import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

async function freshAiConfigStore() {
  vi.resetModules();
  const globalWithCache = globalThis as typeof globalThis & {
    __AI_MODEL_CACHE?: Map<string, { ts: number; models: string[] }>;
  };
  delete globalWithCache.__AI_MODEL_CACHE;
  const mod = await import("../useAiConfigStore");
  return mod.useAiConfigStore;
}

beforeEach(() => {
  Object.defineProperty(globalThis, "localStorage", {
    value: createMemoryStorage(),
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("useAiConfigStore", () => {
  it("does not probe local Ollama automatically when no base URL is configured", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const store = await freshAiConfigStore();

    await store.getState().refreshModels("ollama");
    await store.getState().refreshKeyStatus("ollama");

    expect(fetchMock).not.toHaveBeenCalled();
    expect(store.getState().keyStatus.ollama).toMatchObject({
      state: "unknown",
      message: "Ollama base URL not configured",
    });
  });

  it("probes the configured Ollama base URL instead of falling back to localhost", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ models: [{ name: "llama3.2:latest" }] }),
    });
    vi.stubGlobal("fetch", fetchMock);
    const store = await freshAiConfigStore();

    store.setState({
      keys: {
        ...store.getState().keys,
        ollama: { baseUrl: "http://10.0.0.42:11434/" },
      },
    });

    await store.getState().refreshModels("ollama");

    expect(fetchMock).toHaveBeenCalledWith("http://10.0.0.42:11434/api/tags");
    expect(store.getState().modelList.ollama).toContain("llama3.2:latest");
  });
});
