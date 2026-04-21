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

export function buildAssemblyCommand({ template, inputs, text }) {
  const args = [];
  for (const input of inputs) {
    args.push('-i', input);
  }

  const filterChain = buildFilterComplex(template, inputs.length, text);
  args.push('-filter_complex', filterChain);

  args.push(
    '-map', '[out]',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-r', '30',
    '-an',
    '-movflags', '+faststart',
    '-y', 'output.mp4'
  );
  return args;
}

function buildFilterComplex(template, numInputs, text) {
  const lut = template.lutFile;
  const scale = 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1';
  const lutFilter = lut ? `,lut3d=file='${lut}'` : '';

  const chains = [];
  for (let i = 0; i < numInputs; i++) {
    chains.push(`[${i}:v]${scale}${lutFilter}[v${i}]`);
  }

  if (template.transition.type === 'hardcut') {
    const inputs = Array.from({ length: numInputs }, (_, i) => `[v${i}]`).join('');
    chains.push(`${inputs}concat=n=${numInputs}:v=1:a=0[concat]`);
  } else {
    const xfadeType = template.transition.type === 'fade' ? 'fade' : 'zoomin';
    const td = template.transition.duration;
    let prevLabel = 'v0';
    let accumOffset = template.slots[0].duration - td;
    for (let i = 1; i < numInputs; i++) {
      const nextLabel = i === numInputs - 1 ? 'concat' : `x${i}`;
      chains.push(`[${prevLabel}][v${i}]xfade=transition=${xfadeType}:duration=${td}:offset=${accumOffset.toFixed(3)}[${nextLabel}]`);
      prevLabel = nextLabel;
      accumOffset += template.slots[i].duration - td;
    }
  }

  if (template.textSlot !== null && text) {
    const safe = text.replace(/'/g, "\\'").replace(/:/g, '\\:');
    const style = template.textStyle;
    const y = style.position === 'top' ? 'h*0.1' : style.position === 'bottom' ? 'h*0.85' : '(h-text_h)/2';
    const offsetStart = template.slots.slice(0, template.textSlot).reduce((s, sl) => s + sl.duration, 0);
    const offsetEnd = offsetStart + template.slots[template.textSlot].duration;
    chains.push(`[concat]drawtext=text='${safe}':fontsize=${style.size}:fontcolor=${style.color}:x=(w-text_w)/2:y=${y}:enable='between(t,${offsetStart},${offsetEnd})':shadowcolor=black@0.6:shadowx=2:shadowy=2[out]`);
  } else {
    chains.push(`[concat]null[out]`);
  }

  return chains.join(';');
}

export function buildPipeline({ template, inputs, text }) {
  const steps = [];
  const trimmedNames = [];

  for (let i = 0; i < inputs.length; i++) {
    const slot = template.slots[i];
    const input = inputs[i];
    const inputName = `input_${i}${input.type === 'photo' ? '.jpg' : '.mp4'}`;
    const outputName = `trimmed_${i}.mp4`;
    trimmedNames.push(outputName);

    if (slot.type === 'video') {
      steps.push({
        kind: 'trim',
        inputFile: input.file,
        inputName,
        args: buildTrimCommand({
          inputName,
          startTime: input.startTime,
          duration: slot.duration,
          outputName
        }),
        outputName
      });
    } else {
      steps.push({
        kind: 'photo-to-clip',
        inputFile: input.file,
        inputName,
        args: buildPhotoToClipCommand({
          inputName,
          duration: slot.duration,
          outputName
        }),
        outputName
      });
    }
  }

  steps.push({
    kind: 'assembly',
    args: buildAssemblyCommand({ template, inputs: trimmedNames, text }),
    outputName: 'output.mp4'
  });

  return steps;
}
