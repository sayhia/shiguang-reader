import { spawn } from 'node:child_process';
import { watch } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./', import.meta.url));
const profile = process.env.DSH_PROFILE || 'desktop';
let running = false;
let queued = false;
let timer = null;

function build(reason) {
  if (running) {
    queued = true;
    return;
  }
  running = true;
  console.log(`[watch] rebuilding (${reason})`);
  const child = spawn(process.execPath, [join(root, 'build.mjs')], {
    cwd: root,
    stdio: 'inherit',
  });
  child.on('exit', (code) => {
    if (code !== 0) {
      running = false;
      console.error(`[watch] build failed with exit code ${code}`);
      if (queued) {
        queued = false;
        build('queued change');
      }
      return;
    }
    // The profile already uses a link:, so rebuilding the client is the install.
    // Re-run the profile link as well so package metadata stays current.
    console.log(`[watch] linking into profile ${profile}`);
    const link = spawn('dsh', ['plugin', '--profile', profile, 'add', 'link:' + root], {
      cwd: root,
      stdio: 'inherit',
    });
    link.on('exit', (linkCode) => {
      running = false;
      if (linkCode === 0) {
        console.log('[watch] installed; refresh the Web UI to load it. Host files still need a plugin reload/restart.');
      } else {
        console.error(`[watch] profile link failed with exit code ${linkCode}`);
      }
      if (queued) {
        queued = false;
        build('queued change');
      }
    });
  });
}

function schedule(reason) {
  if (timer) clearTimeout(timer);
  timer = setTimeout(() => {
    timer = null;
    build(reason);
  }, 120);
}

build('initial build');

const watcher = watch(join(root, 'source'), { recursive: true }, (event, filename) => {
  if (!filename || !/\.(js|json)$/i.test(filename)) return;
  schedule(filename);
});

watcher.on('error', (error) => {
  console.error('[watch] source watcher failed:', error);
  process.exitCode = 1;
});

process.on('SIGINT', () => {
  watcher.close();
  process.exit(0);
});
process.on('SIGTERM', () => {
  watcher.close();
  process.exit(0);
});
