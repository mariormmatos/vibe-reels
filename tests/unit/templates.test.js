import { describe, it, expect } from 'vitest';
import { TEMPLATES, validateTemplate } from '../../src/templates.js';

const REQUIRED_KEYS = ['id', 'name', 'description', 'slots', 'transition', 'cssFilter', 'lutFile', 'ffmpegFilters', 'textSlot', 'textStyle', 'thumbnail'];

describe('TEMPLATES', () => {
  it('exports exactly 3 templates', () => {
    expect(TEMPLATES).toHaveLength(3);
  });

  it('has ids: golden-hour, night-out, travel', () => {
    const ids = TEMPLATES.map(t => t.id).sort();
    expect(ids).toEqual(['golden-hour', 'night-out', 'travel']);
  });

  for (const id of ['golden-hour', 'night-out', 'travel']) {
    it(`template "${id}" passes validation`, () => {
      const t = TEMPLATES.find(t => t.id === id);
      expect(() => validateTemplate(t)).not.toThrow();
    });
  }

  it('every template has all required keys', () => {
    for (const t of TEMPLATES) {
      for (const key of REQUIRED_KEYS) {
        expect(t, `template ${t.id} missing key ${key}`).toHaveProperty(key);
      }
    }
  });

  it('total duration of every template is <=30s', () => {
    for (const t of TEMPLATES) {
      const total = t.slots.reduce((sum, s) => sum + s.duration, 0);
      expect(total, `template ${t.id} exceeds 30s`).toBeLessThanOrEqual(30);
    }
  });

  it('only Travel has text', () => {
    const travel = TEMPLATES.find(t => t.id === 'travel');
    expect(travel.textSlot).not.toBeNull();
    for (const t of TEMPLATES.filter(t => t.id !== 'travel')) {
      expect(t.textSlot).toBeNull();
    }
  });
});

describe('validateTemplate', () => {
  it('throws on missing id', () => {
    expect(() => validateTemplate({})).toThrow(/id/);
  });

  it('throws on empty slots', () => {
    expect(() => validateTemplate({
      id: 'x', name: 'X', description: '', slots: [],
      transition: { type: 'fade', duration: 0 },
      cssFilter: '', lutFile: null, ffmpegFilters: [],
      textSlot: null, textStyle: null, thumbnail: ''
    })).toThrow(/slots/);
  });
});
