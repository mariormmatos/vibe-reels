import { describe, it, expect } from 'vitest';
import { buildTrimCommand, buildPhotoToClipCommand, buildAssemblyCommand, buildPipeline } from '../../src/ffmpeg-commands.js';
import { getTemplate } from '../../src/templates.js';

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

describe('buildAssemblyCommand', () => {
  it('hardcut: concats inputs with LUT applied, no text', () => {
    const template = getTemplate('night-out');
    const inputs = ['trimmed_0.mp4', 'trimmed_1.mp4', 'trimmed_2.mp4', 'trimmed_3.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: null });
    expect(cmd).toContain('-i');
    expect(cmd.filter(a => a === '-i')).toHaveLength(4);
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/lut3d=file='assets\/luts\/night_out\.cube'/);
    expect(fc).toMatch(/concat=n=4:v=1:a=0/);
    expect(fc).not.toMatch(/drawtext/);
  });

  it('fade transition: uses xfade between clips', () => {
    const template = getTemplate('golden-hour');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: null });
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/xfade=transition=fade/);
  });

  it('zoom transition: uses xfade with zoom', () => {
    const template = getTemplate('travel');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4', 't5.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: 'Lisboa' });
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/xfade=transition=zoomin/);
  });

  it('Travel with text: includes drawtext on the text slot', () => {
    const template = getTemplate('travel');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4', 't5.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: 'Lisboa 2026' });
    const fc = cmd[cmd.indexOf('-filter_complex') + 1];
    expect(fc).toMatch(/drawtext=/);
    expect(fc).toMatch(/text='Lisboa 2026'/);
  });

  it('output is always MP4 H.264 at 1080x1920 30fps', () => {
    const template = getTemplate('golden-hour');
    const inputs = ['t0.mp4', 't1.mp4', 't2.mp4', 't3.mp4', 't4.mp4'];
    const cmd = buildAssemblyCommand({ template, inputs, text: null });
    expect(cmd).toContain('-c:v');
    const vcodec = cmd[cmd.indexOf('-c:v') + 1];
    expect(vcodec).toBe('libx264');
    expect(cmd).toContain('output.mp4');
  });
});

describe('buildPipeline', () => {
  it('builds full sequence: pre-trim commands + assembly command', () => {
    const template = getTemplate('golden-hour');
    const inputs = [
      { file: { name: 'a.mp4' }, startTime: 0, type: 'video', duration: 5 },
      { file: { name: 'b.mp4' }, startTime: 10, type: 'video', duration: 4 },
      { file: { name: 'c.jpg' }, startTime: 0, type: 'photo', duration: 3 },
      { file: { name: 'd.mp4' }, startTime: 5, type: 'video', duration: 5 },
      { file: { name: 'e.jpg' }, startTime: 0, type: 'photo', duration: 3 }
    ];
    const pipeline = buildPipeline({ template, inputs, text: null });
    expect(pipeline).toHaveLength(6);
    expect(pipeline[0].kind).toBe('trim');
    expect(pipeline[1].kind).toBe('trim');
    expect(pipeline[2].kind).toBe('photo-to-clip');
    expect(pipeline[pipeline.length - 1].kind).toBe('assembly');
  });
});
