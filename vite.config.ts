import { createLogger, defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'
import { execSync } from 'child_process'
import type { IncomingMessage, ServerResponse } from 'http'

// Lightweight body reader (small JSON payloads only)
async function readBody(req: IncomingMessage): Promise<string> {
  return await new Promise((resolve, reject) => {
    const bufs: Buffer[] = []
    req.on('data', d => bufs.push(d))
    req.on('end', () => resolve(Buffer.concat(bufs).toString('utf8')))
    req.on('error', reject)
  })
}

// Minimal in-process API plugin (dev only) to remove need for external /api proxy server.
// Handles:
//  POST /api/openai/verify  { key }
//  POST /api/chat  { model, messages:[{role,content}], temperature?, top_p?, max_tokens?, apiKey? }
// Streams OpenAI chat or responses SSE with immediate flushing.
function isResponsesModel(model: string) {
  return String(model || '').trim().toLowerCase().startsWith('gpt-5')
}

function buildResponsesInput(messages: Array<{ role?: string; content?: unknown }>) {
  return messages.map((message) => ({
    type: 'message',
    role: message.role === 'assistant' ? 'assistant' : (message.role === 'system' ? 'system' : 'user'),
    content: typeof message.content === 'string' ? message.content : String(message.content ?? ''),
  }))
}

function buildOpenAIUpstreamRequest(payload: any, model: string) {
  if (isResponsesModel(model)) {
    return {
      url: 'https://api.openai.com/v1/responses',
      body: JSON.stringify({
        model,
        input: buildResponsesInput(Array.isArray(payload.messages) ? payload.messages : []),
        max_output_tokens: payload.max_tokens ?? undefined,
        stream: true,
      }),
    }
  }

  return {
    url: 'https://api.openai.com/v1/chat/completions',
    body: JSON.stringify({
      model,
      messages: Array.isArray(payload.messages) ? payload.messages : [],
      temperature: payload.temperature ?? undefined,
      top_p: payload.top_p ?? undefined,
      max_tokens: payload.max_tokens ?? undefined,
      stream: true,
    }),
  }
}

function formatUpstreamError(status: number, bodyText: string, model: string, retryAfterHeader: string | null) {
  let providerCode = `upstream_${status}`
  let detail = bodyText
  let userMessage = `OpenAI request failed with status ${status}.`
  let retryAfterMs: number | null = null

  if (retryAfterHeader) {
    const retrySeconds = Number(retryAfterHeader)
    if (Number.isFinite(retrySeconds) && retrySeconds >= 0) {
      retryAfterMs = Math.round(retrySeconds * 1000)
    }
  }

  try {
    const parsed = JSON.parse(bodyText || '{}') as { error?: { code?: string; type?: string; message?: string } }
    providerCode = parsed.error?.code || parsed.error?.type || providerCode
    detail = parsed.error?.message || detail
  } catch {}

  if (status === 429) {
    const normalizedCode = String(providerCode || '').toLowerCase()
    if (model.startsWith('gpt-5')) {
      userMessage = `OpenAI returned 429 for ${model}. The client can retry with another GPT-5 model.`
    } else if (normalizedCode.includes('insufficient_quota')) {
      userMessage = 'OpenAI returned 429 with an insufficient_quota response for this request.'
    } else if (normalizedCode.includes('rate_limit')) {
      userMessage = 'OpenAI rate-limited this request. Wait briefly or switch models.'
    } else {
      userMessage = 'OpenAI returned 429 for this request. This is usually model or project throttling.'
    }
  } else if (status === 401 || status === 403) {
    userMessage = 'OpenAI rejected the API key for this request.'
  } else if (status >= 500) {
    userMessage = 'OpenAI returned a server error.'
  }

  return {
    error: status === 429 ? 'rate_limit' : providerCode,
    code: status === 429 ? 'rate_limit' : providerCode,
    providerCode,
    status,
    detail,
    userMessage,
    retryAfterMs,
    category: status === 429 ? 'rate_limit' : (status >= 500 ? 'server' : (status === 401 || status === 403 ? 'auth' : 'unknown')),
  }
}

function devSseApiPlugin() {
  return {
    name: 'dev-sse-api-plugin',
    apply: 'serve' as const,
    configureServer(server: any) {
      const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY || ''
      server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        try {
          const { url, method } = req
          if (!url?.startsWith('/api/')) return next()

          // VERIFY ENDPOINT
            if (url === '/api/openai/verify' && method === 'POST') {
              let body = ''
              try { body = await readBody(req) } catch {}
              let key = ''
              try { key = String(JSON.parse(body)?.key || '').trim() } catch {}
              if (!key) {
                res.writeHead(400, { 'content-type': 'application/json' })
                return void res.end(JSON.stringify({ ok: false, error: 'missing_key' }))
              }
              try {
                const r = await fetch('https://api.openai.com/v1/models?limit=1', { headers: { Authorization: `Bearer ${key}` } })
                if (r.status === 200) {
                  res.writeHead(200, { 'content-type': 'application/json' })
                  return void res.end(JSON.stringify({ ok: true }))
                }
                const map: Record<number, string> = { 401: 'unauthorized', 403: 'unauthorized', 429: 'rate_limited' }
                const code = map[r.status] || 'upstream_error'
                res.writeHead(r.status === 429 ? 429 : (r.status === 401 || r.status === 403 ? 401 : 502), { 'content-type': 'application/json' })
                return void res.end(JSON.stringify({ ok: false, error: code, status: r.status }))
              } catch {
                res.writeHead(500, { 'content-type': 'application/json' })
                return void res.end(JSON.stringify({ ok: false, error: 'verify_exception' }))
              }
            }

          // CHAT STREAM ENDPOINT
          if (url === '/api/chat' && method === 'POST') {
            let bodyStr = ''
            try { bodyStr = await readBody(req) } catch {}
            let payload: any = {}
            try { if (bodyStr) payload = JSON.parse(bodyStr) } catch {
              res.writeHead(400, { 'content-type': 'application/json' })
              return void res.end(JSON.stringify({ error: 'invalid_json' }))
            }
            const messages = Array.isArray(payload.messages) ? payload.messages : []
            if (!messages.length) {
              res.writeHead(400, { 'content-type': 'application/json' })
              return void res.end(JSON.stringify({ error: 'messages_required' }))
            }
            const model = payload.model || 'gpt-5-mini'
            let key: string | undefined
            const auth = req.headers['authorization']
            if (typeof auth === 'string' && auth.toLowerCase().startsWith('bearer ')) key = auth.slice(7).trim()
            else if (typeof payload.apiKey === 'string') key = payload.apiKey.trim()
            else if (OPENAI_KEY) key = OPENAI_KEY
            if (!key) {
              res.writeHead(401, { 'content-type': 'application/json' })
              return void res.end(JSON.stringify({ error: 'missing_api_key' }))
            }

            // SSE headers
            res.writeHead(200, {
              'Content-Type': 'text/event-stream; charset=utf-8',
              'Cache-Control': 'no-cache, no-transform',
              'Connection': 'keep-alive'
            })
            res.write(':ok\n\n')

            const upstreamRequest = buildOpenAIUpstreamRequest(payload, model)

            let controllerAborted = false
            req.on('close', () => { controllerAborted = true })

            let upstream: Response
            try {
              upstream = await fetch(upstreamRequest.url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Accept: 'text/event-stream',
                  Authorization: `Bearer ${key}`
                },
                body: upstreamRequest.body
              })
            } catch {
              res.write(`event: error\n`)
              res.write(`data: {"error":"upstream_connect"}\n\n`)
              return void res.end()
            }
            if (!upstream.ok || !upstream.body) {
              const bodyText = await upstream.text().catch(() => '')
              const errorPayload = formatUpstreamError(
                upstream.status,
                bodyText,
                model,
                upstream.headers.get('retry-after')
              )
              res.write(`event: error\n`)
              res.write(`data: ${JSON.stringify(errorPayload)}\n\n`)
              return void res.end()
            }

            const reader = (upstream.body as ReadableStream<Uint8Array>).getReader()
            ;(async () => {
              try {
                while (true) {
                  const { done, value } = await reader.read()
                  if (done) break
                  if (controllerAborted) break
                  if (value) res.write(value)
                }
                res.write(':done\n\n')
                res.end()
              } catch {
                try {
                  res.write(`event: error\n`)
                  res.write(`data: {"error":"stream_failure"}\n\n`)
                } finally { res.end() }
              }
            })()
            return
          }

          // Unknown /api route
          if (url?.startsWith('/api/')) {
            res.writeHead(404, { 'content-type': 'application/json' })
            return void res.end(JSON.stringify({ error: 'not_found' }))
          }
          next()
        } catch {
          try {
            res.writeHead(500, { 'content-type': 'application/json' })
            res.end(JSON.stringify({ error: 'internal_plugin_error' }))
          } catch {}
        }
      })
    },
  }
}

