export const BRAND_DIRECTORY_LETTERS = [
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '0-9',
  'other',
] as const

export type BrandDirectoryLetter = (typeof BRAND_DIRECTORY_LETTERS)[number]

export type BrandDirectorySearch = {
  letter?: BrandDirectoryLetter
  q?: string
}

export function parseBrandDirectorySearch(
  search: Record<string, unknown>,
): BrandDirectorySearch {
  const letter =
    typeof search.letter === 'string' ? search.letter.trim().toUpperCase() : ''

  return {
    letter: BRAND_DIRECTORY_LETTERS.find(
      (value) => value.toUpperCase() === letter,
    ),
    // Preserve spaces while typing; the directory selector trims for matching.
    q: typeof search.q === 'string' && search.q.trim() ? search.q : undefined,
  }
}
