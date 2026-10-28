import type { BrandProfile } from '@/lib/brands/contracts/brand'
import { BRAND_DIRECTORY_LETTERS } from '@/lib/brands/contracts/brand-directory-search'
import type {
  BrandDirectoryLetter,
  BrandDirectorySearch,
} from '@/lib/brands/contracts/brand-directory-search'

function normalizeBrandName(value: string) {
  return value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase()
}

function getBrandLetter(name: string): BrandDirectoryLetter {
  const initial = normalizeBrandName(name)
    .replace(/^[\p{P}\p{S}\s]+/u, '')
    .charAt(0)
    .toUpperCase()

  if (/^[0-9]$/.test(initial)) return '0-9'

  return BRAND_DIRECTORY_LETTERS.find((letter) => letter === initial) ?? 'other'
}

export function selectBrandDirectory({
  brands,
  locale,
  search,
}: {
  brands: readonly BrandProfile[]
  locale: string
  search: BrandDirectorySearch
}) {
  const query = normalizeBrandName(search.q ?? '').trim()
  const collator = new Intl.Collator(locale, {
    numeric: true,
    sensitivity: 'base',
  })
  const matchingBrands = brands
    .filter((brand) => normalizeBrandName(brand.name).includes(query))
    .sort((left, right) => collator.compare(left.name, right.name))
  const brandsByLetter = new Map<BrandDirectoryLetter, BrandProfile[]>()

  for (const brand of matchingBrands) {
    const letter = getBrandLetter(brand.name)
    const group = brandsByLetter.get(letter) ?? []
    group.push(brand)
    brandsByLetter.set(letter, group)
  }

  const availableLetters = BRAND_DIRECTORY_LETTERS.filter((letter) =>
    brandsByLetter.has(letter),
  )
  const groups = availableLetters
    .filter((letter) => !search.letter || search.letter === letter)
    .map((letter) => ({
      brands: brandsByLetter.get(letter) ?? [],
      letter,
    }))

  return {
    availableLetters,
    count: groups.reduce((total, group) => total + group.brands.length, 0),
    groups,
  }
}
