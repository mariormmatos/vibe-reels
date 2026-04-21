export function el(tag, props = {}, children = []) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') Object.assign(e.style, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'html') e.innerHTML = v;
    else e[k] = v;
  }
  for (const c of [].concat(children)) {
    if (c == null || c === false) continue;
    e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return e;
}

export function toast(msg, ms = 3000) {
  const t = el('div', { class: 'toast', textContent: msg });
  document.body.appendChild(t);
  setTimeout(() => t.remove(), ms);
}

export async function makeVideoThumb(file, atSeconds = 0.1) {
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  // iOS Safari requires HTML attributes (not just JS props) for inline decode.
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('muted', '');
  video.setAttribute('preload', 'auto');
  video.muted = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.src = url;
  // Attach off-screen — iOS skips decode on detached <video>.
  video.style.cssText = 'position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none;';
  document.body.appendChild(video);

  const cleanup = () => {
    video.src = '';
    video.remove();
    URL.revokeObjectURL(url);
  };

  try {
    // Wait for first frame decoded (readyState >= 2 / HAVE_CURRENT_DATA).
    await new Promise((resolve, reject) => {
      if (video.readyState >= 2) return resolve();
      const done = () => { video.removeEventListener('loadeddata', done); video.removeEventListener('error', fail); resolve(); };
      const fail = () => { video.removeEventListener('loadeddata', done); video.removeEventListener('error', fail); reject(new Error('video load failed')); };
      video.addEventListener('loadeddata', done);
      video.addEventListener('error', fail);
      setTimeout(() => { video.removeEventListener('loadeddata', done); video.removeEventListener('error', fail); reject(new Error('video load timeout')); }, 10000);
    });

    const duration = Number.isFinite(video.duration) ? video.duration : atSeconds + 1;
    const targetTime = Math.min(atSeconds, Math.max(0, duration - 0.1));

    if (Math.abs(video.currentTime - targetTime) > 0.05) {
      // iOS occasionally never fires `seeked` in standalone PWA — fall back to timeout.
      await new Promise(resolve => {
        const done = () => { video.removeEventListener('seeked', done); resolve(); };
        video.addEventListener('seeked', done);
        try { video.currentTime = targetTime; } catch { /* ignore */ }
        setTimeout(done, 1500);
      });
    }

    // Let the decoded frame paint before drawImage.
    await new Promise(r => requestAnimationFrame(r));

    const vw = video.videoWidth || 1080;
    const vh = video.videoHeight || 1920;
    const canvas = document.createElement('canvas');
    canvas.width = 270;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const ratio = vw / vh;
    const targetRatio = 9 / 16;
    let sx = 0, sy = 0, sw = vw, sh = vh;
    if (ratio > targetRatio) {
      sw = vh * targetRatio;
      sx = (vw - sw) / 2;
    } else {
      sh = vw / targetRatio;
      sy = (vh - sh) / 2;
    }
    ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

    return { dataUrl: canvas.toDataURL('image/jpeg', 0.7), duration };
  } finally {
    cleanup();
  }
}

export async function makeImageThumb(file) {
  const url = URL.createObjectURL(file);
  const img = new Image();
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const canvas = document.createElement('canvas');
  canvas.width = 270;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  const ratio = img.width / img.height;
  const targetRatio = 9 / 16;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (ratio > targetRatio) {
    sw = img.height * targetRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / targetRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.7) };
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
