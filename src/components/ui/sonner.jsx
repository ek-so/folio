import { Toaster as Sonner } from 'sonner'

// Toasts in theme tokens. `theme` is the app's preference (light | dark | system).
function Toaster({ theme, ...props }) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--foreground)',
        '--normal-border': 'var(--border)',
        '--success-bg': 'var(--success)',
        '--success-text': 'var(--success-foreground)',
        '--success-border': 'var(--success)',
        '--border-radius': 'var(--radius-sm, 8px)',
      }}
      {...props}
    />
  )
}

export { Toaster }
