import PropertyBadges from './PropertyBadges.jsx'
import { cellValue } from '../lib/tables.js'

// A table cell of a typed column in the note preview (MarkdownPreview puts it in the cell's place): a select's value, a
// multi-select's values or a date as the badges a note's properties have (PropertyBadges: a value popover, Edit values,
// a calendar), a checkbox as the preview's task checkbox. `name`: the column's (an empty cell's badge shows it).
// `column` gives what the badges need ({ options, colors, count, onRemoveValue, onEditValue }); with `onChange(text)` the
// cell can be changed (its text in the note is rewritten), else it only shows.
export default function TableCell({ type, name, text, column, onChange }) {
  if (type === 'checkbox') {
    return <input type="checkbox" aria-label={name} checked={cellValue(type, text)} disabled={!onChange} onChange={e => onChange(column.checkboxText(e.target.checked))} />
  }
  const value = type === 'multi' ? cellValue(type, text) : text.trim()
  return (
    <PropertyBadges
      props={[{ key: name, value }]} unit="row" scopeName="this table"
      dateKeys={type === 'date' ? [name] : undefined}
      options={() => column.options} chosen={{ [name]: column.colors }} valueCount={(_, v) => column.count(v)}
      onChange={onChange && ((_, v) => onChange(Array.isArray(v) ? v.join(', ') : v))}
      onRemoveValue={onChange && column.onRemoveValue && ((_, v) => column.onRemoveValue(v))}
      onEditValue={onChange && column.onEditValue && ((_, from, to, color) => column.onEditValue(from, to, color))}
    />
  )
}
