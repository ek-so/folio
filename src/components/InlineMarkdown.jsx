import { useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { inlineHtml } from '../lib/previewLinks.js'
import { cn } from '../lib/utils.js'
import LinkBadge from './LinkBadge.jsx'

// One line of markdown (a property's value, such as a description) with its links as LinkBadges
// (Copy link address only). Whoever shows it opens the links (`openLink`): the note preview, a board card.
export default function InlineMarkdown({ text, path, files, className }) {
  const ref = useRef()
  const html = useMemo(() => inlineHtml(text, path, files), [text, path, files])
  const [spots, setSpots] = useState([])
  useLayoutEffect(() => { setSpots([...ref.current.querySelectorAll('.link-spot')]) }, [html])
  return (
    <>
      <p ref={ref} className={cn('md-inline', className)} dangerouslySetInnerHTML={{ __html: html }} />
      {spots.map((spot, i) => createPortal(<LinkBadge href={spot.dataset.href} text={spot.dataset.text} kind={spot.dataset.kind} />, spot, i))}
    </>
  )
}
