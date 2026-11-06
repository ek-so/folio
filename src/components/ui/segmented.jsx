import { Tip } from './tooltip.jsx'
import { ToggleGroup, ToggleGroupItem } from './toggle-group.jsx'

// Segmented toggle: a track of control height (p-1) with segments filling it (a shadcn ToggleGroup).
// options: [value, label, Icon]. iconOnly: shows just the icons; the label stays as each segment's name and tooltip
export function Segmented({ value, onChange, options, label, iconOnly }) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={v => v && onChange(v)} // the chosen one stays chosen
      role="radiogroup"
      aria-label={label}
      className="h-control gap-1 rounded-sm bg-segment p-1"
    >
      {options.map(([v, text, Icon]) => (
        <Tip key={v} content={iconOnly ? text : undefined}>
          <ToggleGroupItem value={v} variant="segmented" aria-label={iconOnly ? text : undefined}>
            {Icon && <Icon />}{!iconOnly && text}
          </ToggleGroupItem>
        </Tip>
      ))}
    </ToggleGroup>
  )
}
