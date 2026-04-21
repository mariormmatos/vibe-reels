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
