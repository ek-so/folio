import { describe, it, expect } from 'vitest'
import { blobSha, encodeText } from './github.js'

describe('blobs', () => {
  it('computes the same sha as git', async () => {
    // git hash-object of "hello\n"
    expect(await blobSha('hello\n')).toBe('ce013625030ba8dba906f756967f9e9ca394464a')
  })

  it('encodes UTF-8 text as base64', () => {
    expect(encodeText('é ✓')).toBe(Buffer.from('é ✓').toString('base64'))
  })
})
