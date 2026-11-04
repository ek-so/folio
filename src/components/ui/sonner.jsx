import { Toaster as Sonner } from 'sonner'

// Toasts in theme tokens, at the bottom center: above the floating
// navigation on phones, where they take the full width inside the 16px gutters.
// Success and error toasts are filled (richColors). `theme` is the app's preference (light | dark | system).
function Toaster({ theme, ...props }) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-center"
      richColors
      offset={{ bottom: 'var(--toast-bottom)' }}
      mobileOffset={{ bottom: 'var(--toast-bottom)', left: 'var(--space)', right: 'var(--space)' }}
      style={{
        '--normal-bg': 'var(--popover)',
        '--normal-text': 'var(--foreground)',
        '--normal-border': 'var(--border)',
        '--success-bg': 'var(--success)',
        '--success-text': 'var(--success-foreground)',
        '--success-border': 'var(--success)',
        '--error-bg': 'var(--destructive)',
        '--error-text': 'var(--destructive-foreground)',
        '--error-border': 'var(--destructive)',
        '--border-radius': 'var(--radius-sm, 8px)',
      }}
      {...props}
    />
  )
}

export { Toaster }
