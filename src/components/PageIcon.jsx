// A page's icon (lib/pages.js pageInfo): a view's chosen emoji in place of its icon, else the icon itself
export default function PageIcon({ page }) {
  return page.emoji
    ? <span aria-hidden className="flex size-4 shrink-0 items-center justify-center text-base leading-none">{page.emoji}</span>
    : <page.icon />
}
