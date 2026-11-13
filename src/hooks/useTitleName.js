import { useState } from 'react'
import { nameFromTitle } from '../lib/changes.js'

// The state of a note's Title and File name fields (TitleNameFields): the name follows the title in kebab-case until it's
// typed in. Starting from a note's own (`title`, `name`), it follows only if its name is the title's kebab-case already.
// An emptied name falls back to the title's kebab-case: `suggestion` is shown as the empty field's placeholder, and `name` is that.
// Returns { title, name, typedName, suggestion, setTitle, setName, changed } (`typedName`: the field's text; `changed`: either differs from the start)
export function useTitleName(initialTitle = '', initialName = '') {
  const [title, setTitle] = useState(initialTitle)
  const [typed, setTyped] = useState(initialName === nameFromTitle(initialTitle) ? null : initialName)
  const suggestion = nameFromTitle(title)
  const typedName = typed ?? suggestion
  const name = typedName.trim() ? typedName : suggestion
  return { title, name, typedName, suggestion, setTitle, setName: setTyped, changed: title.trim() !== initialTitle || name.trim() !== initialName }
}
