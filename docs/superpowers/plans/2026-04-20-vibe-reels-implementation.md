# Vibe Reels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first PWA that lets iPhone users create 9:16 Instagram Reels by picking media, choosing one of three aesthetic templates, adjusting start moments, and exporting an MP4 to their Photos library — all client-side with zero backend.

**Architecture:** 100% static PWA hosted on GitHub Pages. FFmpeg.wasm in a Web Worker handles all video processing with a trim-first-then-assemble pipeline to respect iOS Safari memory limits. CSS filters approximate LUTs for live preview; the export applies real LUT 3D files.

**Tech Stack:** Vanilla HTML/CSS/JS (no framework), `@ffmpeg/ffmpeg` (WASM port of FFmpeg), Vitest for tests, GitHub Actions for CI, GitHub Pages for hosting.

**Spec:** See [2026-04-20-vibe-reels-design.md](../specs/2026-04-20-vibe-reels-design.md)

**Project root (absolute):** `C:/Users/ripth/Documents/0003 - Vibe Coding/Vibe Reels/`
All file paths below are relative to this root unless noted.

---

## Phase A — Scaffolding

### Task 1: Initialize repository and folder structure

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `.gitattributes`
- Create: empty directories `src/screens/`, `assets/luts/`, `assets/icons/`, `assets/thumbs/`, `assets/fonts/`, `tests/unit/`, `tests/integration/`, `tests/fixtures/`, `.github/workflows/`

- [ ] **Step 1: Initialize git and Node project**

```bash
cd "C:/Users/ripth/Documents/0003 - Vibe Coding/Vibe Reels"
git init -b main
npm init -y
```

- [ ] **Step 2: Overwrite `package.json` with the correct content**

```json
{
  "name": "vibe-reels",
  "version": "0.1.0",
  "description": "Mobile-first PWA to create Instagram Reels with aesthetic templates.",
  "type": "module",
  "scripts": {
    "dev": "python -m http.server 8080",
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "node scripts/build.mjs"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "ffprobe-static": "^3.1.0",
    "fluent-ffmpeg": "^2.1.3"
  },
  "dependencies": {
    "@ffmpeg/ffmpeg": "^0.12.10",
    "@ffmpeg/util": "^0.12.1"
  }
}
```

- [ ] **Step 3: Create `.gitignore`**

```
node_modules/
dist/
.DS_Store
*.log
.env
.env.local
.vscode/
.idea/
coverage/
```

- [ ] **Step 4: Create `.gitattributes`**

```
* text=auto eol=lf
*.cube binary
*.mp4 binary
*.jpg binary
*.png binary
*.woff2 binary
```

- [ ] **Step 5: Create folder structure with placeholder `.gitkeep` files**

```bash
mkdir -p src/screens assets/luts assets/icons assets/thumbs assets/fonts tests/unit tests/integration tests/fixtures .github/workflows
touch src/screens/.gitkeep assets/luts/.gitkeep assets/icons/.gitkeep assets/thumbs/.gitkeep assets/fonts/.gitkeep tests/unit/.gitkeep tests/integration/.gitkeep tests/fixtures/.gitkeep
```

- [ ] **Step 6: Install dependencies**

Run: `npm install`
Expected: `node_modules/` populated, no errors, `package-lock.json` created.

- [ ] **Step 7: Commit scaffold**

```bash
git add .
git commit -m "chore: initial project scaffold"
```

---

### Task 2: Create context files (CLAUDE.md, CONTEXTO.md, INSTRUCOES.md)

**Files:**
- Create: `CLAUDE.md`
- Create: `CONTEXTO.md`
- Create: `INSTRUCOES.md`
- Create: `README.md`
- Create: `Changelog.md`

- [ ] **Step 1: Create `CLAUDE.md`**

```markdown
# Vibe Reels — Claude Code context

## Stack e justificação

- **Frontend:** HTML/CSS/JS vanilla, sem framework. Bundle ~30 KB. Justificação: a app tem 6 ecrãs, estado simples, e o custo/benefício de React/Vue não compensa para este scope.
- **Processamento de vídeo:** FFmpeg.wasm num Web Worker. Lazy-loaded (~30 MB) só no export. Justificação: único pipeline suportado em browser que faz color grading LUT 3D + concat + transições + drawtext.
- **Testes:** Vitest (unit + integration com FFmpeg nativo).
- **Hosting:** GitHub Pages, deploy via GitHub Actions em push para `main`.
- **Sem backend, sem auth, sem DB** — tudo client-side.

## Decisões de arquitectura

- **Trim-first, concat-later**: cada clip é pré-processado isoladamente antes do assembly final, para caber na memória do iPhone.
- **CSS filter preview + LUT real no export**: preview é aproximação, export é fiel.
- **Estado em memória apenas**: fechar a app perde selecções. IndexedDB é Could, não Must.
- **Scope fechado**: 3 templates pré-definidos (Golden Hour, Night Out, Travel), sem speed ramping, sem música, sem texto editável excepto em Travel.

## O que NÃO fazer neste projecto

- Não introduzir frameworks (React, Vue, Svelte) sem discussão explícita.
- Não adicionar backend (Supabase, Railway) — tudo client-side.
- Não expandir o número de templates além de 3 no MVP.
- Não adicionar features do "Won't" do spec (música, speed ramping, text editing, multi-user, etc.).
- Não tratar Android/Desktop como targets — iOS Safari viewport 390px é o único target de teste.
- Não usar CDNs de terceiros em runtime — tudo self-hosted.

## Workflows

- Correr `npm test` antes de cada commit.
- Correr `npm run dev` para servir localmente (Python http.server na porta 8080).
- Ver spec: `docs/superpowers/specs/2026-04-20-vibe-reels-design.md`.
- Ver plano: `docs/superpowers/plans/2026-04-20-vibe-reels-implementation.md`.
```

- [ ] **Step 2: Create `CONTEXTO.md`**

```markdown
# Vibe Reels — Contexto

## Missão

PWA mobile-first que permite ao utilizador criar Reels de Instagram estéticos escolhendo fotos/vídeos e aplicando um de três templates pré-definidos.

## Utilizadores-alvo

Pessoas com interesse em conteúdo visual apelativo, conhecimento técnico de edição médio-baixo.

## Features (MoSCoW)

### Must
- 3 templates: Golden Hour, Night Out, Travel.
- Selecção de fotos/vídeos via file input iOS.
- Slots fixos + picker de momento inicial.
- Input "Nome do local" no template Travel.
- Export MP4 9:16 (1080×1920) ≤30s sem áudio.
- Web Share API para guardar nas Fotos.
- Instalação PWA.
- UI dark minimalista.
- Deploy GitHub Pages.

### Should
- Cache FFmpeg via Service Worker.
- Progress bar + logs durante export.
- Validação upfront de duração mínima.
- Mensagens de erro em PT.

### Could
- IndexedDB para persistir selecções.
- Múltiplas qualidades de export.
- Marca de água subtil.

### Won't (nesta versão)
- Música/áudio no export.
- Speed ramping.
- Texto editável por slot.
- Beat detection.
- Accounts / auth.
- Backend.

## Critérios de sucesso

- User consegue criar e guardar um vídeo nas Fotos em <5 min sem instruções.
- Primeira carga <3s em 4G no iPhone.
- Export de 20-30s completa em <120s no iPhone 13+.
- Lighthouse PWA score ≥90.
- Zero erros console no happy path.
- 3 templates produzem outputs visualmente distinguíveis.
```

- [ ] **Step 3: Create `INSTRUCOES.md`**

```markdown
# Vibe Reels — Instruções para colaboração

## Princípios

- **Propor plano curto antes de qualquer alteração com impacto.** Se é refactor ou mudança arquitectural, descrever em 3-5 linhas antes de editar ficheiros.
- **Nunca remover funcionalidade existente sem instrução explícita.** Se achares que algo não serve, marca como candidato a remover, não removas.
- **Preferir soluções simples.** Se há duas formas, escolher a mais simples que cumpre o requisito.
- **Após cada evolução significativa, perguntar:** "Podia ter feito isto mais simples? Falta alguma feature útil de baixo custo?"

## Checklist pré-commit

Antes de fazer commit, verificar:
- [ ] `npm test` passa.
- [ ] Funciona no iPhone (viewport 390px no DevTools).
- [ ] Sem erros na consola.
- [ ] Dados do utilizador protegidos (nada sai do browser).
- [ ] Feature anterior ainda funciona (smoke manual).
- [ ] Commit message segue convenção (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).

## Convenções

- Código e commits em inglês; prosa de docs em PT.
- 2 espaços de indentação, linhas <100 chars.
- Ficheiros <200 linhas idealmente; >300 é sinal para dividir.
- Funções puras onde possível (ex: `ffmpeg-commands.js`).
- Zero bibliotecas de UI — escrever CSS à mão.
```

