import { useState } from 'react'
import { cn } from '@/lib/utils.js'
import { Input } from './ui/input.jsx'
import { checkRepo } from '../lib/github.js'
import { parseRepo } from '../lib/files.js'

// The owner/repo field, checked with GitHub before `onConnect('owner/repo')`.
// Used by the setup screen (Enter a repo by name) and the Switch repository sheet; `actions({ busy,
// empty })` renders their buttons (a submit button connects).
export default function RepoForm({ initial, onConnect, inputRef, inputClassName, errorClassName, actions }) {
  const [value, setValue] = useState(initial)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    const parsed = parseRepo(value)
    if (!parsed) return setError('Use owner/repo format, e.g. ek-so/brain')
    if (!navigator.onLine) return setError("You're offline. Connect to the internet to check the repo.")
    setBusy(true)
    setError('')
    try {
      await checkRepo(...parsed)
    } catch {
      setError("Can't access that repo. Check the name and token permissions.")
      setBusy(false)
      return
    }
    onConnect(parsed.join('/'))
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-2.5">
      <Input
        ref={inputRef}
        type="text"
        placeholder="owner/repo"
        value={value}
        onChange={e => { setValue(e.target.value); setError('') }}
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck="false"
        className={inputClassName}
      />
      {error && <p className={cn('text-destructive-ink text-xs', errorClassName)}>{error}</p>}
      {actions({ busy, empty: !value.trim() })}
    </form>
  )
}
