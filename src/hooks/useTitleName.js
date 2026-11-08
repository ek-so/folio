import { useState } from 'react'
import { nameFromTitle } from '../lib/changes.js'

// The state of a note's Title and File name fields (TitleNameFields): the name follows the title in kebab-case until it's
// typed in. Starting from a note's own (`title`, `name`), it follows only if its name is the title's kebab-case already.
// Returns { title, name, setTitle, setName, changed } (`changed`: either differs from the start)
export function useTitleName(initialTitle = '', initialName = '') {
  const [title, setTitle] = useState(initialTitle)
  const [typed, setTyped] = useState(initialName === nameFromTitle(initialTitle) ? null : initialName)
  const name = typed ?? nameFromTitle(title)
  return { title, name, setTitle, setName: setTyped, changed: title.trim() !== initialTitle || name.trim() !== initialName }
}
