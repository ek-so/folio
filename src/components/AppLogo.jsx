import { cn } from '@/lib/utils.js'

// The app's logo (the same artwork as the favicon and home-screen icons in public/), decorative. Size it with `className`.
export default function AppLogo({ className }) {
  return <img src={`${import.meta.env.BASE_URL}folio-logo.png`} alt="" className={cn('shrink-0 object-contain', className)} />
}
