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
