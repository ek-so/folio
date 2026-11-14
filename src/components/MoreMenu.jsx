import { Children, Fragment, forwardRef, isValidElement } from 'react'
import { DotsThree } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from '@/components/ui/button.jsx'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx'

// A mouse hides a ⋯ until its row (a group) is hovered or the button has focus or its menu is open; touch always shows it
export const REVEAL = 'pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:focus-visible:opacity-100 pointer-fine:data-[state=open]:opacity-100'

// Every ⋯ menu: the ⋯ button and its menu, one width (`w-56`) everywhere. Its `sections` (an array; empty ones, false or
// null or a fragment with nothing in it, are skipped) are separated by lines, in the order every ⋯ keeps: what only this
// place offers, then what everything of its kind offers (an item's: Rename · Emoji · Move to… · Duplicate · Copy link ·
// Open on GitHub · Lock), then Remove, last.
// The button has two looks: in a title row (the view's, a widget's, an item's) a `ghost-outline` base-size button with a 20px ⋯
// (`variant` changes it: a widget's is plain `ghost`), or `inRow`, inside something that is itself hoverable (a list row, a
// card, a tray's title) a quiet medium one with a 16px ⋯. `reveal`: shown only while its row is hovered (REVEAL; or a class
// string for another group). `label` is its aria-label; `open` / `onOpenChange` control it; `align` places the menu.
export default function MoreMenu({ label, inRow, reveal, variant, disabled, className, align = 'end', open, onOpenChange, sections }) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <MoreButton inRow={inRow} reveal={reveal} variant={variant} disabled={disabled} className={className} aria-label={label} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-56" onCloseAutoFocus={e => e.preventDefault()}>
        {menuSections(sections)}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// `sections` with a line between each two that have something in them (a menu that isn't a ⋯, like a link badge's, uses it too)
export function menuSections(sections) {
  return sections.filter(hasItems).map((section, i) => (
    <Fragment key={i}>
      {i > 0 && <DropdownMenuSeparator />}
      {section}
    </Fragment>
  ))
}

const hasItems = node => !node && node !== 0 ? false
  : isValidElement(node) && node.type === Fragment ? Children.toArray(node.props.children).some(hasItems)
  : Array.isArray(node) ? node.some(hasItems)
  : true

const MoreButton = forwardRef(function MoreButton({ inRow, reveal, variant, className, ...props }, ref) {
  return (
    <Button
      ref={ref}
      variant={variant ?? (inRow ? 'ghost-quiet' : 'ghost-outline')}
      size={inRow ? 'icon-md' : 'icon'}
      className={cn(reveal === true ? REVEAL : reveal, className)}
      {...props}
    >
      <DotsThree weight="bold" size={inRow ? 16 : 20} />
    </Button>
  )
})
