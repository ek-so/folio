import { cn } from '@/lib/utils.js'

// The app's name "Folio" in the handwritten brand font (`font-brand`), a bit softer than the text.
// `large`: the sign-in title; otherwise the size for the rail's header and the phone's menu button and sheet, nudged
// 4px down to sit centered on the logo beside it (the font's letters sit high in their line). `small`: a bit smaller,
// in the phone's menu button.
export default function BrandName({ large, small }) {
  return (
    <span className={cn('font-brand font-normal tracking-normal text-foreground/85', large ? 'text-4xl leading-normal' : cn('inline-block translate-y-1 leading-none', small ? 'text-lg' : 'text-xl'))}>
      Folio
    </span>
  )
}
