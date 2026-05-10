/**
 * kill-port.cjs — Kills any process listening on the given port(s).
 * Runs automatically via the "predev" npm script on Windows.
 * Usage:  node scripts/kill-port.cjs [port1] [port2] ...
 */
'use strict';

const { execSync } = require('child_process');
const ports = process.argv.slice(2).length ? process.argv.slice(2) : ['3000'];

let netstatOut;
try {
  netstatOut = execSync('netstat -ano', { encoding: 'utf8' });
} catch { /* netstat unavailable — safe to ignore */ }

if (!netstatOut) process.exit(0);

for (const port of ports) {
  try {
    const pids = new Set();
    for (const line of netstatOut.split('\n')) {
      // Match lines like "  TCP    127.0.0.1:3000    0.0.0.0:0    LISTENING    12345"
      if (line.includes('LISTENING') && new RegExp(`:${port}\\s`).test(line)) {
        const pid = line.trim().split(/\s+/).pop();
        if (pid && +pid > 0) pids.add(+pid);
      }
    }
    for (const pid of pids) {
      try {
        process.kill(pid, 'SIGTERM');
        console.log(`[kill-port] Terminated PID ${pid} on port ${port}`);
      } catch { /* already gone */ }
    }
  } catch { /* no matches for this port — safe to ignore */ }
}
