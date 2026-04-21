import { TEMPLATES } from '../templates.js';
import { setState, goto } from '../app.js';
import { el } from '../ui.js';

export function renderHome(state) {
  const screen = el('div', { class: 'screen' });

  screen.appendChild(el('h1', { textContent: 'Vibe Reels' }));
  screen.appendChild(el('p', { class: 'subtitle', textContent: 'Escolhe um template' , style: { color: 'var(--fg-dim)', marginBottom: '8px' } }));

  for (const t of TEMPLATES) {
    const card = el('div', {
      class: 'card card-home',
      onclick: () => {
        setState({ template: t, slots: new Array(t.slots.length).fill(null) });
        goto(t.textSlot !== null ? 'picker' : 'picker');
      }
    }, [
      el('div', { class: 'card-thumb', style: { backgroundImage: `url(${t.thumbnail})` } }),
      el('div', { class: 'card-body' }, [
        el('h2', { textContent: t.name, style: { fontSize: '20px', color: 'var(--fg)', textTransform: 'none', letterSpacing: 0 } }),
        el('p', { textContent: t.description, style: { color: 'var(--fg-dim)', fontSize: '14px' } }),
        el('p', { textContent: `${t.slots.length} slots · ${t.slots.reduce((s, sl) => s + sl.duration, 0)}s`, style: { color: 'var(--fg-subtle)', fontSize: '12px', marginTop: '4px' } })
      ])
    ]);
    screen.appendChild(card);
  }

  return screen;
}
