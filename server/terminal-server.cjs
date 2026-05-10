/**
 * Synapse IDE — Real Terminal Server
 * Bridges xterm.js (browser) ↔ node-pty (OS shell) over WebSocket.
 * Run: node server/terminal-server.cjs
 * Default port: 9231 (configurable via SYNAPSE_TERM_PORT env var)
 */

'use strict';

const { WebSocketServer } = require('ws');
const pty = require('node-pty');
const os = require('os');
const url = require('url');

const PORT = parseInt(process.env.SYNAPSE_TERM_PORT || '9231', 10);

// Map ShellType names to actual executables
const IS_WIN = os.platform() === 'win32';

// On Windows, node-pty requires full absolute paths or executables on PATH.
// PowerShell 7 (pwsh) is preferred; fall back to Windows PowerShell 5 if absent.
function resolveWinShell(...candidates) {
  const fs = require('fs');
  for (const c of candidates) {
    try { if (fs.existsSync(c)) return c; } catch {}
  }
  return candidates[candidates.length - 1]; // last resort even if missing
}

const WIN_PWSH  = resolveWinShell(
  'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
  'C:\\Program Files\\PowerShell\\7\\pwsh.exe',
  'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe'
);
const WIN_PS5   = 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe';
const WIN_CMD   = 'C:\\Windows\\System32\\cmd.exe';
const WIN_BASH  = resolveWinShell(
  'C:\\Program Files\\Git\\bin\\bash.exe',
  'C:\\Windows\\System32\\bash.exe'
);
const WIN_WSL   = 'C:\\Windows\\System32\\wsl.exe';

const SHELL_MAP = {
  powershell: IS_WIN ? WIN_PWSH  : 'pwsh',
  cmd:        IS_WIN ? WIN_CMD   : '/bin/sh',
  bash:       IS_WIN ? WIN_BASH  : '/bin/bash',
  zsh:        IS_WIN ? WIN_BASH  : '/bin/zsh',
  fish:       IS_WIN ? WIN_BASH  : '/usr/bin/fish',
  node:       'node',
  python:     IS_WIN ? 'python'  : 'python3',
  gitbash:    IS_WIN ? WIN_BASH  : '/bin/bash',
  wsl:        IS_WIN ? WIN_WSL   : '/bin/bash',
  ruby:       'ruby',
  php:        'php',
  docker:     'docker',
};

const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 30;
const CWD = process.cwd();

const wss = new WebSocketServer({ port: PORT, host: '127.0.0.1' });

console.log(`[synapse-term] Terminal server listening on ws://127.0.0.1:${PORT}`);

wss.on('connection', (ws, req) => {
  const params = new url.URL(req.url || '/', `http://127.0.0.1:${PORT}`).searchParams;
  const shellKey = params.get('shell') || 'powershell';
  const shell = SHELL_MAP[shellKey] || SHELL_MAP['powershell'];
  const cols = parseInt(params.get('cols') || String(DEFAULT_COLS), 10);
  const rows = parseInt(params.get('rows') || String(DEFAULT_ROWS), 10);

  let ptyProcess;
  try {
    ptyProcess = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols,
      rows,
      cwd: CWD,
      // useConpty: false avoids the AttachConsole failed error from
      // conpty_console_list_agent.js when running in a piped/non-console host.
      useConpty: false,
      env: Object.assign({}, process.env, {
        COLORTERM: 'truecolor',
        TERM: 'xterm-256color',
      }),
    });
  } catch (err) {
    // Shell binary not found — try default PowerShell/sh fallback
    const fallback = IS_WIN ? WIN_PS5 : '/bin/sh';
    console.warn(`[synapse-term] Shell "${shell}" not found, falling back to "${fallback}": ${err.message}`);
    try {
      ptyProcess = pty.spawn(fallback, [], {
        name: 'xterm-color',
        cols,
        rows,
        cwd: CWD,
        useConpty: false,
        env: Object.assign({}, process.env, { TERM: 'xterm-256color' }),
      });
    } catch (fallbackErr) {
      ws.send(JSON.stringify({ type: 'error', message: `Could not start any shell: ${fallbackErr.message}` }));
      ws.close();
      return;
    }
  }

  console.log(`[synapse-term] Spawned PID ${ptyProcess.pid} (${shell}) cols=${cols} rows=${rows}`);

  // pty → browser
  ptyProcess.onData(data => {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'data', data }));
    }
  });

  ptyProcess.onExit(({ exitCode }) => {
    console.log(`[synapse-term] PID ${ptyProcess.pid} exited with code ${exitCode}`);
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify({ type: 'exit', code: exitCode }));
      ws.close();
    }
  });

  // browser → pty
  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw.toString()); } catch { return; }

    if (msg.type === 'input' && typeof msg.data === 'string') {
      ptyProcess.write(msg.data);
    } else if (msg.type === 'resize') {
      const c = Math.max(1, Math.min(512, msg.cols || DEFAULT_COLS));
      const r = Math.max(1, Math.min(256, msg.rows || DEFAULT_ROWS));
      ptyProcess.resize(c, r);
    }
  });

  ws.on('close', () => {
    try { ptyProcess.kill(); } catch {}
    console.log(`[synapse-term] Connection closed, killed PID ${ptyProcess.pid}`);
  });

  ws.on('error', err => {
    console.error(`[synapse-term] WS error:`, err.message);
    try { ptyProcess.kill(); } catch {}
  });
});

wss.on('error', err => {
  console.error(`[synapse-term] Server error:`, err.message);
});
