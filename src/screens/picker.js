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
    console.error('[picker] thumb gen failed:', e);
    const reason = (e && e.message) ? e.message : 'desconhecido';
    return { file, invalid: `Este ficheiro não abre no browser (${reason}).` };
  }
}
