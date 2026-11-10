import { cn } from '@/lib/utils.js'

// The app's name "Folio" in the handwritten brand font (`font-brand`), a bit softer than the text.
// `large`: the sign-in title; otherwise the size for the rail's and menu sheet's headers, nudged
// 4px down to sit centered on the logo beside it (the font's letters sit high in their line).
export default function BrandName({ large }) {
  return (
    <span className={cn('font-brand font-normal tracking-normal text-foreground/85', large ? 'text-4xl leading-normal' : 'inline-block translate-y-1 text-xl leading-none')}>
      Folio
    </span>
  )
}
