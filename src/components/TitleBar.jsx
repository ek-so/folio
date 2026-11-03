import { useState, useEffect } from 'react'
import FileIcon from './FileIcon.jsx'

// Top of the content box: the item's file or folder icon in an outlined tile, then its title. With onCommit the title
// is a text field: Enter or leaving it saves (onCommit(text) returns an error
// message or null), Escape reverts. An empty title isn't saved. `children`:
// the item's actions on the right (⋯, then +, ✏️ or ✓). A border sets it
// apart from the content below.
export default function TitleBar({ path, dir, value, onCommit, children }) {
  const [draft, setDraft] = useState(value)
  const [error, setError] = useState('')
  useEffect(() => setDraft(value), [value])

  function commit() {
    const text = draft.trim()
    if (!text || text === value) return setDraft(value)
    const err = onCommit(text)
    setError(err || '')
    if (err) setDraft(value)
  }

  return (
    <div className="shrink-0 border-b border-border px-5 py-3">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border">
          <FileIcon path={path} dir={dir} />
        </span>
        {onCommit ? (
          <input
            className="min-w-0 flex-1 bg-transparent text-2xl font-bold text-foreground outline-none"
            value={draft}
            aria-label="Title"
            autoCorrect="on"
            onChange={e => { setDraft(e.target.value); setError('') }}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') { setDraft(value); setError(''); requestAnimationFrame(() => e.target.blur()) }
            }}
          />
        ) : (
          <h1 className="min-w-0 flex-1 truncate text-2xl font-bold">{value}</h1>
        )}
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
