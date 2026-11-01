import { useState, useEffect } from 'react'
import { getBlobBase64, isNetworkError } from '../lib/github.js'

// One file's content as base64, through the offline cache.
// error: 'offline' (not on this device and no connection) or 'failed'.
export function useBlob(sha) {
  const [state, setState] = useState({ base64: null, error: null })

  useEffect(() => {
    let cancelled = false
    setState({ base64: null, error: null })
    getBlobBase64(sha)
      .then(base64 => { if (!cancelled) setState({ base64, error: null }) })
      .catch(e => { if (!cancelled) setState({ base64: null, error: isNetworkError(e) ? 'offline' : 'failed' }) })
    return () => { cancelled = true }
  }, [sha])

  return state
}
