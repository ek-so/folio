import * as React from 'react'
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu'
import { CaretRight } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useOverlayOpen } from '@/hooks/useOverlayOpen.js'

// The menu's [open, setOpen], for its trigger
const OpenCtx = React.createContext(null)

// Non-modal: a modal menu locks the page (pointer-events: none on body), and
// when it opens a dialog that lock can be left behind, freezing every button.
// A scroll by touch closes it (useOverlayOpen).
function DropdownMenu({ modal = false, open, defaultOpen, onOpenChange, ...props }) {
  const state = useOverlayOpen({ open, defaultOpen, onOpenChange })
  return (
    <OpenCtx.Provider value={state}>
      <DropdownMenuPrimitive.Root data-slot="dropdown-menu" modal={modal} open={state[0]} onOpenChange={state[1]} {...props} />
    </OpenCtx.Provider>
  )
}

// Radix opens a menu as soon as a pointer goes down. With a mouse that stays; on touch it waits for
// the tap, so a finger landing on ⋯ to scroll the page doesn't open it
function DropdownMenuTrigger({ onPointerDown, onClick, ...props }) {
  const [open, setOpen] = React.useContext(OpenCtx)
  const touched = React.useRef(false)
  return (
    <DropdownMenuPrimitive.Trigger
      data-slot="dropdown-menu-trigger"
      onPointerDown={e => {
        onPointerDown?.(e)
        touched.current = e.pointerType !== 'mouse'
        if (touched.current) e.preventDefault() // skips radix's own opening
      }}
      onClick={e => {
        onClick?.(e)
        const tap = touched.current && e.detail > 0 // not Enter / Space, which radix handles
        touched.current = false
        if (!tap || e.defaultPrevented) return
        setOpen(!open)
      }}
      {...props}
    />
  )
}

function DropdownMenuContent({ className, sideOffset = 4, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.Content
        data-slot="dropdown-menu-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[11rem] overflow-hidden rounded-md border border-border p-1 shadow-md',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

// Highlighted only under a mouse or with the keyboard: on touch screens a tapped
// item can keep focus and would otherwise stay lit the next time the menu opens
function DropdownMenuItem({ className, variant = 'default', ...props }) {
  return (
    <DropdownMenuPrimitive.Item
      data-slot="dropdown-menu-item"
      data-variant={variant}
      className={cn(
        "pointer-fine:hover:bg-secondary focus-visible:bg-secondary data-[variant=destructive]:text-destructive relative flex cursor-default items-center gap-3 rounded-sm px-3 py-2 text-base outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function DropdownMenuSeparator({ className, ...props }) {
  return <DropdownMenuPrimitive.Separator data-slot="dropdown-menu-separator" className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />
}

// A submenu: the trigger row (with a ›) opens `DropdownMenuSubContent` beside it
const DropdownMenuSub = DropdownMenuPrimitive.Sub

function DropdownMenuSubTrigger({ className, children, ...props }) {
  return (
    <DropdownMenuPrimitive.SubTrigger
      data-slot="dropdown-menu-sub-trigger"
      className={cn(
        "pointer-fine:hover:bg-secondary focus-visible:bg-secondary data-[variant=destructive]:text-destructive relative flex cursor-default items-center gap-3 rounded-sm px-3 py-2 text-base outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        'data-[state=open]:bg-secondary',
        className
      )}
      {...props}
    >
      {children}
      <CaretRight className="ml-auto" />
    </DropdownMenuPrimitive.SubTrigger>
  )
}

function DropdownMenuSubContent({ className, sideOffset = 4, ...props }) {
  return (
    <DropdownMenuPrimitive.Portal>
      <DropdownMenuPrimitive.SubContent
        data-slot="dropdown-menu-sub-content"
        sideOffset={sideOffset}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 z-50 min-w-[11rem] overflow-hidden rounded-md border border-border p-1 shadow-md',
          className
        )}
        {...props}
      />
    </DropdownMenuPrimitive.Portal>
  )
}

export {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent,
}
