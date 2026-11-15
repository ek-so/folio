import { useRef, useState, useEffect } from 'react'
import { startHistory, recorded, undone, redone, changedAt } from '../lib/undo.js'

// The note editor's undo and redo (lib/undo.js) over `content`, changed through `change(text)`: `onChange(text)`
// records the editor's own changes (use it in place of `change`); a change of `content` from anywhere else (the note
// loading, a sync bringing GitHub's text in, dates written on leaving the editor) starts the history afresh from it, so
// undo never takes back what wasn't typed here. `undo()` / `redo()` put the text back through `change` and return where the cursor goes (the end of what
// changed), or null when there's nothing to undo or redo; `canUndo`, `canRedo`.
export function useUndo(content, change) {
  const history = useRef(startHistory(content))
  const [, render] = useState(0)
  const set = h => { history.current = h; render(n => n + 1) }
  useEffect(() => {
    if (content !== history.current.present) set(startHistory(content))
  }, [content])
  const step = move => {
    const next = move(history.current)
    if (next === history.current) return null
    const at = changedAt(history.current.present, next.present)
    set(next)
    change(next.present)
    return at
  }
  return {
    onChange: text => { set(recorded(history.current, text, Date.now())); change(text) },
    undo: () => step(undone),
    redo: () => step(redone),
    canUndo: history.current.past.length > 0,
    canRedo: history.current.future.length > 0,
  }
}
