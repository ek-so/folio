import { cn } from '@/lib/utils'

// Segmented toggle: a track of control height (p-1) with segments filling it. options: [value, label, Icon]
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-control gap-1 rounded-sm bg-segment p-1">
      {options.map(([v, text, Icon]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'flex h-full flex-1 items-center justify-center gap-2 rounded text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:size-4',
            value === v ? 'bg-segment-active text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          {Icon && <Icon />}{text}
        </button>
      ))}
    </div>
  )
}
