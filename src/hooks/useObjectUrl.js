import { useEffect, useState } from 'react'

// A blob: URL for a file's content (`base64`, of `type`), null until there is one; let go of when it changes or the
// component goes. For what a data: URL would make too long (a song: a player wants a URL, not a 5 MB string)
export function useObjectUrl(base64, type) {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!base64) return setUrl(null)
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
    const made = URL.createObjectURL(new Blob([bytes], { type }))
    setUrl(made)
    return () => URL.revokeObjectURL(made)
  }, [base64, type])
  return url
}
