// Widths of the two resizable desktop panels (px): default and limits
export const TREE_WIDTH = { default: 256, min: 200, max: 480 }
export const RAIL_WIDTH = { default: 224, min: 160, max: 320 }

// A saved or dragged width kept inside the limits (the default if it isn't a number)
export function clampWidth(value, limits) {
  const n = Number(value)
  if (!Number.isFinite(n) || value === null || value === '') return limits.default
  return Math.min(limits.max, Math.max(limits.min, Math.round(n)))
}
