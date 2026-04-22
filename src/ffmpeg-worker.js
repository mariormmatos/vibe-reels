// FFmpeg.wasm worker. Runs single-threaded core — no SharedArrayBuffer /
// COEP/COOP required, which is why this works on GitHub Pages. All three
// packages pinned to 0.12.10 and served from jsdelivr so we never mix CDNs
// (mixing triggered silent fetch hangs on iOS Safari PWA standalone).

const log = (message) => self.postMessage({ type: 'log', message });

let ffmpeg = null;
let FFmpeg = null;
let toBlobURL = null;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`${label} timeout após ${ms}ms`)), ms))
  ]);
}

async function ensureLoaded(postProgress) {
  if (ffmpeg) return ffmpeg;

  if (!FFmpeg || !toBlobURL) {
    log('[worker] a importar @ffmpeg/ffmpeg + @ffmpeg/util (jsdelivr)');
    const ffmpegMod = await withTimeout(
      import('https://cdn.jsdelivr.net/npm/@ffmpeg/ffmpeg@0.12.10/+esm'),
      30000, 'import @ffmpeg/ffmpeg'
    );
    const utilMod = await withTimeout(
      import('https://cdn.jsdelivr.net/npm/@ffmpeg/util@0.12.1/+esm'),
      30000, 'import @ffmpeg/util'
    );
    FFmpeg = ffmpegMod.FFmpeg;
    toBlobURL = utilMod.toBlobURL;
    log('[worker] imports ESM OK');
  }

  log('[worker] a criar instância FFmpeg');
  ffmpeg = new FFmpeg();
  ffmpeg.on('log', ({ message }) => {
    self.postMessage({ type: 'log', message: `[ffmpeg] ${message}` });
  });
  ffmpeg.on('progress', ({ progress }) => {
    postProgress(progress);
  });

  const base = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.10/dist/umd';

  log('[worker] fetch ffmpeg-core.js');
  const coreURL = await withTimeout(
    toBlobURL(`${base}/ffmpeg-core.js`, 'text/javascript', true, ({ received, total }) => {
      if (total) self.postMessage({ type: 'progress', value: 0.05 + 0.10 * (received / total) });
    }),
    60000,
    'download core.js'
  );
  log('[worker] core.js OK');

  log('[worker] fetch ffmpeg-core.wasm (~31 MB)');
  const wasmURL = await withTimeout(
    toBlobURL(`${base}/ffmpeg-core.wasm`, 'application/wasm', true, ({ received, total }) => {
      if (total) self.postMessage({ type: 'progress', value: 0.15 + 0.15 * (received / total) });
    }),
    180000,
    'download core.wasm'
  );
  log('[worker] wasm OK');

  log('[worker] ffmpeg.load()');
  await withTimeout(ffmpeg.load({ coreURL, wasmURL }), 60000, 'ffmpeg.load');
  log('[worker] FFmpeg pronto');
  return ffmpeg;
}

self.onmessage = async (e) => {
  const { type, payload } = e.data;
  if (type === 'run') {
    try {
      await runPipeline(payload);
    } catch (err) {
      log(`[worker] ERRO: ${err?.message || err}`);
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

  log(`[worker] a escrever ${Object.keys(lutFiles).length} LUT(s)`);
  for (const [lutPath, lutBytes] of Object.entries(lutFiles)) {
    await ff.writeFile(lutPath, new Uint8Array(lutBytes));
  }

  log(`[worker] pipeline: ${steps.length} passos`);
  for (const step of steps) {
    log(`[worker] passo ${stepIdx + 1}/${totalSteps}: ${step.kind}`);
    if (step.inputFile) {
      const data = new Uint8Array(await step.inputFile.arrayBuffer());
      await ff.writeFile(step.inputName, data);
    }
    const code = await ff.exec(step.args);
    if (code !== 0) {
      throw new Error(`ffmpeg exit ${code} em ${step.kind}`);
    }
    if (step.inputName) {
      try { await ff.deleteFile(step.inputName); } catch {}
    }
    stepIdx++;
  }

  log('[worker] a ler output.mp4');
  const out = await ff.readFile('output.mp4');
  const blob = new Blob([out.buffer], { type: 'video/mp4' });
  self.postMessage({ type: 'done', blob });

  for (const step of steps) {
    if (step.outputName) {
      try { await ff.deleteFile(step.outputName); } catch {}
    }
  }
}
