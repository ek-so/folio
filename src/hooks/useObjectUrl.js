import { useEffect, useState } from 'react'

// A blob: URL for a file's content (`base64`, of `type`), null until there is one; let go of when it changes or the
// component goes. For what a data: URL would make too long (a song: a player wants a URL, not a 5 MB string). Decoded a
// piece at a time, letting the page answer in between, so a large file doesn't freeze it
export function useObjectUrl(base64, type) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    setUrl(null)
    if (!base64) return
    let made = null
    let cancelled = false
    decode(base64).then(bytes => {
      if (cancelled) return
      made = URL.createObjectURL(new Blob(bytes, { type }))
      setUrl(made)
    })
    return () => { cancelled = true; if (made) URL.revokeObjectURL(made) }
  }, [base64, type])
  return url
}

const PIECE = 1 << 20 // base64 characters at a time (a multiple of 4: each piece decodes on its own)

// `base64` as byte arrays, a piece at a time
async function decode(base64) {
  const parts = []
  for (let at = 0; at < base64.length; at += PIECE) {
    const text = atob(base64.slice(at, at + PIECE))
    const bytes = new Uint8Array(text.length)
    for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i)
    parts.push(bytes)
    await new Promise(resolve => setTimeout(resolve)) // the page answers in between
  }
  return parts
}
