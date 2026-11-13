import { forwardRef, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { highlightMarkdown, keyLines, continueList, repoLink } from '../lib/markdown.js'
import { typedLink, linkTargets } from '../lib/links.js'
import { displayName } from '../lib/files.js'
import { Popover, PopoverAnchor, PopoverContent } from './ui/popover.jsx'
import { ListRow, ListBox } from './ui/list-row.jsx'
import FileIcon from './FileIcon.jsx'
import { cn } from '@/lib/utils.js'

// Shared by the textarea and its styling layer so they line up exactly
const TEXT_LAYOUT = 'w-full h-full p-space font-mono text-base leading-relaxed whitespace-pre-wrap break-words'

// Markdown text box with live styling: a transparent textarea over a styled
// copy of the same text. The ref is the textarea.
//
// Closing the keyboard in any way calls onDone (back to preview): iOS Done,
// tapping elsewhere or Escape. Scrolling keeps editing.
// Enter in a list continues it (`continueList`).
// Typing `[[` suggests the repo's files (`files`, never the note's own `path`) in a popover at the caret, narrowed by
// what's typed after it (`typedLink`, `linkTargets`); ↑ ↓ choose, Enter or Tab or a tap puts in the link to it, from the
// repo's root as Copy link makes it (`repoLink`), and Escape closes the list (not the editor).
// `locked`: property keys that can't be changed here (a planner's date and repeat: their badges change them): their lines
// (`keyLines`) are greyed out, and typing that would change, add or remove one is refused, with a message.
const NONE = []

const NO_FILES = {}

const MarkdownEditor = forwardRef(function MarkdownEditor({ content, onChange, onDone, locked: lockedKeys = NONE, files = NO_FILES, path }, textareaRef) {
  const lockedKey = lockedKeys.join('\n')
  const locked = useMemo(() => lockedKey ? lockedKey.split('\n') : NONE, [lockedKey]) // the same list while its keys are
  const highlightRef = useRef()
  const selection = useRef([0, 0]) // the selection before the latest typing, to put back when it's refused
  const highlighted = useMemo(() => highlightMarkdown(content, locked), [content, locked])
  const own = useRef() // the textarea, also given to `textareaRef`
  const markRef = useRef() // the typed `[[` in the measuring copy, where the suggestions open
  const [caret, setCaret] = useState(null) // null: not focused
  const [scrollTop, setScrollTop] = useState(0)
  const [dismissed, setDismissed] = useState(null) // the `[[` whose suggestions Escape (or a tap outside) closed
  const [active, setActive] = useState(0)
  const [at, setAt] = useState(null) // { top, left } of the `[[`, inside the editor
  const typed = caret === null ? null : typedLink(content, caret)
  const query = typed?.query
  const targets = useMemo(() => query === undefined ? [] : linkTargets(Object.keys(files), query, path), [files, query, path])
  const suggesting = targets.length > 0 && dismissed !== typed.from

  useEffect(() => setActive(0), [query])
  useLayoutEffect(() => {
    if (!suggesting) return
    const mark = markRef.current
    setAt({ top: mark.offsetTop + mark.offsetHeight - scrollTop, left: mark.offsetLeft })
  }, [suggesting, typed?.from, content, scrollTop])

  function setRef(el) {
    own.current = el
    if (typeof textareaRef === 'function') textareaRef(el)
    else if (textareaRef) textareaRef.current = el
  }

  // Typed through the browser (insertText) so undo keeps working
  function insert(t, from, to, text) {
    t.setSelectionRange(from, to)
    if (!document.execCommand('insertText', false, text)) {
      t.setRangeText(text, from, to, 'end')
      handleChange({ target: t, currentTarget: t })
    }
  }

  function pick(target) {
    insert(own.current, typed.from, typed.to, repoLink(target))
  }

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

  // While suggesting links: ↑ ↓ choose, Enter or Tab picks, Escape closes the list. Otherwise Enter in a list starts the next item
  function handleKeyDown(e) {
    if (suggesting && !e.nativeEvent.isComposing) {
      const move = { ArrowDown: 1, ArrowUp: -1 }[e.key]
      if (move) {
        e.preventDefault()
        return setActive(i => (i + move + targets.length) % targets.length)
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        return pick(targets[active])
      }
      if (e.key === 'Escape') return setDismissed(typed.from)
    }
    if (e.key === 'Escape') return e.currentTarget.blur()
    const t = e.currentTarget
    if (e.key !== 'Enter' || e.shiftKey || e.nativeEvent.isComposing || t.selectionStart !== t.selectionEnd) return
    const edit = continueList(t.value, t.selectionStart)
    if (!edit) return
    e.preventDefault()
    insert(t, edit.from, edit.to, edit.insert)
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
      {typed && (
        // A copy of the text up to the `[[`, laid out as the textarea's, to find where it is
        <div aria-hidden="true" className={cn(TEXT_LAYOUT, 'invisible absolute inset-0 overflow-hidden m-0')}>
          {content.slice(0, typed.from)}<span ref={markRef}>[[</span>
        </div>
      )}
      <textarea
        ref={setRef}
        className={cn(TEXT_LAYOUT, 'absolute inset-0 overflow-y-auto bg-transparent text-transparent caret-foreground selection:bg-primary/30 resize-none outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden')}
        value={content}
        onChange={handleChange}
        onSelect={e => {
          const { selectionStart, selectionEnd } = e.currentTarget
          selection.current = [selectionStart, selectionEnd]
          setCaret(selectionStart === selectionEnd ? selectionStart : null)
        }}
        onScroll={e => { highlightRef.current.scrollTop = e.currentTarget.scrollTop; setScrollTop(e.currentTarget.scrollTop) }}
        onBlur={() => { setCaret(null); onDone() }}
        onKeyDown={handleKeyDown}
        spellCheck="true"
        autoCorrect="on"
        placeholder="Start writing…"
      />
      <Popover open={suggesting && !!at} onOpenChange={open => { if (!open) setDismissed(typed?.from ?? null) }}>
        {at && <PopoverAnchor className="absolute h-0 w-0" style={{ top: at.top, left: at.left }} />}
        <PopoverContent
          className="w-72"
          updatePositionStrategy="always" // follows the caret as it moves
          onOpenAutoFocus={e => e.preventDefault()}
          onEscapeKeyDown={e => e.preventDefault()} // the textarea's Escape closes the list, keeping the editor
          onCloseAutoFocus={e => e.preventDefault()}
          onInteractOutside={e => { if (e.target === own.current) e.preventDefault() }} // the caret moving in the text: it decides
          onPointerDown={e => e.preventDefault()} // a tap here keeps the keyboard and the editor open
          onMouseDown={e => e.preventDefault()}
        >
          <ListBox aria-label="Link to">
            {targets.map((target, i) => (
              <li key={target}>
                <ListRow
                  icon={<FileIcon path={target} />}
                  title={displayName(target)}
                  description={target.split('/').slice(0, -1).join('/')}
                  active={i === active}
                  onClick={() => pick(target)}
                />
              </li>
            ))}
          </ListBox>
        </PopoverContent>
      </Popover>
    </div>
  )
})

export default MarkdownEditor

// The lines of `text` that set the `keys` properties (keyLines), as one string to compare
const lockedProps = (text, keys) => {
  const lines = text.split('\n')
  return keyLines(text, keys).map(i => lines[i]).join('\n')
}
