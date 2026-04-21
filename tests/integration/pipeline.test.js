import { describe, it, expect, beforeAll } from 'vitest';
import { spawnSync } from 'node:child_process';
import ffprobe from 'ffprobe-static';
import { readFileSync, existsSync, mkdirSync, rmSync, writeFileSync, copyFileSync } from 'node:fs';
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
      writeFileSync(dest, buf);
    }
    if (step.kind !== 'assembly') {
      runFfmpeg(step.args, WORK);
    } else {
      const lutSrc = join(process.cwd(), template.lutFile);
      if (existsSync(lutSrc)) {
        const lutDest = join(WORK, template.lutFile);
        mkdirSync(join(WORK, 'assets', 'luts'), { recursive: true });
        copyFileSync(lutSrc, lutDest);
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
    if (!existsSync(join(FIXTURES, 'short.mp4'))) {
      throw new Error('Fixtures missing — run `npm run gen:fixtures` first');
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
