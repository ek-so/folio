import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { inlineHtml } from '../lib/previewLinks.js'
import { cn } from '../lib/utils.js'
import LinkBadge from './LinkBadge.jsx'
import { DateField } from './DateBadge.jsx'
import { useDateEdits } from '../hooks/useDateEdits.js'
import { useLinkEdits } from '../hooks/useLinkEdits.jsx'
import { linkSpans } from '../lib/markdown.js'

// One line of markdown (a property's value, such as a description) with its dates as DateBadges and its links as LinkBadges, as in the
// note (with `onChange(newText)`: a date's calendar, a link's Edit link and Remove). Whoever shows it opens the links
// (`openLink`): the note preview, a board card.
export default function InlineMarkdown({ text, path, files, onChange, className }) {
  const ref = useRef()
  const html = useMemo(() => inlineHtml(text, path, files), [text, path, files])
  const [spots, setSpots] = useState([])
  const [dates, setDates] = useState([])
  const spans = useMemo(() => linkSpans(text), [text])
  const linkEdits = useLinkEdits(text, onChange)
  const dateProps = useDateEdits(text, onChange)
  useLayoutEffect(() => {
    setSpots([...ref.current.querySelectorAll('.link-spot')])
    setDates([...ref.current.querySelectorAll('.date-spot')])
  }, [html])
  return (
    <>
      <p ref={ref} className={cn('md-inline', className)} dangerouslySetInnerHTML={{ __html: html }} />
      {spots.map((spot, i) => {
        const { href, text: label, kind, path: target } = spot.dataset
        return createPortal(<LinkBadge href={href} text={label} kind={kind} path={target} {...linkEdits.actions(spans[spot.dataset.span], label)} />, spot, i)
      })}
      {dates.map((spot, i) => createPortal(<DateField inline label={spot.dataset.label} {...dateProps(spot, i)} />, spot, `date-${i}`))}
      {linkEdits.dialogs}
    </>
  )
}
