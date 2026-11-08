import { cn } from '@/lib/utils'
import { Tip } from './tooltip.jsx'
import { ToggleGroup, ToggleGroupItem } from './toggle-group.jsx'

// Segmented toggle: a track of control height (p-1) with segments filling it (a shadcn ToggleGroup).
// options: [value, label, Icon]. Two kinds: fitting its content (the default: as wide as its segments, each a labeled
// one 12px on its sides, an icon-only one square) or `stretch` (as wide as its place, its segments sharing it equally).
// iconOnly: shows just the icons; the label stays as each segment's name and tooltip
export function Segmented({ value, onChange, options, label, iconOnly, stretch }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={v => v && onChange(v)} // the chosen one stays chosen
      role="radiogroup"
      aria-label={label}
      className={cn('h-control gap-1 rounded-sm bg-segment p-1', stretch ? 'w-full' : 'w-fit')}
    >
      {options.map(([v, text, Icon]) => (
        <Tip key={v} content={iconOnly ? text : undefined}>
          <ToggleGroupItem value={v} variant="segmented" aria-label={iconOnly ? text : undefined} className={stretch ? 'flex-1 px-3' : iconOnly ? 'aspect-square flex-none' : 'flex-none px-3'}>
            {Icon && <Icon />}{!iconOnly && text}
          </ToggleGroupItem>
        </Tip>
      ))}
    </ToggleGroup>
  )
}
