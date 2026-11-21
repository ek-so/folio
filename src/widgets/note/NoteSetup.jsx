import { PinPicker } from '../pinned/PinnedSetup.jsx'
import { noteWrite } from './note.js'

// A new Note widget, showing one picked (or new) note
export default function NoteSetup({ services, onCreate, onClose }) {
  return (
    <PinPicker
      services={services} withFolders={false} title="Select note"
      onPick={(path, first = ch => ch) => onCreate(id => ch => noteWrite(services.config, id, { path })(first(ch)))}
      onClose={onClose}
    />
  )
}
