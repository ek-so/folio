import { Placeholder } from './ui/placeholder.jsx'

// A page's title as text (lib/pages.js pageInfo): a view with no name shows a light Untitled
export default function PageTitle({ page }) {
  return page.untitled ? <Placeholder>{page.title}</Placeholder> : page.title
}
