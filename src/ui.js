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
  video.src = url;
  video.muted = true;
  video.playsInline = true;
  await new Promise((resolve, reject) => {
    video.onloadedmetadata = resolve;
    video.onerror = reject;
  });
  video.currentTime = Math.min(atSeconds, video.duration - 0.1);
  await new Promise(resolve => { video.onseeked = resolve; });
  const canvas = document.createElement('canvas');
  canvas.width = 270;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  const ratio = video.videoWidth / video.videoHeight;
  const targetRatio = 9 / 16;
  let sx = 0, sy = 0, sw = video.videoWidth, sh = video.videoHeight;
  if (ratio > targetRatio) {
    sw = video.videoHeight * targetRatio;
    sx = (video.videoWidth - sw) / 2;
  } else {
    sh = video.videoWidth / targetRatio;
    sy = (video.videoHeight - sh) / 2;
  }
  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  URL.revokeObjectURL(url);
  return { dataUrl: canvas.toDataURL('image/jpeg', 0.7), duration: video.duration };
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
