import { useState, useEffect } from 'react'
import FileIcon from './FileIcon.jsx'

// Top of the content box: the item's file or folder icon in an outlined tile, then its title. With onCommit the title
// is a text field: Enter or leaving it saves (onCommit(text) returns an error
// message or null), Escape reverts. An empty title isn't saved. `badge` sits right after the title;
// `children`: the item's actions on the right (⋯, then +, ✏️ or ✓). A border sets it
// apart from the content below.
export default function TitleBar({ path, dir, value, onCommit, badge, children }) {
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
    <div className="shrink-0 border-b border-border p-2">
      <div className="flex items-center gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border">
          <FileIcon path={path} dir={dir} />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {onCommit ? (
            // The hidden span gives the field the width of its text, so `badge` sits right after the title
            <div className="relative min-w-8 max-w-full text-base font-bold">
              <span className="invisible block truncate whitespace-pre" aria-hidden>{draft || ' '}</span>
              <input
                className="absolute inset-0 w-full min-w-0 bg-transparent text-foreground outline-none"
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
            </div>
          ) : (
            <h1 className="min-w-0 truncate text-base font-bold">{value}</h1>
          )}
          {badge}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  )
}
