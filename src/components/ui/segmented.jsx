import { cn } from '@/lib/utils'

// Segmented toggle: a 40px track with 32px segments. options: [value, label, Icon]
export function Segmented({ value, onChange, options, label }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex h-10 gap-1 rounded-sm bg-segment p-1">
      {options.map(([v, text, Icon]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={value === v}
          onClick={() => onChange(v)}
          className={cn(
            'flex h-8 flex-1 items-center justify-center gap-2 rounded text-sm transition-colors outline-none focus-visible:ring-1 focus-visible:ring-ring [&_svg]:size-4',
            value === v ? 'bg-segment-active text-foreground shadow-sm' : 'text-muted-foreground'
          )}
        >
          {Icon && <Icon />}{text}
        </button>
      ))}
    </div>
  )
}
