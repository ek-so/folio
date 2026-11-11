import { Fragment } from 'react'
import { Check } from '@phosphor-icons/react'
import { cn } from '@/lib/utils.js'
import { Button } from './ui/button.jsx'

// Custom, because shadcn has no stepper: the sign-in's two steps side by side, a line between them.
// Each is a numbered dot and its name: the `current` one filled, a done one (before it) with a ✓ and,
// with `onBack`, a button that goes back to it; one still to come outlined (the next one, with `onForward`, a button that goes on to it)
const STEPS = ['Token', 'Repo']

export default function SignInSteps({ current, onBack, onForward }) {
  return (
    <ol className="flex items-center gap-space-xs" aria-label="Sign-in steps">
      {STEPS.map((name, i) => {
        const done = i < current, now = i === current
        const step = (
          <>
            <span className={cn(
              'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
              now ? 'bg-primary text-primary-foreground' : done ? 'bg-primary/15 text-primary-ink' : 'border border-border text-muted-foreground',
            )}>
              {done ? <Check weight="bold" className="size-3" /> : i + 1}
            </span>
            <span className={cn('text-sm', now ? 'font-medium' : 'text-muted-foreground')}>{name}</span>
          </>
        )
        return (
          <Fragment key={name}>
            {i > 0 && <li aria-hidden className={cn('h-px w-8 shrink-0', done || now ? 'bg-primary' : 'bg-border')} />}
            <li aria-current={now ? 'step' : undefined}>
              {(done && onBack) || (i === current + 1 && onForward)
                ? <Button variant="ghost" className="gap-space-sm px-space-sm font-normal" onClick={done ? onBack : onForward}>{step}</Button>
                : <span className="flex h-control items-center gap-space-sm px-space-sm">{step}</span>}
            </li>
          </Fragment>
        )
      })}
    </ol>
  )
}
