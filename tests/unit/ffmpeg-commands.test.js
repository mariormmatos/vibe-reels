import { describe, it, expect } from 'vitest';
import { buildTrimCommand, buildPhotoToClipCommand } from '../../src/ffmpeg-commands.js';

describe('buildTrimCommand', () => {
  it('builds trim command for video slot', () => {
    const cmd = buildTrimCommand({
      inputName: 'input_0.mp4',
      startTime: 12,
      duration: 5,
      outputName: 'trimmed_0.mp4'
    });
    expect(cmd).toEqual([
      '-ss', '12', '-t', '5',
      '-i', 'input_0.mp4',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      '-an',
      '-y', 'trimmed_0.mp4'
    ]);
  });

  it('uses start=0 for video that starts at beginning', () => {
    const cmd = buildTrimCommand({
      inputName: 'input_1.mp4',
      startTime: 0,
      duration: 4,
      outputName: 'trimmed_1.mp4'
    });
    expect(cmd[1]).toBe('0');
    expect(cmd[3]).toBe('4');
  });
});

describe('buildPhotoToClipCommand', () => {
  it('converts photo to static clip of given duration', () => {
    const cmd = buildPhotoToClipCommand({
      inputName: 'input_2.jpg',
      duration: 3,
      outputName: 'trimmed_2.mp4'
    });
    expect(cmd).toEqual([
      '-loop', '1', '-i', 'input_2.jpg',
      '-t', '3',
      '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=30',
      '-c:v', 'libx264', '-preset', 'ultrafast', '-crf', '23',
      '-pix_fmt', 'yuv420p',
      '-an',
      '-y', 'trimmed_2.mp4'
    ]);
  });
});
