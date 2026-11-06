import { useState } from 'react'
import { toast } from 'sonner'
import { linkMarkdown, replaceLink } from '../lib/markdown.js'
import LinkModal from '../components/LinkModal.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'

// Edit link and Remove for the link badges in `text` (a note, or a property's description), saved by
// `onChange(newText)`. `actions(span, label)` gives a LinkBadge its onEdit / onRemove (none without
// `onChange` or a `span` from linkSpans); `dialogs` renders their dialog. A link that changed in
// the text since its dialog opened isn't written over: a toast says so.
export function useLinkEdits(text, onChange) {
  const [editing, setEditing] = useState(null) // the link span in the Edit link dialog
  const [removing, setRemoving] = useState(null) // the link span being confirmed
  const change = (span, markdown) => {
    if (text.slice(span.start, span.end) !== span.raw) return toast.error('The note changed. Try again.')
    onChange(replaceLink(text, span, markdown))
  }
  const actions = (span, label) => onChange && span ? {
    onEdit: () => setEditing({ ...span, raw: text.slice(span.start, span.end) }),
    onRemove: () => setRemoving({ ...span, label, raw: text.slice(span.start, span.end) }),
  } : {}
  const dialogs = <>
    {editing && (
      <LinkModal
        name={editing.bare ? '' : editing.label} url={editing.href}
        onSave={(name, url) => { change(editing, linkMarkdown(name, url, editing.bare)); setEditing(null) }}
        onClose={() => setEditing(null)}
      />
    )}
    {removing && (
      <ConfirmModal
        title="Remove link?"
        description={`“${removing.label}” is removed from the note.`}
        onConfirm={() => { change(removing, ''); setRemoving(null) }}
        onClose={() => setRemoving(null)}
      />
    )}
  </>
  return { actions, dialogs }
}
