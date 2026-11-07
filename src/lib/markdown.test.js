import { describe, it, expect } from 'vitest'
import { renderBlocks, tapOffset, taskOffsets, taskProgress, linkSpans, linkMarkdown, replaceLink, repoLink, listsIn, moveListItem, highlightMarkdown, keyLines, renderInline } from './markdown.js'

describe('markdown', () => {
  it('tags each block with its source range', () => {
    const md = '# Title\n\nSome **bold** text.\n'
    const html = renderBlocks(md)
    const starts = [...html.matchAll(/data-src="(\d+)" data-len="(\d+)"/g)].map(m => md.slice(+m[1], +m[1] + +m[2]))
    expect(starts).toEqual(['# Title\n\n', 'Some **bold** text.\n'])
  })

  it('renders --- under text as a divider, with offsets matching the note', () => {
    const md = 'a\nb\n---\n- [ ] one\n'
    const html = renderBlocks(md)
    expect(html).toContain('<p>a<br>b</p>')
    expect(html).toContain('<hr>')
    const blocks = [...html.matchAll(/data-src="(\d+)" data-len="(\d+)"/g)].map(m => md.slice(+m[1], +m[1] + +m[2]))
    expect(blocks).toEqual(['a\nb\n', '---\n', '- [ ] one\n'])
    expect(renderBlocks('Title\n===\n')).toContain('<h1>Title</h1>')
  })

  it('keeps a <details> accordion in one block', () => {
    const md = '<details>\n<summary>More</summary>\n\n- [ ] **one**\n\n</details>\n\nAfter\n'
    const html = renderBlocks(md)
    const blocks = [...html.matchAll(/data-src="(\d+)" data-len="(\d+)"/g)].map(m => md.slice(+m[1], +m[1] + +m[2]))
    expect(blocks).toEqual(['<details>\n<summary>More</summary>\n\n- [ ] **one**\n\n</details>\n\n', 'After\n'])
    expect(html).toMatch(/<details>[\s\S]*<strong>one<\/strong>[\s\S]*<\/details>/)
  })

  it('finds only the checkbox opening each task item', () => {
    const raw = '- [ ] see [x] here\n  1. [X] b\n> - [ ] c\n'
    expect(taskOffsets(raw).map(i => raw[i])).toEqual([' ', 'X', ' '])
    expect(taskOffsets(raw)[0]).toBe(3)
  })

  it('counts a note\'s ticked tasks, outside front matter and code', () => {
    const md = '---\nlist:\n  - [x] no\n---\n- [x] a\n- [ ] b\n  - [X] c\n```\n- [x] code\n```\n'
    expect(taskProgress(md)).toEqual({ done: 2, total: 3 })
    expect(taskProgress('no tasks')).toEqual({ done: 0, total: 0 })
  })

  it('finds every link with its source range', () => {
    const md = '---\nu: https://x.io\n---\nSee [the **docs**](https://a.io) and https://b.io.\n\n| [c][r] |\n|-|\n| ![i](p.png) |\n\n[r]: notes/c.md\n'
    const spans = linkSpans(md)
    expect(spans.map(s => md.slice(s.start, s.end))).toEqual(['[the **docs**](https://a.io)', 'https://b.io', '[c][r]'])
    expect(spans.map(s => [s.label, s.href, s.bare])).toEqual([['the **docs**', 'https://a.io', false], ['https://b.io', 'https://b.io', true], ['c', 'notes/c.md', false]])
  })

  it('writes and removes links', () => {
    expect(linkMarkdown('Docs', ' https://a.io ')).toBe('[Docs](https://a.io)')
    expect(linkMarkdown('', 'https://a.io', true)).toBe('https://a.io')
    expect(linkMarkdown('', 'https://a.io', false)).toBe('[https://a.io](https://a.io)')
    expect(linkMarkdown('My note', 'notes/my note.md')).toBe('[My note](<notes/my note.md>)')
    expect(repoLink('notes/My note.md')).toBe('[My note](</notes/My note.md>)')
    expect(repoLink('docs')).toBe('[docs](/docs)')
    const md = 'See [a](https://a.io) here'
    const [span] = linkSpans(md)
    expect(replaceLink(md, span, '[b](https://b.io)')).toBe('See [b](https://b.io) here')
    expect(replaceLink(md, span, '')).toBe('See here')
    expect(replaceLink('[a](x) end', linkSpans('[a](x) end')[0], '')).toBe('end')
  })

  it('finds list items and their nested lists', () => {
    const md = '- [ ] a\n  more a\n  - a1\n  - a2\n- [x] b\n\n- c\n* d\n'
    const lists = listsIn(md)
    expect(lists.map(l => l.items.map(i => md.slice(i.start, i.end)))).toEqual([
      ['- [ ] a\n  more a\n  - a1\n  - a2\n', '- [x] b\n\n', '- c\n'],
      ['  - a1\n', '  - a2\n'],
      ['* d\n'],
    ])
    expect(listsIn('3) x\n4) y').map(l => [l.ordered, l.first, l.items.length])).toEqual([[true, 3, 2]])
    expect(lists[0].items.map(i => i.word)).toEqual(['a', 'b', 'c'])
    expect(listsIn('- [ ] **Fix** [the docs](u)\n')[0].items[0].word).toBe('Fix')
  })

  it('moves a list item with its sub-items, renumbering an ordered list', () => {
    const md = 'Intro\n\n- a\n  - a1\n- b\n- c'
    const [list] = listsIn(md.slice(7)).map(l => ({ ...l, items: l.items.map(i => ({ start: i.start + 7, end: i.end + 7 })) }))
    expect(moveListItem(md, list, 0, 2)).toBe('Intro\n\n- b\n- c\n- a\n  - a1')
    const ol = '1. one\n2. two\n\n3. three\n'
    expect(moveListItem(ol, listsIn(ol)[0], 2, 0)).toBe('1. three\n2. one\n\n3. two\n')
  })

  it('renders smart-punctuated dashes as a divider', () => {
    expect(renderBlocks('a\n\n—-\n\nb')).toContain('<hr>')
    expect(renderBlocks('a\n—-\nb')).toContain('<hr>')
    expect(renderBlocks('x — y')).not.toContain('<hr>')
    expect(renderBlocks('—')).not.toContain('<hr>')
  })

  it('renders GitHub alerts as titled callouts', () => {
    const html = renderBlocks('> [!WARNING]\n> Mind the **gap**.')
    expect(html).toContain('class="callout callout-warning"')
    expect(html).toContain('<p class="callout-title">Warning</p>')
    expect(html).toContain('Mind the <strong>gap</strong>.')
    expect(html).not.toContain('[!WARNING]')
    expect(renderBlocks('> plain quote')).not.toContain('callout')
  })

  it('maps a tap to the same occurrence and letter of the word', () => {
    const raw = 'a cat and a **cat** here'
    // rendered "a cat and a cat here", tap inside the second "cat" after "c"
    expect(tapOffset(raw, 'a cat and a c', 'at here')).toBe(raw.indexOf('**cat**') + 3)
    expect(tapOffset(raw, 'a c', 'at and a cat here')).toBe(3)
    expect(tapOffset(raw, 'a cat and ', ' ')).toBe(0)
  })
})

