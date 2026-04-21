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
