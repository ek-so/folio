import { forwardRef, useMemo, useRef } from 'react'
import { toast } from 'sonner'
import { highlightMarkdown, keyLines, continueList } from '../lib/markdown.js'
import { cn } from '@/lib/utils.js'

// Shared by the textarea and its styling layer so they line up exactly
const TEXT_LAYOUT = 'w-full h-full p-space font-mono text-base leading-relaxed whitespace-pre-wrap break-words'

// Markdown text box with live styling: a transparent textarea over a styled
// copy of the same text. The ref is the textarea.
//
// Closing the keyboard in any way calls onDone (back to preview): iOS Done,
// tapping elsewhere or Escape. Scrolling keeps editing.
// Enter in a list continues it (`continueList`).
// `locked`: property keys that can't be changed here (a planner's date and repeat: their badges change them): their lines
// (`keyLines`) are greyed out, and typing that would change, add or remove one is refused, with a message.
const NONE = []

const MarkdownEditor = forwardRef(function MarkdownEditor({ content, onChange, onDone, locked: lockedKeys = NONE }, textareaRef) {
  const lockedKey = lockedKeys.join('\n')
  const locked = useMemo(() => lockedKey ? lockedKey.split('\n') : NONE, [lockedKey]) // the same list while its keys are
  const highlightRef = useRef()
  const selection = useRef([0, 0]) // the selection before the latest typing, to put back when it's refused
  const highlighted = useMemo(() => highlightMarkdown(content, locked), [content, locked])

  function handleChange(e) {
    const next = e.target.value
    if (!locked.length || lockedProps(next, locked) === lockedProps(content, locked)) return onChange(next)
    // Refused: the text stays as it was (React puts it back), and so does the selection
    const textarea = e.currentTarget
    const [start, end] = selection.current
    requestAnimationFrame(() => textarea.setSelectionRange(start, end))
    const names = locked.join(' and ')
    toast.error(`${names.charAt(0).toUpperCase() + names.slice(1)} can only be changed with ${locked.length === 1 ? 'its badge' : 'their badges'}.`, { id: 'locked-properties' })
  }

  // Enter in a list starts the next item. Typed through the browser (insertText) so undo keeps working
  function handleKeyDown(e) {
    if (e.key === 'Escape') return e.currentTarget.blur()
    const t = e.currentTarget
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || t.selectionStart !== t.selectionEnd) return
    const edit = continueList(t.value, t.selectionStart)
    if (!edit) return
    e.preventDefault()
    t.setSelectionRange(edit.from, edit.to)
    if (!document.execCommand('insertText', false, edit.insert)) {
      t.setRangeText(edit.insert, edit.from, edit.to, 'end')
      handleChange({ target: t, currentTarget: t })
    }
  }

  return (
    // data-no-pull: drags here scroll, never refresh
    <div className="relative flex-1 min-h-0 bg-card" data-no-pull>
      <pre
        ref={highlightRef}
        aria-hidden="true"
        className={cn(TEXT_LAYOUT, 'absolute inset-0 overflow-hidden m-0 text-foreground pointer-events-none')}
        dangerouslySetInnerHTML={{ __html: highlighted }}
      />
      <textarea
        ref={textareaRef}
        className={cn(TEXT_LAYOUT, 'absolute inset-0 overflow-y-auto bg-transparent text-transparent caret-foreground selection:bg-primary/30 resize-none outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}
        value={content}
        onChange={handleChange}
        onSelect={e => { selection.current = [e.currentTarget.selectionStart, e.currentTarget.selectionEnd] }}
        onScroll={e => { highlightRef.current.scrollTop = e.currentTarget.scrollTop }}
        onBlur={onDone}
        onKeyDown={handleKeyDown}
        spellCheck="true"
        autoCorrect="on"
        placeholder="Start writing…"
      />
    </div>
  )
})

export default MarkdownEditor

// The lines of `text` that set the `keys` properties (keyLines), as one string to compare
const lockedProps = (text, keys) => {
  const lines = text.split('\n')
  return keyLines(text, keys).map(i => lines[i]).join('\n')
}
