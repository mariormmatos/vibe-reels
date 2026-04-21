export function buildTrimCommand({ inputName, startTime, duration, outputName }) {
  return [
    '-ss', String(startTime), '-t', String(duration),
    '-i', inputName,
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
    '-an',
    '-y', outputName
  ];
}

export function buildPhotoToClipCommand({ inputName, duration, outputName }) {
  return [
    '-loop', '1', '-i', inputName,
    '-t', String(duration),
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
    '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
    '-pix_fmt', 'yuv420p',
    '-an',
    '-y', outputName
  ];
}