describe('highlightMarkdown', () => {
  it('greys out the locked properties of the front matter only', () => {
    const html = highlightMarkdown('---\ndate: 4 Nov 2026\ntags:\n  - a\nrepeat: weekly\n# note\n...\ndate: in the text', ['date', 'repeat'])
    expect(html).toContain('<span class="text-muted-foreground/50">date: 4 Nov 2026</span>')
    expect(html).toContain('<span class="text-muted-foreground/50">repeat: weekly</span>')
    expect(html).not.toContain('muted-foreground/50">tags')
    expect(html).not.toContain('muted-foreground/50">  - a')
    expect(html).not.toContain('muted-foreground/50"># note')
    expect(html).not.toContain('muted-foreground/50">date: in the text')
    expect(keyLines('---\ndate:\n  - 4 Nov 2026\ntags: a\n---\n', ['date'])).toEqual([1, 2]) // with its list lines
    expect(keyLines('---\ndate: 4 Nov 2026\nno closing line', ['date'])).toEqual([]) // not front matter
  })

  it('styles markdown without changing the text', () => {
    const md = '# Title\nSee [docs](a.md), **bold** and *it* <u>u</u> snake_case_name'
    const html = highlightMarkdown(md)
    const text = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    expect(text).toBe(md + ' ')
    expect(html).toContain('<span class="text-primary-ink">[docs](a.md)</span>')
    expect(html).toContain('<span class="font-bold">**bold**</span>')
    expect(html).toContain('<span class="italic">*it*</span>')
    expect(html).not.toContain('<span class="italic">_case_</span>')
    expect(highlightMarkdown('[docs(a.md)')).not.toContain('text-primary-ink')
  })

  it('shows the dates of one line as date spots, not in code', () => {
    expect(renderInline('Call on **17.10.2026 2pm**, not `2026-10-17`')).toBe('Call on <strong><time class="date-spot" datetime="2026-10-17T14:00" data-label="17 Oct 2026, 14:00" data-raw="17.10.2026 2pm"></time></strong>, not <code>2026-10-17</code>')
  })

  it('shows dates as date spots, not in code or links', () => {
    const html = renderBlocks('| When | What |\n|---|---|\n| 2025-03-18 | due **17.10.2026 2pm**, not `2025-05-01` or 2025-02-30 or [2025-06-01](a.md) |\n\n- Oct 17, 2026\n')
    const spots = [...html.matchAll(/<time class="date-spot" datetime="([\dT:-]+)" data-label="([^"]+)"/g)].map(m => [m[1], m[2]])
    expect(spots).toEqual([['2025-03-18', '18 Mar 2025'], ['2026-10-17T14:00', '17 Oct 2026, 14:00'], ['2026-10-17', '17 Oct 2026']])
  })
})
