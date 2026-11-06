import { useState, useRef } from 'react'
import { Button } from './ui/button.jsx'
import { Input } from './ui/input.jsx'
import BottomSheet from './BottomSheet.jsx'

// Edit link: its name (the link text's markdown) and URL; `onSave(name, url)`
export default function LinkModal({ name: initialName, url: initialUrl, onSave, onClose }) {
  const [name, setName] = useState(initialName)
  const [url, setUrl] = useState(initialUrl)
  const nameRef = useRef()
  return (
    <BottomSheet title="Edit link" onClose={onClose} onOpenAutoFocus={e => { e.preventDefault(); nameRef.current?.select() }}>
      <form onSubmit={e => { e.preventDefault(); onSave(name, url) }} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Name
          <Input ref={nameRef} value={name} onChange={e => setName(e.target.value)} placeholder={url} className="bg-background border-border font-normal" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          URL
          <Input value={url} onChange={e => setUrl(e.target.value)} autoCorrect="off" autoCapitalize="off" spellCheck={false} className="bg-background border-border font-normal" />
        </label>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!url.trim()}>Save</Button>
        </div>
      </form>
    </BottomSheet>
  )
}
