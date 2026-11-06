// Sizes of what can be resized on desktop (px): default and limits. The two panels' widths,
export const TREE_WIDTH = { default: 300, min: 200, max: 480 }
export const RAIL_WIDTH = { default: 240, min: 160, max: 320 }
// a note widget's height
export const NOTE_HEIGHT = { default: 320, min: 160, max: 1200 }

// A saved or dragged size kept inside the limits (the default if it isn't a number)
export function clampSize(value, limits) {
  const n = Number(value)
  if (!Number.isFinite(n) || value === null || value === '') return limits.default
  return Math.min(limits.max, Math.max(limits.min, Math.round(n)))
}
