import { useState } from 'react'
import { Smiley, ArrowCounterClockwise } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { Button } from './ui/button.jsx'
import { SearchInput } from './ui/search-input.jsx'
import { Popover, PopoverTrigger, PopoverContent } from './ui/popover.jsx'
import { DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent } from './ui/dropdown-menu.jsx'
import { useIconsContext } from '../hooks/useIcons.js'
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group.jsx'
import { searchEmojis } from '../lib/emojis.js'
import { leadingEmoji } from '../lib/icons.js'
import { EmptyMessage } from './EmptyState.jsx'

// Custom: neither shadcn nor Phosphor has an emoji picker, and a library's would bring its own look. A ToggleGroup of
// the emojis in lib/emojis.js, a search field (words like "home" or "money"; an emoji pasted into it is picked at once)
// and a button back to the default icon (a plain control: the emoji comes back with one pick, so nothing is confirmed).

// The picker's content: `value` (the chosen emoji, '' for none) and `onPick(emoji)` ('' takes it out; a view, a file's
// ⋯ sub menu or the popover below hold it)
export function EmojiGrid({ value, onPick, onDone }) {
  const [query, setQuery] = useState('')
  const found = searchEmojis(query)
  const pick = emoji => { onPick(emoji); onDone?.() }
  return (
    <div className="flex w-72 max-w-full flex-col gap-space-sm" onKeyDown={e => e.stopPropagation()}>
      <div className="flex gap-space-xs">
        <SearchInput
          value={query} placeholder="Search or paste an emoji" aria-label="Search emoji" wrapperClassName="min-w-0 flex-1"
          onChange={e => { const emoji = leadingEmoji(e.target.value.trim()); if (emoji) pick(emoji); else setQuery(e.target.value) }}
        />
        <Button type="button" variant="ghost-outline" size="icon" aria-label="Use the default icon" tooltip="Use the default icon" disabled={!value} onClick={() => pick('')}>
          <ArrowCounterClockwise />
        </Button>
      </div>
      {!found.length && <EmptyMessage size="sm">No emoji found</EmptyMessage>}
      <ToggleGroup type="single" value={value} onValueChange={v => { if (v) pick(v) }} aria-label="Emojis" className="grid grid-cols-8 gap-0">
        {found.map(emoji => (
          <ToggleGroupItem key={emoji} value={emoji} variant="grid" aria-label={emoji} className={cn('size-control-md px-0 text-base', value === emoji && 'bg-secondary')}>
            {emoji}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  )
}

// A button showing the emoji (or a smiley) that opens a sub popover on its side with the picker, like a color swatch
// (`ColorPicker`): `onChange(emoji)`, then it closes. `className`: the button's (medium inside a row)
export default function EmojiPicker({ emoji, onChange, label = 'Emoji', className, fallback = <Smiley /> }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" aria-label={label} tooltip="Emoji" className={cn('shrink-0 text-base', className)}>
          {emoji || fallback}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="right" align="start" sideOffset={8} className="w-auto" onClick={e => e.stopPropagation()}>
        <EmojiGrid value={emoji} onPick={onChange} onDone={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  )
}

// Emoji in a file's or folder's ⋯ (ItemMenu, a card's CardMenu, a Pinned widget's card): a sub menu with the picker for the
// icon of `path` (lib/icons.js, `IconsContext`), disabled while the icons can't be saved. `onDone` closes the menu
export function EmojiSubmenu({ path, onDone }) {
  const icons = useIconsContext()
  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={!icons.onSet}><Smiley /> Emoji</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="p-space-sm">
        <EmojiGrid value={icons.iconOf(path)} onPick={emoji => icons.onSet(path, emoji)} onDone={onDone} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
