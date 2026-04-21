export const TEMPLATES = [
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    description: 'Warm, soft, faded.',
    slots: [
      { type: 'video', duration: 5 },
      { type: 'video', duration: 4 },
      { type: 'photo', duration: 3 },
      { type: 'video', duration: 5 },
      { type: 'photo', duration: 3 }
    ],
    transition: { type: 'fade', duration: 0.4 },
    cssFilter: 'brightness(1.05) contrast(0.95) saturate(1.1) sepia(0.15)',
    lutFile: 'assets/luts/golden_hour.cube',
    ffmpegFilters: [],
    textSlot: null,
    textStyle: null,
    thumbnail: 'assets/thumbs/golden_hour.png'
  },
  {
    id: 'night-out',
    name: 'Night Out',
    description: 'Neon, saturated, punchy.',
    slots: [
      { type: 'video', duration: 5 },
      { type: 'video', duration: 4 },
      { type: 'video', duration: 4 },
      { type: 'video', duration: 3 }
    ],
    transition: { type: 'hardcut', duration: 0 },
    cssFilter: 'saturate(1.5) contrast(1.2) hue-rotate(-10deg) brightness(0.95)',
    lutFile: 'assets/luts/night_out.cube',
    ffmpegFilters: [],
    textSlot: null,
    textStyle: null,
    thumbnail: 'assets/thumbs/night_out.png'
  },
  {
    id: 'travel',
    name: 'Travel',
    description: 'Natural & vivid, postcard vibes.',
    slots: [
      { type: 'photo', duration: 2 },
      { type: 'video', duration: 4 },
      { type: 'video', duration: 4 },
      { type: 'photo', duration: 2 },
      { type: 'video', duration: 5 },
      { type: 'photo', duration: 3 }
    ],
    transition: { type: 'zoom', duration: 0.3 },
    cssFilter: 'saturate(1.2) contrast(1.1) brightness(1.02)',
    lutFile: 'assets/luts/travel.cube',
    ffmpegFilters: [],
    textSlot: 5,
    textStyle: {
      font: 'postcard',
      size: 64,
      color: '#ffffff',
      position: 'center'
    },
    thumbnail: 'assets/thumbs/travel.png'
  }
];

const REQUIRED_KEYS = ['id', 'name', 'description', 'slots', 'transition', 'cssFilter', 'lutFile', 'ffmpegFilters', 'textSlot', 'textStyle', 'thumbnail'];
const VALID_SLOT_TYPES = new Set(['video', 'photo']);
const VALID_TRANSITION_TYPES = new Set(['fade', 'hardcut', 'zoom']);

export function validateTemplate(t) {
  if (!t || typeof t !== 'object') {
    throw new Error('template must be an object');
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in t)) {
      throw new Error(`template missing required key: ${key}`);
    }
  }
  if (!t.id || typeof t.id !== 'string') {
    throw new Error('template.id must be a non-empty string');
  }
  if (!Array.isArray(t.slots) || t.slots.length === 0) {
    throw new Error('template.slots must be a non-empty array');
  }
  for (const [i, slot] of t.slots.entries()) {
    if (!VALID_SLOT_TYPES.has(slot.type)) {
      throw new Error(`slot ${i} has invalid type: ${slot.type}`);
    }
    if (typeof slot.duration !== 'number' || slot.duration <= 0) {
      throw new Error(`slot ${i} has invalid duration: ${slot.duration}`);
    }
  }
  if (!VALID_TRANSITION_TYPES.has(t.transition?.type)) {
    throw new Error(`invalid transition type: ${t.transition?.type}`);
  }
  if (t.textSlot !== null && (t.textSlot < 0 || t.textSlot >= t.slots.length)) {
    throw new Error(`textSlot ${t.textSlot} out of range`);
  }
  return true;
}

export function getTemplate(id) {
  const t = TEMPLATES.find(t => t.id === id);
  if (!t) throw new Error(`template not found: ${id}`);
  return t;
}
