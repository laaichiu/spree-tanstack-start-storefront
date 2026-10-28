import { describe, expect, it } from 'vitest'

import { parseBrandDirectorySearch } from './brand-directory-search'

describe('parseBrandDirectorySearch', () => {
  it('accepts letters, digits, and the non-Latin group', () => {
    expect(parseBrandDirectorySearch({ letter: ' a ', q: 'A Paper ' })).toEqual(
      {
        letter: 'A',
        q: 'A Paper ',
      },
    )
    expect(parseBrandDirectorySearch({ letter: '0-9' }).letter).toBe('0-9')
    expect(parseBrandDirectorySearch({ letter: 'other' }).letter).toBe('other')
  })

  it.each([
    {},
    { letter: 'AB', q: '   ' },
    { letter: '0–9', q: null },
    { letter: ['A'], q: ['Apple'] },
    { letter: 1, q: { name: 'Apple' } },
  ])('drops malformed or empty filters: %j', (search) => {
    expect(parseBrandDirectorySearch(search)).toEqual({
      letter: undefined,
      q: undefined,
    })
  })
})
