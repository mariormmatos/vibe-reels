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
      fontSize: '11px', color: 'var(--fg-subtle)', width: '100%', maxHeight: '200px',
      overflow: 'auto', whiteSpace: 'pre-wrap', fontFamily: 'monospace', textAlign: 'left'
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
  setState({ exportStarted: true, exportError: null, exportProgress: 0, exportLog: '[export] a arrancar worker…' });

  try {
    worker = new Worker(new URL('../ffmpeg-worker.js', import.meta.url), { type: 'module' });
  } catch (err) {
    setState({ exportError: `Não foi possível iniciar o worker (${err?.message || err}).`, exportStarted: false });
    return;
  }

  // Critical: without these, any failure in the worker's top-level import
  // (CDN fetch, ESM parse, etc.) vanishes and the UI hangs at "A iniciar...".
  worker.onerror = (ev) => {
    const msg = ev.message || ev.filename || 'erro desconhecido no worker';
    setState({
      exportError: `Falha no motor de vídeo: ${msg}`,
      exportStarted: false,
      exportLog: (getState().exportLog || '') + `\n[worker.onerror] ${msg}`
    });
  };
  worker.onmessageerror = (ev) => {
    setState({
      exportError: 'Erro de mensagem no worker (serialização).',
      exportStarted: false,
      exportLog: (getState().exportLog || '') + `\n[worker.onmessageerror]`
    });
  };

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
      const next = (prev + '\n' + line).split('\n').slice(-16).join('\n');
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