// https://vite.dev/config/
const viteLogger = createLogger();
const viteLoggerWarn = viteLogger.warn;
const viteLoggerWarnOnce = viteLogger.warnOnce;

function isDuckDbSourcemapWarning(message: string): boolean {
  return message.includes('Sourcemap for "')
    && message.includes('@duckdb/duckdb-wasm/dist/duckdb-browser-')
    && message.includes('points to a source file outside its package');
}

viteLogger.warn = (message, options) => {
  if (isDuckDbSourcemapWarning(message)) {
    return;
  }

  viteLoggerWarn(message, options);
};

viteLogger.warnOnce = (message, options) => {
  if (isDuckDbSourcemapWarning(message)) {
    return;
  }

  viteLoggerWarnOnce(message, options);
};

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildProvenancePlugin(options: {
  appVersion: string;
  buildHash: string;
  buildTime: string;
}): Plugin {
  const tags = [
    ['synapse-app-version', options.appVersion],
    ['synapse-build-sha', options.buildHash],
    ['synapse-build-time', options.buildTime],
  ]
    .map(([name, content]) => `    <meta name="${name}" content="${escapeHtmlAttribute(content)}">`)
    .join('\n');

  return {
    name: 'synapse-build-provenance',
    transformIndexHtml(html) {
      return html.replace(/<head>/i, `<head>\n${tags}`);
    },
  };
}

