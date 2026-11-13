import { useEffect, useState } from 'react'
import { storage } from '../lib/storage.js'

// The folders open in the title bar's folder tree, kept for the session: [expanded (a Set), toggle(path)]
export function useExpandedFolders() {
  const [expanded, setExpanded] = useState(() => new Set(storage.getExpanded()))
  useEffect(() => { storage.setExpanded([...expanded]) }, [expanded])
  const toggle = path => setExpanded(prev => {
    const next = new Set(prev)
    if (!next.delete(path)) next.add(path)
    return next
  })
  return [expanded, toggle]
}
