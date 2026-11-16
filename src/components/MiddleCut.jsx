// Text cut in the middle when it doesn't fit, so its end (the last TAIL characters) always shows: a link badge's text,
// a broken link's target (where two paths differ is usually at the end). CSS can only cut at the end.
const TAIL = 14
export default function MiddleCut({ text }) {
  if (text.length <= TAIL * 2) return <span className="truncate">{text}</span>
  return (
    <span className="flex min-w-0">
      <span className="truncate">{text.slice(0, -TAIL)}</span>
      <span className="shrink-0 whitespace-pre">{text.slice(-TAIL)}</span>
    </span>
  )
}
