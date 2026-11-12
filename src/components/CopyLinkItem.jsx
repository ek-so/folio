import { LinkSimple } from '@phosphor-icons/react'
import { DropdownMenuItem } from './ui/dropdown-menu.jsx'
import { copyText } from '../lib/clipboard.js'

// Copy link in any ⋯ (a file's or folder's, a card's, a Notes widget's note, a link badge's): copies `link`, told by
// the "Link copied" toast. `disabled`: nothing to link to (a note that's gone)
export default function CopyLinkItem({ link, disabled }) {
  return <DropdownMenuItem disabled={disabled} onSelect={() => copyText(link, 'Link copied')}><LinkSimple /> Copy link</DropdownMenuItem>
}
