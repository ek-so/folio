import { cn } from '@/lib/utils.js'

// The sign-in screens' frame (token, then repository): a centered column on the page background, a `logo`
// (an icon), the app's or the step's `title` (`brand`: the app's name, in the handwritten brand font) and a muted `intro`, then `children` (its form)
export default function AuthLayout({ logo, title, brand, intro, children }) {
  return (
    <div className="flex min-h-full items-center justify-center bg-background p-space-lg">
      <div className="flex w-full max-w-sm flex-col items-center gap-space">
        {logo}
        <h1 className={cn('font-bold', brand ? 'font-brand text-5xl leading-none text-primary-ink' : 'text-2xl tracking-tight')}>{title}</h1>
        <p className="text-center text-sm text-muted-foreground">{intro}</p>
        {children}
      </div>
    </div>
  )
}
