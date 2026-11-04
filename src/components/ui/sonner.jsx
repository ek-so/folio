import { Toaster as Sonner } from 'sonner'
import { CheckCircle, WarningCircle } from '@phosphor-icons/react'
import IconTile from '../IconTile.jsx'

// Toasts in theme tokens, at the bottom center: above the floating
// navigation on phones, where they take the full width inside the 16px gutters.
// Success and error toasts are filled (richColors); their icon sits in an
// `IconTile` like the title bar's, and every padding is 8px.
// Sonner's own styles aren't in a layer, so the overrides are !important. `theme` is the app's preference (light | dark | system).
function Toaster({ theme, ...props }) {
  return (
    <Sonner
      theme={theme}
      className="toaster group"
      position="bottom-center"
      richColors
      icons={{
        success: <IconTile><CheckCircle className="size-5" /></IconTile>,
        error: <IconTile><WarningCircle className="size-5" /></IconTile>,
      }}
      toastOptions={{
        classNames: {
          toast: '!gap-3 !p-space-sm !shadow-lg',
          icon: '!m-0 !size-control',
          title: '!text-sm !font-semibold',
        },
      }}
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
