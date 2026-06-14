#!/usr/bin/env node

import { spawn } from 'node:child_process';

const commands = [
  {
    name: 'vite',
    command: process.execPath,
    args: ['--max-old-space-size=12288', 'node_modules/vite/bin/vite.js'],
  },
  {
    name: 'terminal',
    command: process.execPath,
    args: ['server/terminal-server.cjs'],
  },
];

let shuttingDown = false;
const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    stdio: 'inherit',
    shell: false,
    windowsHide: true,
  });

  child.on('exit', (code, signal) => {
    if (shuttingDown) return;
    shuttingDown = true;
    for (const processToStop of children) {
      if (processToStop !== child && processToStop.exitCode === null) {
        processToStop.kill();
      }
    }
    if (signal) {
      console.error(`[${name}] exited with signal ${signal}`);
      process.exit(1);
    }
    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    if (shuttingDown) return;
    console.error(`[${name}] failed to start: ${error.message}`);
    stopAll('SIGTERM');
    process.exit(1);
  });

  return child;
});

function stopAll(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    if (child.exitCode === null) {
      child.kill(signal);
    }
  }
}

process.on('SIGINT', () => stopAll('SIGINT'));
process.on('SIGTERM', () => stopAll('SIGTERM'));
