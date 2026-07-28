import { describe, expect, it } from 'vitest'

import { md5Base64 } from './md5'

describe('md5Base64', () => {
  it('creates the Active Storage checksum for browser file bytes', () => {
    expect(md5Base64(new TextEncoder().encode('review image'))).toBe(
      'IwE3ZWFq03DKKvSY6KQDKA==',
    )
  })
})