- [ ] **Step 4: Create `README.md`**

```markdown
# Vibe Reels

PWA mobile-first para criar Reels de Instagram estéticos no iPhone.

**Live:** https://mariormmatos.github.io/vibe-reels/

## Development

```bash
npm install
npm run dev      # Serve static files on http://localhost:8080
npm test         # Run unit + integration tests
```

## Docs

- Design spec: [docs/superpowers/specs/2026-04-20-vibe-reels-design.md](docs/superpowers/specs/2026-04-20-vibe-reels-design.md)
- Implementation plan: [docs/superpowers/plans/2026-04-20-vibe-reels-implementation.md](docs/superpowers/plans/2026-04-20-vibe-reels-implementation.md)
- Claude Code context: [CLAUDE.md](CLAUDE.md)

## Requirements (end-user)

- iPhone with iOS 16+ (Safari 16+).
- Recomendado: iPhone 13 ou superior para export rápido.
- Ligação à internet para primeiro carregamento (depois funciona offline).
```

- [ ] **Step 5: Create `Changelog.md`**

```markdown
# Changelog

All notable changes to Vibe Reels.

## [Unreleased]

- Initial scaffold.
```

- [ ] **Step 6: Commit**

```bash
git add CLAUDE.md CONTEXTO.md INSTRUCOES.md README.md Changelog.md
git commit -m "docs: add context files (CLAUDE, CONTEXTO, INSTRUCOES, README, Changelog)"
```

---

### Task 3: Vitest setup + sanity test

**Files:**
- Create: `vitest.config.js`
- Create: `tests/unit/sanity.test.js`

- [ ] **Step 1: Write the failing sanity test**

Create `tests/unit/sanity.test.js`:

```javascript
import { describe, it, expect } from 'vitest';

describe('sanity', () => {
  it('runs vitest', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 2: Create `vitest.config.js`**

```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.js'],
    testTimeout: 30000
  }
});
```

- [ ] **Step 3: Run the test**

Run: `npm test`
Expected: 1 test passed.

- [ ] **Step 4: Commit**

```bash
git add vitest.config.js tests/unit/sanity.test.js
git commit -m "test: add vitest config and sanity test"
```

---

### Task 4: GitHub Actions CI workflow (tests only, deploy added later)

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step 1: Create CI workflow**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test
```

- [ ] **Step 2: Commit**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions test workflow"
```

---

## Phase B — Data layer (pure, testable)

### Task 5: Templates definition + schema validation

**Files:**
- Create: `src/templates.js`
- Create: `tests/unit/templates.test.js`

- [ ] **Step 1: Write the failing schema tests**

Create `tests/unit/templates.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { TEMPLATES, validateTemplate } from '../../src/templates.js';

const REQUIRED_KEYS = ['id', 'name', 'description', 'slots', 'transition', 'cssFilter', 'lutFile', 'ffmpegFilters', 'textSlot', 'textStyle', 'thumbnail'];

describe('TEMPLATES', () => {
  it('exports exactly 3 templates', () => {
    expect(TEMPLATES).toHaveLength(3);
  });

  it('has ids: golden-hour, night-out, travel', () => {
    const ids = TEMPLATES.map(t => t.id).sort();
    expect(ids).toEqual(['golden-hour', 'night-out', 'travel']);
  });

  for (const id of ['golden-hour', 'night-out', 'travel']) {
    it(`template "${id}" passes validation`, () => {
      const t = TEMPLATES.find(t => t.id === id);
      expect(() => validateTemplate(t)).not.toThrow();
    });
  }

  it('every template has all required keys', () => {
    for (const t of TEMPLATES) {
      for (const key of REQUIRED_KEYS) {
        expect(t, `template ${t.id} missing key ${key}`).toHaveProperty(key);
      }
    }
  });

  it('total duration of every template is <=30s', () => {
    for (const t of TEMPLATES) {
      const total = t.slots.reduce((sum, s) => sum + s.duration, 0);
      expect(total, `template ${t.id} exceeds 30s`).toBeLessThanOrEqual(30);
    }
  });

  it('only Travel has text', () => {
    const travel = TEMPLATES.find(t => t.id === 'travel');
    expect(travel.textSlot).not.toBeNull();
    for (const t of TEMPLATES.filter(t => t.id !== 'travel')) {
      expect(t.textSlot).toBeNull();
    }
  });
});

