import { cn } from '@/lib/utils.js'

// An icon in a base-size (40px) square tinted with its own color: the title
// bar's item icon, toasts. Set the color with a text class in `className`.
export default function IconTile({ className, children }) {
  return (
    <span className={cn('flex size-control shrink-0 items-center justify-center rounded-sm bg-current/15', className)}>
      {children}
    </span>
  )
}
