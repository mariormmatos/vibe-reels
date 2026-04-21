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

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(err => {
      console.warn('SW registration failed', err);
    });
  });
}
