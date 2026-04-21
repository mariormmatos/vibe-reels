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
