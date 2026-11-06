import { useMemo } from 'react'
import { dateSpans, withDate } from '../lib/markdown.js'

// The date badges of `text` (a note, or a property's description) moved to another day, saved by
// `onChange(newText)`. `dateProps(spot, i)` gives the i-th date spot's DateField its `date` and `onPick`: none
// without `onChange` or when the spot isn't the i-th date found in the text (dateSpans). A date tapped off stays
export function useDateEdits(text, onChange) {
  const spans = useMemo(() => dateSpans(text), [text])
  return (spot, i) => {
    const span = spans[i]
    if (!onChange || !span || text.slice(span.start, span.end) !== spot.dataset.raw) return {}
    return { date: span.date, onPick: date => { if (date) onChange(withDate(text, span, date)) } }
  }
}
