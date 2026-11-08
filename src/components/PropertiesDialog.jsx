import { useState } from 'react'
import CheckListModal from './CheckListModal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { plural } from '../lib/plural.js'

// A board's or planner's Properties sheet (while `open`): the properties its cards show (`shown`, ticked, first) and
// the others its notes have, to tick, add, rename or remove; `locked` ones can't be changed (`lockedDescription` says
// why) and `lockedError(key)` refuses a new or renamed one that would clash with them. Removing one closes the sheet
// and asks first ("Remove property …?", it's taken out of every note of the `noun`'s folder). `act`: the widget's
// actions (useFolderNotes and its own setProperties, renameProperty, removeProperty, keyError). `onClose` closes the sheet.
export default function PropertiesDialog({ open, noun, description, shown, locked, lockedDescription, lockedError = () => null, act, onClose }) {
  const [dropping, setDropping] = useState(null) // the property whose removal is being confirmed
  return <>
    {open && (
      <CheckListModal
        title="Properties"
        description={description}
        locked={locked}
        lockedDescription={lockedDescription}
        items={[...shown, ...act.propertyKeys().filter(k => !locked.includes(k) && !shown.includes(k))]}
        selected={shown}
        onChange={act.setProperties}
        addLabel="New property"
        onAdd={key => {
          const error = lockedError(key) ?? act.keyError(key)
          if (error) return error
          if (!shown.includes(key)) act.setProperties([...shown, key])
          return null
        }}
        onRename={(from, to) => lockedError(to) ?? act.renameProperty(from, to)}
        onDelete={key => { onClose(); setDropping(key) }}
        empty="Its notes have no other properties yet."
        onClose={onClose}
      />
    )}
    {dropping && (
      <ConfirmModal
        title={`Remove property “${dropping}”?`}
        description={`It's removed, with its value, from ${plural(act.notesWith(dropping), 'note')} in this ${noun}'s folder. It's removed from GitHub when you sync.`}
        confirm="Remove"
        onConfirm={() => { act.removeProperty(dropping); setDropping(null) }}
        onClose={() => setDropping(null)}
      />
    )}
  </>
}
