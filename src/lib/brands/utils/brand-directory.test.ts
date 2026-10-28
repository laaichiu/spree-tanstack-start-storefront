import { describe, expect, it } from 'vitest'

import type { BrandProfile } from '@/lib/brands/contracts/brand'

import { selectBrandDirectory } from './brand-directory'

function brand(name: string): BrandProfile {
  return {
    about: '',
    aboutHtml: '',
    coverPhotoUrl: null,
    id: name,
    logoUrl: null,
    name,
    slug: name,
    squareLogoUrl: null,
  }
}

const brands = [
  'Zebra',
  'À la Bonne Renommée',
  'A Paper Kid',
  'apple',
  'Éditions',
  '101 Studio',
  '2 Studio',
  '無印良品',
  '*Beta',
].map(brand)

describe('selectBrandDirectory', () => {
  it('groups accented, numeric, and non-Latin names without mutating input', () => {
    const originalOrder = brands.map((item) => item.name)
    const directory = selectBrandDirectory({ brands, locale: 'en', search: {} })

    expect(directory.availableLetters).toEqual([
      'A',
      'B',
      'E',
      'Z',
      '0-9',
      'other',
    ])
    expect(directory.count).toBe(brands.length)
    expect(directory.groups[0].brands.map((item) => item.name)).toEqual([
      'À la Bonne Renommée',
      'A Paper Kid',
      'apple',
    ])
    expect(
      directory.groups
        .find((group) => group.letter === '0-9')
        ?.brands.map((item) => item.name),
    ).toEqual(['2 Studio', '101 Studio'])
    expect(brands.map((item) => item.name)).toEqual(originalOrder)
  })

  it('matches names regardless of case, diacritics, and surrounding spaces', () => {
    const directory = selectBrandDirectory({
      brands,
      locale: 'fr',
      search: { q: '  EDITIONS ' },
    })

    expect(directory.count).toBe(1)
    expect(directory.groups[0].brands[0].name).toBe('Éditions')
    expect(directory.availableLetters).toEqual(['E'])
  })

  it('combines name and letter filters while keeping other matching letters available', () => {
    const directory = selectBrandDirectory({
      brands,
      locale: 'en',
      search: { letter: 'A', q: 'a' },
    })

    expect(directory.groups.map((group) => group.letter)).toEqual(['A'])
    expect(directory.count).toBe(3)
    expect(directory.availableLetters).toContain('Z')
  })

  it('returns a recoverable empty result for unmatched searches and letters', () => {
    expect(
      selectBrandDirectory({ brands, locale: 'en', search: { q: 'missing' } }),
    ).toEqual({
      availableLetters: [],
      count: 0,
      groups: [],
    })
    expect(
      selectBrandDirectory({ brands, locale: 'en', search: { letter: 'C' } })
        .count,
    ).toBe(0)
    expect(
      selectBrandDirectory({ brands: [], locale: 'ja', search: {} }).groups,
    ).toEqual([])
  })
})
