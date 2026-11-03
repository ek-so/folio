import { describe, it, expect } from 'vitest'
import { renderBlocks, tapOffset, taskOffsets, highlightMarkdown } from './markdown.js'

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
  it('styles markdown without changing the text', () => {
    const md = '# Title\nSee [docs](a.md), **bold** and *it* <u>u</u> snake_case_name'
    const html = highlightMarkdown(md)
    const text = html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')
    expect(text).toBe(md + ' ')
    const m = s => `<span class="opacity-50">${s}</span>`
    expect(html).toContain(`<span class="font-bold">${m('# ')}Title</span>`)
    expect(html).toContain(`<span class="text-primary">${m('[')}docs${m('](a.md)')}</span>`)
    expect(html).toContain(`<span class="font-bold">${m('**')}bold${m('**')}</span>`)
    expect(html).toContain(`<span class="italic">${m('*')}it${m('*')}</span>`)
    expect(html).toContain(`<span class="underline">${m('&lt;u&gt;')}u${m('&lt;/u&gt;')}</span>`)
    expect(html).not.toContain('<span class="italic">_case_</span>')
    expect(highlightMarkdown('[docs(a.md)')).not.toContain('text-primary')
  })

  it('fades line markers', () => {
    const m = s => `<span class="opacity-50">${s}</span>`
    expect(highlightMarkdown('- [ ] task')).toBe(`${m('- [ ]')} task `)
    expect(highlightMarkdown('> quote')).toBe(`${m('&gt; ')}quote `)
    expect(highlightMarkdown('---')).toBe(`${m('---')} `)
  })
})
