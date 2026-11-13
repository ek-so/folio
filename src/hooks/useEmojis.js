import { useEffect, useState } from 'react'
import { emojiGroups } from '../lib/emojis.js'

// The emoji picker's groups (lib/emojis.js emojiGroups): Unicode's whole list, loaded once on demand (its own chunk,
// kept for offline use like the rest of the app), without the emojis this device can't draw. null while it loads.
let loading = null
const FALLBACK_VERSION = 14 // when nothing can be told (no canvas, no color emoji font): what most systems draw

// Whether the device draws `emoji` as one color glyph: the same pixels whatever the text color (a color emoji ignores
// it, a missing glyph's box follows it), something drawn, and about one emoji wide (a sequence it doesn't know falls
// apart into several)
function draws(ctx, emoji, oneWidth) {
  const size = ctx.canvas.width
  const pixels = color => {
    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = color
    ctx.fillText(emoji, 0, 0)
    return ctx.getImageData(0, 0, size, size).data
  }
  const dark = pixels('#000'), light = pixels('#fff')
  let seen = false
  for (let i = 0; i < dark.length; i++) {
    if (dark[i] !== light[i]) return false
    if (i % 4 === 3 && dark[i]) seen = true
  }
  return seen && ctx.measureText(emoji).width < oneWidth * 1.5
}

// The newest emoji version the device draws, tried with the first emoji of each version in `data`
function newestDrawn(data) {
  try {
    const ctx = Object.assign(document.createElement('canvas'), { width: 32, height: 32 }).getContext('2d', { willReadFrequently: true })
    ctx.font = '24px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif'
    ctx.textBaseline = 'top'
    const oneWidth = ctx.measureText('😀').width
    if (!draws(ctx, '😀', oneWidth)) return FALLBACK_VERSION
    const firsts = new Map()
    for (const g of data) for (const e of g.emojis) if (!firsts.has(e.emoji_version)) firsts.set(e.emoji_version, e.emoji)
    const versions = [...firsts.keys()].sort((a, b) => parseFloat(b) - parseFloat(a))
    return parseFloat(versions.find(v => draws(ctx, firsts.get(v), oneWidth)) ?? FALLBACK_VERSION)
  } catch {
    return FALLBACK_VERSION
  }
}

export function useEmojis() {
  const [groups, setGroups] = useState(null)
  useEffect(() => {
    let live = true
    loading ??= import('unicode-emoji-json/data-by-group.json').then(m => emojiGroups(m.default, newestDrawn(m.default)))
    loading.then(g => { if (live) setGroups(g) }, () => { loading = null })
    return () => { live = false }
  }, [])
  return groups
}