export default defineConfig(() => {
  // Compute build-time provenance values and inject as VITE_* defines for runtime access
  const fnvHex = (str: string): string => {
    let h = 0x811c9dc5
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i)
      // 32-bit FNV-1a
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
    }
    return h.toString(16).padStart(8, '0')
  }
  const safeRead = (p: string): string => {
    try { return fs.readFileSync(path.resolve(__dirname, p), 'utf8') } catch { return '' }
  }
  const pkgJson = safeRead('package.json')
  let appVersion = '0.0.0'
  try { appVersion = JSON.parse(pkgJson)?.version || '0.0.0' } catch {}
  let buildHash = 'dev'
  try { buildHash = execSync('git rev-parse --short=12 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim() } catch {}
  const buildTime = new Date().toISOString()
  const recipesHash = fnvHex(safeRead('src/centerpanel/Tools/export/recipes.ts'))
  const profilesHash = fnvHex(safeRead('src/centerpanel/Tools/export/deid/profiles.ts'))
  const normalizeId = (id: string): string => id.split(path.win32.sep).join('/')
  const manualChunkName = (id: string): string | undefined => {
    const normalized = normalizeId(id)

    if (normalized.includes('/node_modules/')) {
      if (normalized.includes('/monaco-editor/') || normalized.includes('/@monaco-editor/')) return 'vendor-monaco'
      if (normalized.includes('/three/') || normalized.includes('/@react-three/') || normalized.includes('/three-stdlib/')) return 'vendor-three'
      if (
        normalized.includes('/@deck.gl/') ||
        normalized.includes('/deck.gl/') ||
        normalized.includes('/maplibre-gl/') ||
        normalized.includes('/react-map-gl/') ||
        normalized.includes('/@vis.gl/react-google-maps/') ||
        normalized.includes('/@googlemaps/')
      ) return 'vendor-maps'
      if (
        normalized.includes('/@duckdb/') ||
        normalized.includes('/arquero/') ||
        normalized.includes('/apache-arrow/') ||
        normalized.includes('/parquet-wasm/') ||
        normalized.includes('/flatgeobuf/')
      ) return 'vendor-data'
      if (
        normalized.includes('/plotly.js') ||
        normalized.includes('/react-plotly.js/') ||
        normalized.includes('/chart.js/') ||
        normalized.includes('/react-chartjs-2/') ||
        normalized.includes('/recharts/')
      ) return 'vendor-charts'
      if (
        normalized.includes('/html2pdf.js/')
      ) return 'vendor-html2pdf'
      if (normalized.includes('/html2canvas/')) return 'vendor-html2canvas'
      if (normalized.includes('/pdf-lib/')) return 'vendor-pdf'
      if (normalized.includes('/@tensorflow/') || normalized.includes('/openai/')) return 'vendor-ai'
      if (normalized.includes('/react/') || normalized.includes('/react-dom/') || normalized.includes('/react-router-dom/')) return 'vendor-react'
    }

    if (normalized.includes('/src/features/dashboard/ScenarioComparisonDashboard')) return 'app-scenario-dashboard'
    if (normalized.includes('/src/features/dashboard/')) return 'app-dashboard'
    if (normalized.includes('/src/features/education/MethodologyExplainer')) return 'app-education-explainers'
    if (normalized.includes('/src/features/education/DatasetLibraryBrowser')) return 'app-education-datasets'
    if (normalized.includes('/src/features/education/exercises/')) return 'app-education-exercises'
    if (normalized.includes('/src/features/education/')) return 'app-education'
    if (normalized.includes('/src/services/reporting/')) return 'app-reporting'
    if (normalized.includes('/src/centerpanel/Flows/')) return undefined
    if (
      normalized.includes('/src/centerpanel/components/map/') ||
      normalized.includes('/src/centerpanel/components/Map')
    ) return 'app-map-explorer'
    if (normalized.includes('/src/centerpanel/Guide/')) return 'app-centerpanel-guide'
    if (normalized.includes('/src/centerpanel/Tools/')) return 'app-centerpanel-tools'
    if (normalized.includes('/src/centerpanel/registry-ui/') || normalized.includes('/src/centerpanel/registry/')) return 'app-centerpanel-registry'
    if (
      normalized.includes('/src/centerpanel/components/') ||
      normalized.includes('/src/centerpanel/rail/') ||
      normalized.includes('/src/centerpanel/nav/') ||
      normalized.includes('/src/centerpanel/hooks/') ||
      normalized.includes('/src/centerpanel/lib/') ||
      normalized.includes('/src/centerpanel/config/')
    ) return 'app-centerpanel-shell'
    if (normalized.includes('/src/centerpanel/')) return 'app-centerpanel'
    if (normalized.includes('/src/features/urbanAnalytics/voxcity/')) return 'app-urban-voxcity'
    if (normalized.includes('/src/features/urbanAnalytics/seeds/')) return 'app-urban-seeds'
    if (normalized.includes('/src/features/urbanAnalytics/calculators/')) return 'app-urban-calculators'
    if (normalized.includes('/src/features/urbanAnalytics/rail/')) return 'app-urban-rail'
    if (normalized.includes('/src/features/urbanAnalytics/lib/')) return 'app-urban-analytics-lib'
    if (normalized.includes('/src/features/urbanAnalytics/store')) return 'app-urban-store'
    if (
      normalized.includes('/src/features/urbanAnalytics/UrbanAnalyticsModal') ||
      normalized.includes('/src/features/urbanAnalytics/RightPanel') ||
      normalized.includes('/src/features/urbanAnalytics/WelcomeModal') ||
      normalized.includes('/src/features/urbanAnalytics/icons')
    ) return 'app-urban-modal'
    if (normalized.includes('/src/features/urbanAnalytics/')) return 'app-urban-analytics'
    if (normalized.includes('/src/components/map/') || normalized.includes('/src/services/map/')) return 'app-mapping'
    if (
      normalized.includes('/src/components/editor/') ||
      normalized.includes('/src/components/file-explorer/') ||
      normalized.includes('/src/components/ide/')
    ) return 'app-workspace'

    return undefined
  }
  return {
  customLogger: viteLogger,
  plugins: [react(), buildProvenancePlugin({ appVersion, buildHash, buildTime }), devSseApiPlugin()],
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
    'import.meta.env.VITE_BUILD_HASH': JSON.stringify(buildHash),
    'import.meta.env.VITE_BUILD_TIME': JSON.stringify(buildTime),
    'import.meta.env.VITE_RECIPES_HASH': JSON.stringify(recipesHash),
    'import.meta.env.VITE_PROFILES_HASH': JSON.stringify(profilesHash),
  },
  resolve: {
    // Force a single copy of React across all chunks. Without this guard,
    // Vite's optimize-deps re-runs (e.g. after editing files that introduce
    // a new import graph during dev) can produce two React instances —
    // surfacing as "Invalid hook call" / "resolveDispatcher is null" inside
    // hooks like zustand's `useSyncExternalStore`.
    dedupe: ['react', 'react-dom', 'scheduler'],
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/styles': path.resolve(__dirname, './src/styles'),
      '@/contexts': path.resolve(__dirname, './src/contexts'),
      '@/pages': path.resolve(__dirname, './src/pages'),
  '@/features': path.resolve(__dirname, './src/features'),
      '@/assets': path.resolve(__dirname, './src/assets'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/stores': path.resolve(__dirname, './src/stores'),
      '@/ai': path.resolve(__dirname, './src/ai'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
  server: {
    host: '127.0.0.1',
    port: 3000,
    strictPort: false,
    open: true,
    hmr: {
      host: '127.0.0.1',
    },
    proxy: {
      // Dev-only proxy to call local Ollama from the browser without CORS issues
      '/ollama': {
        target: 'http://localhost:11434',
        changeOrigin: true,
        // keep path like /ollama/api/* -> http://localhost:11434/api/*
        rewrite: (p) => p.replace(/^\/ollama/, ''),
      },
      // Dev-only proxy for OpenAI to avoid browser CORS on SSE
      '/openai': {
        target: 'https://api.openai.com',
        changeOrigin: true,
        secure: true,
        // keep path like /openai/v1/* -> https://api.openai.com/v1/*
        rewrite: (p) => p.replace(/^\/openai/, ''),
      },
      // NOTE: /api/* is now handled in-process by devSseApiPlugin(); external proxy disabled.
    },
  },
  optimizeDeps: {
    include: [
      // Pre-bundle React + zustand together so dev HMR cannot split them
      // across re-optimization passes (root cause of "two copies of React").
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'scheduler',
      'use-sync-external-store/shim',
      'zustand',
      'zustand/middleware',
      'zustand/middleware/immer',
      '@react-three/drei',
      '@react-three/fiber',
      '@react-three/postprocessing',
      'postprocessing',
      'three',
      'three-stdlib',
    ],
    // pdf-lib's ESM package shape is inconsistent in some environments;
    // keep it out of pre-bundling so dev/e2e boot remains stable.
    exclude: ['pdf-lib'],
  },
  build: {
    outDir: 'dist',
    manifest: true,
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rolldownOptions: {
      checks: {
        pluginTimings: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: manualChunkName,
      }
    }
  },
  }
})
