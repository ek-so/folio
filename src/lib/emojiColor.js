// The color an emoji looks like: its drawn pixels averaged (only the ones that show), as "r, g, b", or null when it can't
// be worked out (no canvas) or nothing shows. Worked out once per emoji.
const cache = new Map()
const SIZE = 32

export function emojiColor(emoji) {
  if (cache.has(emoji)) return cache.get(emoji)
  let color = null
  try {
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = SIZE
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    ctx.font = `${SIZE - 6}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(emoji, SIZE / 2, SIZE / 2 + 1)
    const { data } = ctx.getImageData(0, 0, SIZE, SIZE)
    let r = 0, g = 0, b = 0, weight = 0
    for (let i = 0; i < data.length; i += 4) {
      const a = data[i + 3]
      r += data[i] * a; g += data[i + 1] * a; b += data[i + 2] * a; weight += a
    }
    if (weight) color = `${Math.round(r / weight)}, ${Math.round(g / weight)}, ${Math.round(b / weight)}`
  } catch { /* no canvas: the type's tint stays */ }
  cache.set(emoji, color)
  return color
}
