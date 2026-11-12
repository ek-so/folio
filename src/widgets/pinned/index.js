import { PushPin } from '@phosphor-icons/react'
import PinnedWidget from './PinnedWidget.jsx'
import PinnedSetup from './PinnedSetup.jsx'
import { parsePinned, settingsOf, settingsWrite, movedPinned } from './pinned.js'
import { displayName } from '@/lib/files.js'

// The Pinned widget: notes and folders pinned to a view as cards (pinned.js). Its settings are .folio/pinned/<id>.json
// (an older Notes widget's .folio/notes/<id>.json until it's saved again).
const readIn = (config, ch, id) => {
  const text = settingsOf(path => ({ ready: true, text: config.readIn(ch, path) }), id).text
  return typeof text === 'string' ? parsePinned(text) : null
}

export default {
  type: 'pinned',
  label: 'Pinned',
  icon: PushPin,
  Widget: PinnedWidget,
  Setup: PinnedSetup,
  title: () => 'Pinned',
  // Its notes and folders, in their order
  tree(id, { config, folders }) {
    const file = settingsOf(config.read, id)
    const settings = file.ready && file.text !== undefined ? parsePinned(file.text) : null
    return (settings?.items ?? []).map(n => ({ key: n.path, name: displayName(n.path), path: n.path, ...(folders.includes(n.path) && { dir: true }) }))
  },
  // Its items follow renames and moves
  moved(ch, id, from, to, isDir, { config }) {
    const settings = readIn(config, ch, id)
    if (!settings) return ch
    const moved = movedPinned(settings, from, to, isDir)
    return moved === settings ? ch : settingsWrite(config, id, moved)(ch)
  },
  // The notes and folders themselves stay
  removed: (ch, id, { config }) => config.erase(`.folio/notes/${id}.json`)(config.erase(`.folio/pinned/${id}.json`)(ch)),
}
