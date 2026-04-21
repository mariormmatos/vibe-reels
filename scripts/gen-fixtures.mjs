#!/usr/bin/env node
// Gera fixtures para testes de integração.
// Requer `ffmpeg` no PATH. Instalar:
//   Windows: winget install ffmpeg
//   macOS:   brew install ffmpeg
//   Linux:   apt install ffmpeg
//
// Uso: npm run gen:fixtures

import { spawnSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'tests', 'fixtures');
mkdirSync(DIR, { recursive: true });

const check = spawnSync('ffmpeg', ['-version']);
if (check.status !== 0) {
  console.error('❌ ffmpeg não encontrado no PATH.');
  console.error('   Windows: winget install ffmpeg');
  console.error('   macOS:   brew install ffmpeg');
  console.error('   Linux:   apt install ffmpeg');
  process.exit(1);
}

function run(name, args) {
  console.log(`→ ${name}`);
  const r = spawnSync('ffmpeg', args, { stdio: ['ignore', 'ignore', 'inherit'] });
  if (r.status !== 0) {
    console.error(`❌ falhou a gerar ${name}`);
    process.exit(r.status ?? 1);
  }
}

run('short.mp4', [
  '-f', 'lavfi',
  '-i', 'color=c=0x3366cc:size=1080x1920:d=10:r=30,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-an', '-y',
  join(DIR, 'short.mp4')
]);

run('wide.mp4', [
  '-f', 'lavfi',
  '-i', 'color=c=0xcc3366:size=1920x1080:d=8:r=30,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23', '-an', '-y',
  join(DIR, 'wide.mp4')
]);

run('photo.jpg', [
  '-f', 'lavfi',
  '-i', 'color=c=0x66cc33:size=1080x1920:d=1',
  '-frames:v', '1', '-y',
  join(DIR, 'photo.jpg')
]);

console.log('✅ fixtures geradas em tests/fixtures/');
