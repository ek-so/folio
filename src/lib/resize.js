// Sizes of what can be resized on desktop (px): default and limits, and `step` when it changes only by that much (else
// by the pixel; its keys by 16). The rail's width
export const RAIL_WIDTH = { default: 240, min: 160, max: 320 }
// A Note widget's card's height
export const NOTE_HEIGHT = { default: 400, min: 120, max: 2000, step: 20 }

// A saved or dragged size kept inside the limits, on a whole `step` when the limits have one (the default if it isn't a number)
export function clampSize(value, limits) {
  const n = Number(value)
  if (!Number.isFinite(n) || value === null || value === '') return limits.default
  const step = limits.step ?? 1
  return Math.min(limits.max, Math.max(limits.min, Math.round(n / step) * step))
}