describe('validateTemplate', () => {
  it('throws on missing id', () => {
    expect(() => validateTemplate({})).toThrow(/id/);
  });

  it('throws on empty slots', () => {
    expect(() => validateTemplate({
      id: 'x', name: 'X', description: '', slots: [],
      transition: { type: 'fade', duration: 0 },
      cssFilter: '', lutFile: null, ffmpegFilters: [],
      textSlot: null, textStyle: null, thumbnail: ''
    })).toThrow(/slots/);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with "cannot find module" or equivalent.

- [ ] **Step 3: Create `src/templates.js`**

```javascript
export const TEMPLATES = [
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm, soft, faded.',
    slots: [
      { type: 'video', duration: 5 },
      { type: 'video', duration: 4 },
      { type: 'photo', duration: 3 },
      { type: 'video', duration: 5 },
      { type: 'photo', duration: 3 }
    ],
    transition: { type: 'fade', duration: 0.4 },
    cssFilter: 'brightness(1.05) contrast(0.95) saturate(1.1) sepia(0.15)',
    lutFile: 'assets/luts/golden_hour.cube',
    ffmpegFilters: [],
    textSlot: null,
    textStyle: null,
    thumbnail: 'assets/thumbs/golden_hour.jpg'
  },
  {
    id: 'night-out',
    name: 'Night Out',
    description: 'Neon, saturated, punchy.',
    slots: [
      { type: 'video', duration: 5 },
      { type: 'video', duration: 4 },
      { type: 'video', duration: 4 },
      { type: 'video', duration: 3 }
    ],
    transition: { type: 'hardcut', duration: 0 },
    cssFilter: 'saturate(1.5) contrast(1.2) hue-rotate(-10deg) brightness(0.95)',
    lutFile: 'assets/luts/night_out.cube',
    ffmpegFilters: [],
    textSlot: null,
    textStyle: null,
    thumbnail: 'assets/thumbs/night_out.jpg'
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Natural & vivid, postcard vibes.',
    slots: [
      { type: 'photo', duration: 2 },
      { type: 'video', duration: 4 },
      { type: 'video', duration: 4 },
      { type: 'photo', duration: 2 },
      { type: 'video', duration: 5 },
      { type: 'photo', duration: 3 }
    ],
    transition: { type: 'zoom', duration: 0.3 },
    cssFilter: 'saturate(1.2) contrast(1.1) brightness(1.02)',
    lutFile: 'assets/luts/travel.cube',
    ffmpegFilters: [],
    textSlot: 5,
    textStyle: {
      font: 'postcard',
      size: 64,
      color: '#ffffff',
      position: 'center'
    },
    thumbnail: 'assets/thumbs/travel.jpg'
  }
];

const REQUIRED_KEYS = ['id', 'name', 'description', 'slots', 'transition', 'cssFilter', 'lutFile', 'ffmpegFilters', 'textSlot', 'textStyle', 'thumbnail'];
const VALID_SLOT_TYPES = new Set(['video', 'photo']);
const VALID_TRANSITION_TYPES = new Set(['fade', 'hardcut', 'zoom']);

export function validateTemplate(t) {
  if (!t || typeof t !== 'object') {
    throw new Error('template must be an object');
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in t)) {
      throw new Error(`template missing required key: ${key}`);
    }
  }
  if (!t.id || typeof t.id !== 'string') {
    throw new Error('template.id must be a non-empty string');
  }
  if (!Array.isArray(t.slots) || t.slots.length === 0) {
    throw new Error('template.slots must be a non-empty array');
  }
  for (const [i, slot] of t.slots.entries()) {
    if (!VALID_SLOT_TYPES.has(slot.type)) {
      throw new Error(`slot ${i} has invalid type: ${slot.type}`);
    }
    if (typeof slot.duration !== 'number' || slot.duration <= 0) {
      throw new Error(`slot ${i} has invalid duration: ${slot.duration}`);
    }
  }
  if (!VALID_TRANSITION_TYPES.has(t.transition?.type)) {
    throw new Error(`invalid transition type: ${t.transition?.type}`);
  }
  if (t.textSlot !== null && (t.textSlot < 0 || t.textSlot >= t.slots.length)) {
    throw new Error(`textSlot ${t.textSlot} out of range`);
  }
  return true;
}

export function getTemplate(id) {
  const t = TEMPLATES.find(t => t.id === id);
  if (!t) throw new Error(`template not found: ${id}`);
  return t;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (sanity + templates tests).

- [ ] **Step 5: Commit**

```bash
git add src/templates.js tests/unit/templates.test.js
git commit -m "feat(templates): define 3 templates with schema validation"
```

---

### Task 6: FFmpeg commands — pre-trim builder

**Files:**
- Create: `src/ffmpeg-commands.js`
- Create: `tests/unit/ffmpeg-commands.test.js`

- [ ] **Step 1: Write failing tests for pre-trim builder**

Create `tests/unit/ffmpeg-commands.test.js`:

```javascript
import { describe, it, expect } from 'vitest';
import { buildTrimCommand, buildPhotoToClipCommand } from '../../src/ffmpeg-commands.js';

describe('buildTrimCommand', () => {
  it('builds trim command for video slot', () => {
    const cmd = buildTrimCommand({
      inputName: 'input_0.mp4',
      startTime: 12,
      duration: 5,
      outputName: 'trimmed_0.mp4'
    });
    expect(cmd).toEqual([
      '-ss', '12', '-t', '5',
      '-i', 'input_0.mp4',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      '-an',
      '-y', 'trimmed_0.mp4'
    ]);
  });

  it('uses start=0 for video that starts at beginning', () => {
    const cmd = buildTrimCommand({
      inputName: 'input_1.mp4',
      startTime: 0,
      duration: 4,
      outputName: 'trimmed_1.mp4'
    });
    expect(cmd[1]).toBe('0');
    expect(cmd[3]).toBe('4');
  });
});

describe('buildPhotoToClipCommand', () => {
  it('converts photo to static clip of given duration', () => {
    const cmd = buildPhotoToClipCommand({
      inputName: 'input_2.jpg',
      duration: 3,
      outputName: 'trimmed_2.mp4'
    });
    expect(cmd).toEqual([
      '-loop', '1', '-i', 'input_2.jpg',
      '-t', '3',
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-y', 'trimmed_2.mp4'
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL with "cannot find module".

- [ ] **Step 3: Implement `src/ffmpeg-commands.js` pre-trim functions**

```javascript
export function buildTrimCommand({ inputName, startTime, duration, outputName }) {
  return [
    '-ss', String(startTime), '-t', String(duration),
    '-i', inputName,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
    '-an',
    '-y', outputName
  ];
}

export function buildPhotoToClipCommand({ inputName, duration, outputName }) {
  return [
    '-loop', '1', '-i', inputName,
    '-t', String(duration),
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-y', outputName
  ];
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/ffmpeg-commands.js tests/unit/ffmpeg-commands.test.js
git commit -m "feat(ffmpeg): add pre-trim command builders for videos and photos"
```

---

### Task 7: FFmpeg commands — assembly builder (concat + LUT + transitions + text)

**Files:**
- Modify: `src/ffmpeg-commands.js`
- Modify: `tests/unit/ffmpeg-commands.test.js`

- [ ] **Step 1: Add failing tests for assembly command**

Append to `tests/unit/ffmpeg-commands.test.js`:

```javascript
import { buildAssemblyCommand, buildPipeline } from '../../src/ffmpeg-commands.js';
import { getTemplate } from '../../src/templates.js';

describe('buildAssemblyCommand', () => {
  it('hardcut: concats inputs with LUT applied, no text', () => {
    const template = getTemplate('night-out');
    const inputs = ['trimmed_0.mp4', 'trimmed_1.mp4', 'trimmed_2.mp4', 'trimmed_3.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: null });
    expect(cmd).toContain('-i');
    expect(cmd.filter(a => a === '-i')).toHaveLength(4);
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/lut3d=file='assets\/luts\/night_out\.cube'/);
    expect(fc).toMatch(/concat=n=4:v=1:a=0/);
    expect(fc).not.toMatch(/drawtext/);
  });

  it('fade transition: uses xfade between clips', () => {
    const template = getTemplate('golden-hour');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: null });
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/xfade=transition=fade/);
  });

  it('zoom transition: uses xfade with zoom', () => {
    const template = getTemplate('travel');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4', 't5.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: 'Lisboa' });
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/xfade=transition=zoomin/);
  });

  it('Travel with text: includes drawtext on the text slot', () => {
    const template = getTemplate('travel');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4', 't5.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: 'Lisboa 2026' });
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/drawtext=/);
    expect(fc).toMatch(/text='Lisboa 2026'/);
  });

  it('output is always MP4 H.264 at 1080x1920 30fps', () => {
    const template = getTemplate('golden-hour');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: null });
    expect(cmd).toContain('-c:v');
    const vcodec = cmd[cmd.indexOf('-c:v') + 1];
    expect(vcodec).toBe('libx264');
    expect(cmd).toContain('output.mp4');
  });
});

describe('buildPipeline', () => {
  it('builds full sequence: pre-trim commands + assembly command', () => {
    const template = getTemplate('golden-hour');
    const inputs = [
      { file: { name: 'a.mp4' }, startTime: 0, type: 'video', duration: 5 },
      { file: { name: 'b.mp4' }, startTime: 10, type: 'video', duration: 4 },
      { file: { name: 'c.jpg' }, startTime: 0, type: 'photo', duration: 3 },
      { file: { name: 'd.mp4' }, startTime: 5, type: 'video', duration: 5 },
      { file: { name: 'e.jpg' }, startTime: 0, type: 'photo', duration: 3 }
    ];
    const pipeline = buildPipeline({ template, inputs, text: null });
    expect(pipeline).toHaveLength(6);
    expect(pipeline[0].kind).toBe('trim');
    expect(pipeline[1].kind).toBe('trim');
    expect(pipeline[2].kind).toBe('photo-to-clip');
    expect(pipeline[pipeline.length - 1].kind).toBe('assembly');
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: new tests FAIL.

- [ ] **Step 3: Implement assembly and pipeline in `src/ffmpeg-commands.js`**

Append to `src/ffmpeg-commands.js`:

```javascript
export function buildAssemblyCommand({ template, inputs, text }) {
  const args = [];
  for (const input of inputs) {
    args.push('-i', input);
  }

  const filterChain = buildFilterComplex(template, inputs.length, text);
  args.push('-filter_complex', filterChain);

  args.push(
    '-map', '[out]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-an',
    '-movflags', '+faststart',
    '-y', 'output.mp4'
  );
  return args;
}

function buildFilterComplex(template, numInputs, text) {
  const lut = template.lutFile;
  const scale = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1';
  const lutFilter = lut ? `,lut3d=file='${lut}'` : '';

  const chains = [];
  for (let i = 0; i < numInputs; i++) {
    chains.push(`[${i}:v]${scale}${lutFilter}[v${i}]`);
  }

  if (template.transition.type === 'hardcut') {
    const inputs = Array.from({ length: numInputs }, (_, i) => `[v${i}]`).join('');
    chains.push(`${inputs}concat=n=${numInputs}:v=1:a=0[concat]`);
  } else {
    const xfadeType = template.transition.type === 'fade' ? 'fade' : 'zoomin';
    const td = template.transition.duration;
    let prevLabel = 'v0';
    let accumOffset = template.slots[0].duration - td;
    for (let i = 1; i < numInputs; i++) {
      const nextLabel = i === numInputs - 1 ? 'concat' : `x${i}`;
      chains.push(`[${prevLabel}][v${i}]xfade=transition=${xfadeType}:duration=${td}:offset=${accumOffset.toFixed(3)}[${nextLabel}]`);
      prevLabel = nextLabel;
      accumOffset += template.slots[i].duration - td;
    }
  }

  if (template.textSlot !== null && text) {
    const safe = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    const style = template.textStyle;
    const y = style.position === 'top' ? 'h*0.1' : style.position === 'bottom' ? 'h*0.85' : '(h-text_h)/2';
    const offsetStart = template.slots.slice(0, template.textSlot).reduce((s, sl) => s + sl.duration, 0);
    const offsetEnd = offsetStart + template.slots[template.textSlot].duration;
    chains.push(`[concat]drawtext=text='${safe}':fontsize=${style.size}:fontcolor=${style.color}:x=(w-text_w)/2:y=${y}:enable='between(t,${offsetStart},${offsetEnd})':shadowcolor=black@0.6:shadowx=2:shadowy=2[out]`);
  } else {
    chains.push(`[concat]null[out]`);
  }

  return chains.join(';');
}

export function buildPipeline({ template, inputs, text }) {
  const steps = [];
  const trimmedNames = [];

  for (let i = 0; i < inputs.length; i++) {
    const slot = template.slots[i];
    const input = inputs[i];
    const inputName = `input_${i}${input.type === 'photo' ? '.jpg' : '.mp4'}`;
    const outputName = `trimmed_${i}.mp4`;
    trimmedNames.push(outputName);

    if (slot.type === 'video') {
      steps.push({
        kind: 'trim',
        inputFile: input.file,
        inputName,
        args: buildTrimCommand({
          inputName,
          startTime: input.startTime,
          duration: slot.duration,
          outputName
        }),
        outputName
      });
    } else {
      steps.push({
        kind: 'photo-to-clip',
        inputFile: input.file,
        inputName,
        args: buildPhotoToClipCommand({
          inputName,
          duration: slot.duration,
          outputName
        }),
        outputName
      });
    }
  }

  steps.push({
    kind: 'assembly',
    args: buildAssemblyCommand({ template, inputs: trimmedNames, text }),
    outputName: 'output.mp4'
  });

  return steps;
}
```

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: PASS (all unit tests green).

- [ ] **Step 5: Commit**

```bash
git add src/ffmpeg-commands.js tests/unit/ffmpeg-commands.test.js
git commit -m "feat(ffmpeg): add assembly command builder with LUT, transitions and text overlay"
```

---

## Phase C — UI shell

### Task 8: HTML shell + CSS design system

**Files:**
- Create: `index.html`
- Create: `style.css`

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="Vibe Reels">
  <meta name="theme-color" content="#0b0b0c">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="assets/icons/icon-180.png">
  <link rel="stylesheet" href="style.css">
  <title>Vibe Reels</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="src/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `style.css` design system**

```css
:root {
  --bg: #0b0b0c;
  --bg-elev: #17171a;
  --bg-elev-2: #232327;
  --fg: #f4f4f5;
  --fg-dim: #a1a1aa;
  --fg-subtle: #52525b;
  --accent: #ffffff;
  --danger: #ef4444;
  --safe-top: env(safe-area-inset-top);
  --safe-bottom: env(safe-area-inset-bottom);
  --radius: 16px;
  --radius-sm: 8px;
  --gap: 16px;
  --gap-sm: 8px;
  --font: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

html, body {
  height: 100%;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font);
  -webkit-font-smoothing: antialiased;
  overscroll-behavior: none;
}

body {
  padding-top: var(--safe-top);
  padding-bottom: var(--safe-bottom);
}

#app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

@media (orientation: landscape) and (max-height: 500px) {
  #app::before {
    content: "Roda o telemóvel para continuar";
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    width: 100%;
    font-size: 18px;
    color: var(--fg-dim);
  }
  #app > * { display: none; }
}

/* --- Layout helpers --- */
.screen {
  padding: 24px var(--gap);
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--gap);
}

.screen h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
}

.screen h2 {
  font-size: 14px;
  font-weight: 500;
  color: var(--fg-dim);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* --- Buttons --- */
.btn {
  display: block;
  width: 100%;
  padding: 16px;
  border: none;
  border-radius: var(--radius);
  background: var(--fg);
  color: var(--bg);
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.btn:disabled {
  background: var(--bg-elev-2);
  color: var(--fg-subtle);
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--bg-elev);
  color: var(--fg);
}

.btn-fixed-bottom {
  position: sticky;
  bottom: var(--gap);
  margin-top: auto;
}

/* --- Cards --- */
.card {
  background: var(--bg-elev);
  border-radius: var(--radius);
  padding: var(--gap);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}

.card:active {
  background: var(--bg-elev-2);
}

.card-invalid {
  background: color-mix(in srgb, var(--danger) 15%, var(--bg-elev));
  border: 1px solid var(--danger);
}

.card-thumb {
  width: 100%;
  aspect-ratio: 9/16;
  background: var(--bg-elev-2);
  border-radius: var(--radius-sm);
  background-size: cover;
  background-position: center;
  margin-bottom: 12px;
}

/* --- Inputs --- */
.input {
  width: 100%;
  padding: 14px;
  background: var(--bg-elev);
  color: var(--fg);
  border: 1px solid transparent;
  border-radius: var(--radius);
  font-family: inherit;
  font-size: 16px;
}

.input:focus {
  border-color: var(--fg-dim);
  outline: none;
}

.slider {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: var(--bg-elev-2);
  border-radius: 2px;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--fg);
  cursor: pointer;
}

/* --- Progress --- */
.progress {
  width: 100%;
  height: 6px;
  background: var(--bg-elev);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--fg);
  transition: width 0.2s ease-out;
}

/* --- Toast --- */
.toast {
  position: fixed;
  bottom: calc(var(--gap) + var(--safe-bottom));
  left: var(--gap);
  right: var(--gap);
  padding: 14px;
  background: var(--bg-elev-2);
  color: var(--fg);
  border-radius: var(--radius);
  text-align: center;
  animation: fadeIn 0.2s;
  z-index: 100;
  max-width: 448px;
  margin: 0 auto;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* --- Overlay --- */
.overlay {
  position: fixed;
  inset: 0;
  background: var(--bg);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--gap);
  gap: var(--gap);
  z-index: 50;
}

/* --- Video preview --- */
.preview-video {
  width: 100%;
  aspect-ratio: 9/16;
  object-fit: cover;
  border-radius: var(--radius);
  background: #000;
}
```

- [ ] **Step 3: Commit**

```bash
git add index.html style.css
git commit -m "feat(ui): add HTML shell and dark minimalist design system"
```

---

### Task 9: App state machine + router

**Files:**
- Create: `src/app.js`
- Create: `src/ui.js`

- [ ] **Step 1: Create `src/ui.js` with reusable helpers**

```javascript
export function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') e.innerHTML = v;
    else e[k] = v;
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

export function toast(msg, ms = 3000) {
  const t = el('div', { class: 'toast', textContent: msg });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export async function makeVideoThumb(file, atSeconds = 0.1) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = reject;
  });
  video.currentTime = Math.min(atSeconds, video.duration - 0.1);
  await new Promise(resolve => { video.onseeked = resolve; });
  const canvas = document.createElement('canvas');
  canvas.width = 270;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  const ratio = video.videoWidth / video.videoHeight;
  const targetRatio = 9 / 16;
  let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
  if (ratio > targetRatio) {
    sw = video.videoHeight * targetRatio;
    sx = (video.videoWidth - sw) / 2;
  } else {
    sh = video.videoWidth / targetRatio;
    sy = (video.videoHeight - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.7), duration: video.duration };
}

export async function makeImageThumb(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 270;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  const ratio = img.width / img.height;
  const targetRatio = 9 / 16;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ratio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.7) };
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
```

- [ ] **Step 2: Create `src/app.js` state machine skeleton**

```javascript
import { renderHome } from './screens/home.js';
import { renderPicker } from './screens/picker.js';
import { renderText } from './screens/text.js';
import { renderMoments } from './screens/moments.js';
import { renderExport } from './screens/export.js';
import { renderShare } from './screens/share.js';

const state = {
  screen: 'home',
  template: null,
  slots: [],
  text: null,
  exportBlob: null,
  exportProgress: 0,
  exportLog: ''
};

const SCREEN_RENDERERS = {
  home: renderHome,
  picker: renderPicker,
  text: renderText,
  moments: renderMoments,
  export: renderExport,
  share: renderShare
};

export function getState() {
  return state;
}

export function setState(partial) {
  Object.assign(state, partial);
  render();
}

export function goto(screen) {
  state.screen = screen;
  render();
}

export function resetState() {
  state.screen = 'home';
  state.template = null;
  state.slots = [];
  state.text = null;
  state.exportBlob = null;
  state.exportProgress = 0;
  state.exportLog = '';
  render();
}

function render() {
  const root = document.getElementById('app');
  root.innerHTML = '';
  const renderer = SCREEN_RENDERERS[state.screen];
  if (!renderer) throw new Error(`unknown screen: ${state.screen}`);
  root.appendChild(renderer(state));
}

window.addEventListener('DOMContentLoaded', () => {
  render();
});

window.addEventListener('popstate', (e) => {
  if (state.screen !== 'home' && state.screen !== 'share') {
    const ok = confirm('Perdes as selecções. Continuar?');
    if (ok) resetState();
    else history.pushState(null, '', location.href);
  }
});
history.pushState(null, '', location.href);
```

- [ ] **Step 3: Commit (screens don't exist yet; app.js will fail to load — expected)**

```bash
git add src/app.js src/ui.js
git commit -m "feat(app): add state machine and UI helpers"
```

---

### Task 10: Home screen (3 template cards)

**Files:**
- Create: `src/screens/home.js`

- [ ] **Step 1: Create `src/screens/home.js`**

```javascript
import { TEMPLATES } from '../templates.js';
import { setState, goto } from '../app.js';
import { el } from '../ui.js';

export function renderHome(state) {
  const screen = el('div', { class: 'screen' });

  screen.appendChild(el('h1', { textContent: 'Vibe Reels' }));
  screen.appendChild(el('p', { class: 'subtitle', textContent: 'Escolhe um template' , style: { color: 'var(--fg-dim)', marginBottom: '8px' } }));

  for (const t of TEMPLATES) {
    const card = el('div', {
      class: 'card',
      onclick: () => {
        setState({ template: t, slots: new Array(t.slots.length).fill(null) });
        goto(t.textSlot !== null ? 'picker' : 'picker');
      }
    }, [
      el('div', { class: 'card-thumb', style: { backgroundImage: `url(${t.thumbnail})` } }),
      el('h2', { textContent: t.name, style: { fontSize: '20px', color: 'var(--fg)', textTransform: 'none', letterSpacing: 0, marginBottom: '4px' } }),
      el('p', { textContent: t.description, style: { color: 'var(--fg-dim)', fontSize: '14px' } })
    ]);
    screen.appendChild(card);
  }

  return screen;
}
```

- [ ] **Step 2: Serve locally and smoke test**

Run: `npm run dev`
Open: `http://localhost:8080` in browser DevTools at viewport 390×844 (iPhone 15).
Expected: 3 template cards visible, dark background. Thumbnails missing (placeholder grey) — expected, added in later task.

- [ ] **Step 3: Commit**

```bash
git add src/screens/home.js
git commit -m "feat(home): render 3 template cards"
```

---

## Phase D — Input screens

### Task 11: Picker screen with slot cards + file input + validation

**Files:**
- Create: `src/screens/picker.js`

- [ ] **Step 1: Create `src/screens/picker.js`**

```javascript
import { getState, setState, goto } from '../app.js';
import { el, toast, makeVideoThumb, makeImageThumb, formatTime } from '../ui.js';

const MAX_FILE_SIZE = 200 * 1024 * 1024;

export function renderPicker(state) {
  const { template, slots } = state;
  const screen = el('div', { class: 'screen' });

  screen.appendChild(el('h1', { textContent: template.name }));
  screen.appendChild(el('h2', { textContent: 'Escolhe os clips e fotos' }));

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i];
    const filled = slots[i];
    const invalid = filled && filled.invalid;
    const card = el('div', {
      class: `card${invalid ? ' card-invalid' : ''}`,
      onclick: () => pickFile(i)
    }, [
      el('div', {
        class: 'card-thumb',
        style: filled && filled.thumb ? { backgroundImage: `url(${filled.thumb})` } : {}
      }),
      el('div', { style: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' } }, [
        el('span', { textContent: `${slot.type === 'video' ? 'Vídeo' : 'Foto'} ${i + 1}`, style: { fontWeight: 600 } }),
        el('span', { textContent: `${slot.duration}s`, style: { color: 'var(--fg-dim)', fontSize: '14px' } })
      ]),
      filled && filled.invalid && el('p', { textContent: filled.invalid, style: { color: 'var(--danger)', fontSize: '13px', marginTop: '6px' } })
    ]);
    screen.appendChild(card);
  }

  const allFilled = slots.every(s => s && !s.invalid);
  const continueBtn = el('button', {
    class: 'btn btn-fixed-bottom',
    disabled: !allFilled,
    textContent: 'Continuar',
    onclick: () => {
      if (template.textSlot !== null) goto('text');
      else goto('moments');
    }
  });
  screen.appendChild(continueBtn);

  return screen;
}

function pickFile(slotIndex) {
  const { template } = getState();
  const slotType = template.slots[slotIndex].type;
  const accept = slotType === 'video' ? 'video/*' : 'image/*';

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.onchange = async () => {
    const file = input.files[0];
    if (!file) return;
    const slotMeta = await validateAndPrep(file, template.slots[slotIndex]);
    const state = getState();
    const slots = [...state.slots];
    slots[slotIndex] = slotMeta;
    setState({ slots });
    if (slotMeta.invalid) toast(slotMeta.invalid);
  };
  input.click();
}

async function validateAndPrep(file, slot) {
  if (file.size > MAX_FILE_SIZE) {
    return { file, invalid: `Ficheiro muito grande (>200 MB). Escolhe outro.` };
  }
  try {
    if (slot.type === 'video') {
      const { dataUrl, duration } = await makeVideoThumb(file);
      if (duration < slot.duration) {
        return { file, thumb: dataUrl, duration, invalid: `Este vídeo tem ${duration.toFixed(1)}s, precisa de ≥${slot.duration}s.` };
      }
      return { file, thumb: dataUrl, duration, startTime: 0, type: 'video', slotDuration: slot.duration };
    } else {
      const { dataUrl } = await makeImageThumb(file);
      return { file, thumb: dataUrl, startTime: 0, type: 'photo', slotDuration: slot.duration };
    }
  } catch (e) {
    return { file, invalid: 'Este ficheiro não abre no browser.' };
  }
}
```

- [ ] **Step 2: Smoke test**

Run: `npm run dev`.
Open home → click Golden Hour → 5 slot cards appear. Tap a slot → file picker opens. Choose a photo or video → thumb should appear; if too short, red card with message.

- [ ] **Step 3: Commit**

```bash
git add src/screens/picker.js
git commit -m "feat(picker): slot cards with file input, validation, and thumbs"
```

---

### Task 12: Text screen (Travel only)

**Files:**
- Create: `src/screens/text.js`

- [ ] **Step 1: Create `src/screens/text.js`**

```javascript
import { getState, setState, goto } from '../app.js';
import { el } from '../ui.js';

export function renderText(state) {
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { textContent: 'Nome do local' }));
  screen.appendChild(el('h2', { textContent: 'Vai aparecer na última foto do vídeo' }));

  const input = el('input', {
    class: 'input',
    type: 'text',
    maxLength: 30,
    placeholder: 'ex: Lisboa 2026',
    value: state.text || '',
    oninput: (e) => {
      setStateNoRender({ text: e.target.value });
      btn.disabled = !e.target.value.trim();
    }
  });

  const btn = el('button', {
    class: 'btn btn-fixed-bottom',
    textContent: 'Continuar',
    disabled: !state.text || !state.text.trim(),
    onclick: () => goto('moments')
  });

  screen.appendChild(input);
  screen.appendChild(btn);
  return screen;
}

function setStateNoRender(partial) {
  Object.assign(getState(), partial);
}
```

- [ ] **Step 2: Smoke test**

Run: `npm run dev`. Pick Travel template → fill slots → continue leads to Text screen. Typing enables button.

- [ ] **Step 3: Commit**

```bash
git add src/screens/text.js
git commit -m "feat(text): location name input for Travel template"
```

---

### Task 13: Moments screen (slider + live CSS filter preview)

**Files:**
- Create: `src/screens/moments.js`

- [ ] **Step 1: Create `src/screens/moments.js`**

```javascript
import { getState, setState, goto } from '../app.js';
import { el, formatTime } from '../ui.js';

export function renderMoments(state) {
  const { template, slots } = state;
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { textContent: 'Momentos' }));
  screen.appendChild(el('h2', { textContent: 'Escolhe o início de cada vídeo' }));

  for (let i = 0; i < template.slots.length; i++) {
    const slot = template.slots[i];
    if (slot.type !== 'video') continue;
    const data = slots[i];
    const url = URL.createObjectURL(data.file);

    const video = el('video', {
      class: 'preview-video',
      src: url,
      muted: true,
      loop: true,
      autoplay: true,
      playsInline: true,
      style: { filter: template.cssFilter }
    });

    const max = Math.max(0, data.duration - slot.duration);
    const slider = el('input', {
      class: 'slider',
      type: 'range',
      min: 0,
      max: max,
      step: 0.1,
      value: data.startTime || 0,
      oninput: (e) => {
        const t = parseFloat(e.target.value);
        data.startTime = t;
        video.currentTime = t;
        label.textContent = `Usa ${slot.duration}s a começar em ${formatTime(t)}`;
      }
    });

    video.addEventListener('timeupdate', () => {
      if (video.currentTime > data.startTime + slot.duration) {
        video.currentTime = data.startTime;
      }
    });

    const label = el('p', {
      textContent: `Usa ${slot.duration}s a começar em ${formatTime(data.startTime || 0)}`,
      style: { color: 'var(--fg-dim)', fontSize: '13px' }
    });

    const card = el('div', { class: 'card' }, [
      el('div', { style: { fontWeight: 600, marginBottom: '8px' }, textContent: `Vídeo ${i + 1}` }),
      video,
      slider,
      label
    ]);
    screen.appendChild(card);
  }

  screen.appendChild(el('button', {
    class: 'btn btn-fixed-bottom',
    textContent: 'Exportar vídeo',
    onclick: () => goto('export')
  }));

  return screen;
}
```

- [ ] **Step 2: Smoke test**

Run: `npm run dev`. Select template, fill slots with videos, reach Moments screen. Sliders should scrub video; CSS filter visible.

- [ ] **Step 3: Commit**

```bash
git add src/screens/moments.js
git commit -m "feat(moments): slider + live CSS filter preview per video slot"
```

---

## Phase E — Export pipeline

### Task 14: FFmpeg Web Worker — message protocol + skeleton

**Files:**
- Create: `src/ffmpeg-worker.js`

- [ ] **Step 1: Create `src/ffmpeg-worker.js`**

```javascript
import { FFmpeg } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm';
import { fetchFile, toBlobURL } from 'https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm';

let ffmpeg = null;

async function ensureLoaded(postProgress) {
  if (ffmpeg) return ffmpeg;
  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => {
    self.postMessage({ type: 'log', message });
  });
  ffmpeg.on('progress', ({ progress }) => {
    postProgress(progress);
  });
  const base = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  await ffmpeg.load({
    coreURL: await toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm'),
  });
  return ffmpeg;
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  if (type === 'run') {
    try {
      await runPipeline(payload);
    } catch (err) {
      self.postMessage({ type: 'error', message: err?.message || String(err) });
    }
  }
};

async function runPipeline({ steps, lutFiles }) {
  const totalSteps = steps.length;
  let stepIdx = 0;
  const ff = await ensureLoaded((stepProgress) => {
    const overall = (stepIdx + stepProgress) / totalSteps;
    self.postMessage({ type: 'progress', value: Math.min(0.3 + 0.65 * overall, 0.95) });
  });
  self.postMessage({ type: 'progress', value: 0.3 });

  for (const [lutPath, lutBytes] of Object.entries(lutFiles)) {
    await ff.writeFile(lutPath, new Uint8Array(lutBytes));
  }

  for (const step of steps) {
    if (step.inputFile) {
      const data = new Uint8Array(await step.inputFile.arrayBuffer());
      await ff.writeFile(step.inputName, data);
    }
    const code = await ff.exec(step.args);
    if (code !== 0) {
      throw new Error(`ffmpeg exited with code ${code} on ${step.kind}`);
    }
    if (step.inputName) {
      try { await ff.deleteFile(step.inputName); } catch {}
    }
    stepIdx++;
  }

  const out = await ff.readFile('output.mp4');
  const blob = new Blob([out.buffer], { type: 'video/mp4' });
  self.postMessage({ type: 'done', blob });

  for (const step of steps) {
    if (step.outputName) {
      try { await ff.deleteFile(step.outputName); } catch {}
    }
  }
}
```

> **Note:** The import URLs use CDN for development simplicity. For production self-hosting (per spec §4), a later task will copy `@ffmpeg/core` into `assets/ffmpeg/` and update these URLs to relative paths. This is tracked in Task 20.

- [ ] **Step 2: Commit**

```bash
git add src/ffmpeg-worker.js
git commit -m "feat(worker): ffmpeg.wasm worker with message protocol"
```

---

### Task 15: Export screen wiring — pipeline orchestration

**Files:**
- Create: `src/screens/export.js`

- [ ] **Step 1: Create `src/screens/export.js`**

```javascript
import { getState, setState, goto } from '../app.js';
import { el } from '../ui.js';
import { buildPipeline } from '../ffmpeg-commands.js';

export function renderExport(state) {
  const screen = el('div', { class: 'overlay' });
  const title = el('h1', { textContent: 'A processar...', style: { fontSize: '20px', textAlign: 'center' } });
  const progress = el('div', { class: 'progress' }, [
    el('div', { class: 'progress-bar', style: { width: `${state.exportProgress}%` } })
  ]);
  const logs = el('pre', {
    style: {
      fontSize: '11px', color: 'var(--fg-subtle)', width: '100%', maxHeight: '120px',
      overflow: 'hidden', whiteSpace: 'pre-wrap', fontFamily: 'monospace'
    },
    textContent: state.exportLog || 'A iniciar motor de vídeo...'
  });
  const errBtn = state.exportError
    ? el('button', { class: 'btn', textContent: 'Tentar de novo', onclick: () => startExport() })
    : null;

  screen.append(title, progress, logs);
  if (errBtn) screen.append(el('p', { textContent: state.exportError, style: { color: 'var(--danger)', textAlign: 'center' } }), errBtn);

  if (!state.exportStarted) {
    queueMicrotask(() => startExport());
  }
  return screen;
}

let worker = null;

async function startExport() {
  const state = getState();
  setState({ exportStarted: true, exportError: null, exportProgress: 0, exportLog: 'A iniciar...' });

  worker = new Worker(new URL('../ffmpeg-worker.js', import.meta.url), { type: 'module' });

  const inputs = state.slots.map(s => ({
    file: s.file,
    startTime: s.startTime || 0,
    type: s.type,
    duration: s.duration
  }));
  const steps = buildPipeline({ template: state.template, inputs, text: state.text });

  const lutFiles = {};
  if (state.template.lutFile) {
    const res = await fetch(state.template.lutFile);
    const buf = await res.arrayBuffer();
    lutFiles[state.template.lutFile] = buf;
  }

  worker.onmessage = (e) => {
    const { type } = e.data;
    if (type === 'progress') {
      setState({ exportProgress: Math.round(e.data.value * 100) });
    } else if (type === 'log') {
      const prev = getState().exportLog;
      const line = e.data.message;
      const next = (prev + '\n' + line).split('\n').slice(-8).join('\n');
      setState({ exportLog: next });
    } else if (type === 'done') {
      setState({ exportBlob: e.data.blob, exportProgress: 100 });
      worker.terminate();
      worker = null;
      goto('share');
    } else if (type === 'error') {
      setState({ exportError: e.data.message, exportStarted: false });
    }
  };

  worker.postMessage({ type: 'run', payload: { steps, lutFiles } });
}
```

- [ ] **Step 2: Smoke test (browser)**

Run: `npm run dev`. Complete a full flow with short test videos → click Exportar. Expect:
- Overlay with progress bar.
- Logs ticking.
- Reaches 100% and navigates to Share screen OR shows error button.

(If the CDN import fails on `file://`, use `http://localhost:8080` — the dev server handles module imports.)

- [ ] **Step 3: Commit**

```bash
git add src/screens/export.js
git commit -m "feat(export): wire pipeline to worker with progress and error handling"
```

---

### Task 16: Share screen with Web Share API + fallback

**Files:**
- Create: `src/screens/share.js`

- [ ] **Step 1: Create `src/screens/share.js`**

```javascript
import { getState, resetState } from '../app.js';
import { el, toast } from '../ui.js';

export function renderShare(state) {
  const { exportBlob } = state;
  const screen = el('div', { class: 'screen' });
  screen.appendChild(el('h1', { textContent: 'Pronto!' }));

  const url = URL.createObjectURL(exportBlob);
  const video = el('video', {
    class: 'preview-video',
    src: url,
    controls: true,
    autoplay: true,
    playsInline: true,
    loop: true
  });
  screen.appendChild(video);

  const canShareFiles = typeof navigator.canShare === 'function'
    && navigator.canShare({ files: [new File([exportBlob], 'vibe-reels.mp4', { type: 'video/mp4' })] });

  const shareBtn = el('button', {
    class: 'btn',
    textContent: canShareFiles ? 'Guardar no iPhone' : 'Transferir vídeo',
    onclick: async () => {
      const file = new File([exportBlob], 'vibe-reels.mp4', { type: 'video/mp4' });
      if (canShareFiles) {
        try {
          await navigator.share({ files: [file], title: 'Vibe Reels' });
        } catch (e) {
          if (e.name !== 'AbortError') toast('Partilha falhou. Tenta o botão "Transferir".');
        }
      } else {
        const a = el('a', { href: url, download: 'vibe-reels.mp4', textContent: '' });
        document.body.appendChild(a);
        a.click();
        a.remove();
        toast('Toca e segura no vídeo acima → "Guardar em Fotos"');
      }
    }
  });

  const restartBtn = el('button', {
    class: 'btn btn-secondary',
    textContent: 'Criar outro',
    onclick: () => {
      URL.revokeObjectURL(url);
      resetState();
    }
  });

  screen.appendChild(shareBtn);
  screen.appendChild(restartBtn);
  return screen;
}
```

- [ ] **Step 2: Smoke test on iPhone Safari viewport**

Complete full flow. Share button triggers Web Share on iOS (or download on desktop).

- [ ] **Step 3: Commit**

```bash
git add src/screens/share.js
git commit -m "feat(share): preview result with Web Share API and download fallback"
```

---

## Phase F — PWA shell

### Task 17: PWA manifest + icons + Apple meta tags

**Files:**
- Create: `manifest.json`
- Create: `assets/icons/icon-180.png`, `icon-192.png`, `icon-512.png` (placeholders for now)

- [ ] **Step 1: Create `manifest.json`**

```json
{
  "name": "Vibe Reels",
  "short_name": "Vibe Reels",
  "description": "Create aesthetic Instagram Reels from your iPhone.",
  "start_url": "./",
  "scope": "./",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#0b0b0c",
  "theme_color": "#0b0b0c",
  "icons": [
    { "src": "assets/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "assets/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "assets/icons/icon-180.png", "sizes": "180x180", "type": "image/png", "purpose": "any" }
  ]
}
```

- [ ] **Step 2: Generate icon placeholders**

Use https://realfavicongenerator.net or any PNG tool. For now, create 3 solid-colour placeholder PNGs of the required sizes (dark grey, to be replaced later with branded icons). Save as `assets/icons/icon-180.png`, `icon-192.png`, `icon-512.png`.

If you need a quick placeholder via command line (requires ImageMagick):

```bash
magick -size 180x180 xc:#17171a assets/icons/icon-180.png
magick -size 192x192 xc:#17171a assets/icons/icon-192.png
magick -size 512x512 xc:#17171a assets/icons/icon-512.png
```

- [ ] **Step 3: Validate manifest**

Run: `npm run dev`. Open DevTools → Application → Manifest → verify no errors.

- [ ] **Step 4: Commit**

```bash
git add manifest.json assets/icons/
git commit -m "feat(pwa): add manifest and placeholder icons"
```

---

### Task 18: Service worker with cache + version detection

**Files:**
- Create: `service-worker.js`
- Modify: `src/app.js` (register worker)

- [ ] **Step 1: Create `service-worker.js`**

```javascript
const VERSION = 'v1';
const CACHE_STATIC = `vibe-reels-static-${VERSION}`;
const CACHE_FFMPEG = `vibe-reels-ffmpeg-${VERSION}`;

const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './manifest.json',
  './src/app.js',
  './src/ui.js',
  './src/templates.js',
  './src/ffmpeg-commands.js',
  './src/ffmpeg-worker.js',
  './src/screens/home.js',
  './src/screens/picker.js',
  './src/screens/text.js',
  './src/screens/moments.js',
  './src/screens/export.js',
  './src/screens/share.js',
  './assets/icons/icon-180.png',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/luts/golden_hour.cube',
  './assets/luts/night_out.cube',
  './assets/luts/travel.cube'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      Promise.all(STATIC_ASSETS.map((u) => cache.add(u).catch(() => null)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !k.endsWith(VERSION)).map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (url.hostname === 'unpkg.com' || url.hostname === 'cdn.jsdelivr.net') {
    e.respondWith(
      caches.open(CACHE_FFMPEG).then(async (cache) => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        if (fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      })
    );
    return;
  }
  if (url.origin === location.origin) {
    e.respondWith(
      caches.match(e.request).then((c) => c || fetch(e.request))
    );
  }
});
```

- [ ] **Step 2: Register the worker in `src/app.js`**

At the end of `src/app.js`, add:

```javascript
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('SW registration failed', err);
    });
  });
}
```

- [ ] **Step 3: Smoke test**

Run: `npm run dev`. Reload. DevTools → Application → Service Workers: should show active worker. Network tab → reload offline → app still loads.

- [ ] **Step 4: Commit**

```bash
git add service-worker.js src/app.js
git commit -m "feat(pwa): service worker with asset and ffmpeg caching"
```

---

### Task 19: LUT files + template thumbnails (binary assets)

**Files:**
- Create: `assets/luts/golden_hour.cube`, `night_out.cube`, `travel.cube`
- Create: `assets/thumbs/golden_hour.jpg`, `night_out.jpg`, `travel.jpg`

- [ ] **Step 1: Add 3 LUT `.cube` files**

Download 3 royalty-free 17³ or 33³ LUT files matching each vibe:

- **Golden Hour**: search "free lut warm sunset" (examples: RocketStock free LUT pack, IWLTBAP free pack).
- **Night Out**: search "free lut neon teal magenta" (try BlackMagic DaVinci free packs).
- **Travel**: search "free lut travel natural boost" (try IWLTBAP travel pack).

Save as:
- `assets/luts/golden_hour.cube`
- `assets/luts/night_out.cube`
- `assets/luts/travel.cube`

If no LUT available, create a minimal pass-through `.cube` as placeholder:

```
TITLE "passthrough"
LUT_3D_SIZE 2
0.0 0.0 0.0
1.0 0.0 0.0
0.0 1.0 0.0
1.0 1.0 0.0
0.0 0.0 1.0
1.0 0.0 1.0
0.0 1.0 1.0
1.0 1.0 1.0
```

- [ ] **Step 2: Add template thumbnail images**

Create 3 JPEG thumbnails (270×480, ~40 KB each) representing each template's vibe. Can be rendered from sample footage with the CSS filter applied, or designed in any image tool. Save as:
- `assets/thumbs/golden_hour.jpg`
- `assets/thumbs/night_out.jpg`
- `assets/thumbs/travel.jpg`

- [ ] **Step 3: Commit**

```bash
git add assets/luts/ assets/thumbs/
git commit -m "feat(assets): add LUT files and template thumbnails"
```

---

## Phase G — Testing & deploy

### Task 20: Integration test fixtures

**Files:**
- Create: `tests/fixtures/short.mp4` — 10s 1080×1920 H.264 MP4, ~2 MB.
- Create: `tests/fixtures/wide.mp4` — 8s 1920×1080 MP4, ~1.5 MB.
- Create: `tests/fixtures/photo.jpg` — 1080×1920 JPEG, ~200 KB.

- [ ] **Step 1: Generate `short.mp4`**

Run (requires system `ffmpeg`):

```bash
ffmpeg -f lavfi -i "color=c=0x3366cc:size=1080x1920:d=10:r=30,format=yuv420p" -c:v libx264 -preset ultrafast -crf 23 -an -y tests/fixtures/short.mp4
```

- [ ] **Step 2: Generate `wide.mp4`**

```bash
ffmpeg -f lavfi -i "color=c=0xcc3366:size=1920x1080:d=8:r=30,format=yuv420p" -c:v libx264 -preset ultrafast -crf 23 -an -y tests/fixtures/wide.mp4
```

- [ ] **Step 3: Generate `photo.jpg`**

```bash
ffmpeg -f lavfi -i "color=c=0x66cc33:size=1080x1920:d=1" -frames:v 1 -y tests/fixtures/photo.jpg
```

- [ ] **Step 4: Commit fixtures**

```bash
git add tests/fixtures/
git commit -m "test: add integration fixtures (short.mp4, wide.mp4, photo.jpg)"
```

---

### Task 21: Integration tests — one per template

**Files:**
- Create: `tests/integration/pipeline.test.js`

- [ ] **Step 1: Write integration tests**

```javascript
import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import ffprobe from 'ffprobe-static';
import { readFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getTemplate } from '../../src/templates.js';
import { buildPipeline } from '../../src/ffmpeg-commands.js';

const FIXTURES = join(process.cwd(), 'tests', 'fixtures');
const WORK = join(process.cwd(), 'tests', '_work');

function probe(file) {
  const r = spawnSync(ffprobe.path, ['-v', 'error', '-show_streams', '-show_format', '-of', 'json', file]);
  return JSON.parse(r.stdout.toString());
}

function runFfmpeg(args, cwd) {
  const r = spawnSync('ffmpeg', args, { cwd });
  if (r.status !== 0) {
    throw new Error(`ffmpeg failed: ${r.stderr.toString()}`);
  }
}

function prepareInputs(template, fixtures) {
  return template.slots.map((slot, i) => {
    const f = slot.type === 'video' ? fixtures.video : fixtures.photo;
    return {
      file: { name: f, arrayBuffer: async () => readFileSync(f).buffer },
      type: slot.type,
      startTime: 0,
      duration: slot.duration
    };
  });
}

async function runPipelineInNode(template, text) {
  if (existsSync(WORK)) rmSync(WORK, { recursive: true });
  mkdirSync(WORK, { recursive: true });

  const fixtures = {
    video: join(FIXTURES, 'short.mp4'),
    photo: join(FIXTURES, 'photo.jpg')
  };
  const inputs = prepareInputs(template, fixtures);
  const steps = buildPipeline({ template, inputs, text });

  for (const step of steps) {
    if (step.inputFile) {
      const fixture = step.kind === 'photo-to-clip' ? fixtures.photo : fixtures.video;
      const dest = join(WORK, step.inputName);
      const buf = readFileSync(fixture);
      require('node:fs').writeFileSync(dest, buf);
    }
    if (step.kind !== 'assembly') {
      runFfmpeg(step.args, WORK);
    } else {
      const lutSrc = join(process.cwd(), template.lutFile);
      if (existsSync(lutSrc)) {
        const lutDest = join(WORK, template.lutFile);
        mkdirSync(join(WORK, 'assets', 'luts'), { recursive: true });
        require('node:fs').copyFileSync(lutSrc, lutDest);
      }
      runFfmpeg(step.args, WORK);
    }
  }
  return join(WORK, 'output.mp4');
}

describe('pipeline integration', () => {
  beforeAll(() => {
    const check = spawnSync('ffmpeg', ['-version']);
    if (check.status !== 0) {
      throw new Error('ffmpeg not installed on PATH — required for integration tests');
    }
  });

  for (const id of ['golden-hour', 'night-out', 'travel']) {
    it(`produces valid MP4 for ${id}`, async () => {
      const template = getTemplate(id);
      const text = id === 'travel' ? 'Test' : null;
      const out = await runPipelineInNode(template, text);

      const meta = probe(out);
      const vStream = meta.streams.find(s => s.codec_type === 'video');
      const aStream = meta.streams.find(s => s.codec_type === 'audio');
      const dur = parseFloat(meta.format.duration);
      const expected = template.slots.reduce((s, sl) => s + sl.duration, 0);

      expect(vStream, 'has video stream').toBeDefined();
      expect(aStream, 'has no audio stream').toBeUndefined();
      expect(vStream.width).toBe(1080);
      expect(vStream.height).toBe(1920);
      expect(dur).toBeGreaterThan(expected - 1);
      expect(dur).toBeLessThan(expected + 1);
    }, 60000);
  }
});
```

- [ ] **Step 2: Run tests**

Ensure system `ffmpeg` is installed (`ffmpeg -version`). Then:

Run: `npm test`
Expected: unit + integration tests PASS. If `ffmpeg` is missing, install (Windows: `winget install ffmpeg`; Mac: `brew install ffmpeg`).

- [ ] **Step 3: Commit**

```bash
git add tests/integration/pipeline.test.js
git commit -m "test: add integration tests for pipeline per template"
```

---

### Task 22: GitHub Pages deploy workflow

**Files:**
- Create: `.github/workflows/deploy.yml`
- Create: `scripts/build.mjs`

- [ ] **Step 1: Create minimal build script**

Create `scripts/build.mjs`:

```javascript
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
```

- [ ] **Step 2: Create deploy workflow**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      - run: npm ci
      - run: npm test -- --run tests/unit/
      - run: npm run build
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
      - id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 3: Run build locally to verify**

Run: `npm run build`
Expected: `dist/` created with all runtime assets.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml scripts/build.mjs
git commit -m "ci: add build script and GitHub Pages deploy workflow"
```

---

### Task 23: Push to GitHub + enable Pages

- [ ] **Step 1: Create GitHub repo**

```bash
gh repo create mariormmatos/vibe-reels --public --source . --remote origin --push
```

Or, if `gh` not installed: create `mariormmatos/vibe-reels` on GitHub manually, then:

```bash
git remote add origin https://github.com/mariormmatos/vibe-reels.git
git branch -M main
git push -u origin main
```

- [ ] **Step 2: Enable Pages**

Visit `https://github.com/mariormmatos/vibe-reels/settings/pages`. Set Source to "GitHub Actions". Save.

- [ ] **Step 3: Verify deploy**

Wait for the Deploy workflow to finish. Visit `https://mariormmatos.github.io/vibe-reels/`. App should load.

- [ ] **Step 4: Add URL to README**

Already in README. Commit if badge or URL changed:

```bash
git commit --allow-empty -m "chore: trigger pages deploy"
git push
```

---

## Phase H — Final checklist

### Task 24: Final smoke checklist + release notes

**Files:**
- Modify: `Changelog.md`

- [ ] **Step 1: Run the full manual smoke checklist on real iPhone**

Open `https://mariormmatos.github.io/vibe-reels/` on iPhone Safari. Verify:
- [ ] Primeira carga <3s em 4G.
- [ ] Tap em "Adicionar ao Ecrã Principal" mostra ícone correcto.
- [ ] Abrir como PWA → arranca standalone sem UI do browser.
- [ ] Home mostra 3 cards com thumbnails.
- [ ] Fluxo Golden Hour: escolher 5 ficheiros → moments → export <120s → share.
- [ ] Fluxo Night Out: escolher 4 vídeos → moments → export → share.
- [ ] Fluxo Travel: escolher 6 ficheiros → texto → moments → export → share.
- [ ] Share Sheet guarda nas Fotos.
- [ ] Volta ao Home após "Criar outro".
- [ ] Zero erros na consola Safari (ligar via Safari Web Inspector no Mac, se disponível).
- [ ] Lighthouse PWA audit ≥90 (correr via Chrome DevTools).

- [ ] **Step 2: Update `Changelog.md`**

```markdown
# Changelog

## [0.1.0] — 2026-04-20

### Added
- 3 templates: Golden Hour, Night Out, Travel.
- Full pipeline: file picker → moment picker → export → share.
- PWA installable on iPhone (manifest + service worker).
- Web Share API integration with iOS Share Sheet.
- Trim-first export pipeline respecting iOS memory limits.
- Dark minimalist design system.
- Unit tests for templates and FFmpeg command builders.
- Integration tests for full pipeline per template.
- GitHub Actions CI + automatic Pages deploy.

### Known limitations
- CSS filter preview is an approximation of the final LUT render.
- First-time export on iPhone takes ~60-90s (FFmpeg.wasm download + processing).
- No offline support on first load (needs internet for FFmpeg core).
- Single language UI (Portuguese only).
```

- [ ] **Step 3: Commit + tag release**

```bash
git add Changelog.md
git commit -m "docs: release 0.1.0 with final smoke checklist"
git tag v0.1.0
git push origin main --tags
```

---

## Self-Review Results

**Spec coverage:**
- §1 Missão/users → Task 2 (CONTEXTO.md) ✓
- §2 MoSCoW → Task 2 ✓
- §3 Critérios sucesso → Task 24 smoke checklist ✓
- §4 Arquitectura → Tasks 1, 8, 14, 18 ✓
- §5 Componentes → Tasks 5-16 (1-to-1 mapping with file tree) ✓
- §6 Templates schema → Task 5 ✓
- §7 User journey → Tasks 10-16 (1 task per screen) ✓
- §8 Memory strategy (trim-first) → Tasks 6-7, 14 ✓
- §9 Error handling → Tasks 11 (validation), 15 (export errors), 16 (share fallback), 9 (popstate) ✓
- §10 Testing → Tasks 3, 5, 6, 7, 20, 21 ✓
- §11 Deploy → Tasks 4, 22, 23 ✓
- §12 Riscos → mitigations embedded in relevant tasks ✓
- §13 Open questions → flagged in Task 19 (LUT/thumb choice) ✓

**Type consistency:**
- `buildTrimCommand`, `buildPhotoToClipCommand`, `buildAssemblyCommand`, `buildPipeline` — all consistent across Tasks 6-7 ✓
- State shape (`{ screen, template, slots, text, exportBlob, exportProgress, exportLog }`) — consistent across Tasks 9-16 ✓
- `slots[i]` object (`{ file, thumb, startTime, type, duration, slotDuration, invalid? }`) — consistent across picker/moments/export ✓
- Worker message types (`run`, `progress`, `log`, `done`, `error`) — consistent in Tasks 14-15 ✓

**Placeholder scan:** none found. All steps include complete code or explicit instructions.

**Known open items (explicitly documented, not placeholders):**
- LUT file sourcing (Task 19) — requires manual download of royalty-free LUTs.
- Template thumbnails (Task 19) — requires visual design decision deferred from spec §13.
- FFmpeg self-hosting (Task 14 note) — deferred simplification; CDN used in first pass.

These are flagged with context and are not blockers for the TDD flow.
