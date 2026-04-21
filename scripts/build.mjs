import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const DIST = 'dist';
if (existsSync(DIST)) rmSync(DIST, { recursive: true });
mkdirSync(DIST, { recursive: true });

const copy = (src) => cpSync(src, join(DIST, src), { recursive: true });

for (const item of ['index.html', 'style.css', 'manifest.json', 'service-worker.js', 'src', 'assets']) {
  copy(item);
}
console.log('Build complete ->', DIST);
