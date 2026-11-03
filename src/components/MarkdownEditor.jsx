import { forwardRef, useMemo, useRef } from 'react'
import { highlightMarkdown } from '../lib/markdown.js'
import { cn } from '@/lib/utils.js'

// Shared by the textarea and its styling layer so they line up exactly
const TEXT_LAYOUT = 'w-full h-full px-5 py-4 font-mono text-base leading-relaxed whitespace-pre-wrap break-words'

// Markdown text box with live styling: a transparent textarea over a styled
// copy of the same text. The ref is the textarea.
//
// Closing the keyboard in any way calls onDone (back to preview): iOS Done,
// tapping elsewhere or Escape. Scrolling keeps editing.
const MarkdownEditor = forwardRef(function MarkdownEditor({ content, onChange, onDone }, textareaRef) {
  const highlightRef = useRef()
  const highlighted = useMemo(() => highlightMarkdown(content), [content])

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
        onChange={e => onChange(e.target.value)}
        onScroll={e => { highlightRef.current.scrollTop = e.currentTarget.scrollTop }}
        onBlur={onDone}
        onKeyDown={e => e.key === 'Escape' && e.currentTarget.blur()}
        spellCheck="true"
        autoCorrect="on"
        placeholder="Start writing…"
      />
    </div>
  )
})

export default MarkdownEditor
