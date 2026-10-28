import type { BrandDirectoryLetterOption } from '@/components/contracts/brand'
import { BRAND_DIRECTORY_LETTERS } from '@/lib/brands/contracts/brand-directory-search'
import type { BrandDirectoryLetter } from '@/lib/brands/contracts/brand-directory-search'
import type { MessageKey } from '@/lib/i18n/messages'

export function getBrandDirectoryLetterOptions({
  availableLetters,
  selectedLetter,
  t,
}: {
  availableLetters: readonly BrandDirectoryLetter[]
  selectedLetter?: BrandDirectoryLetter
  t: (key: MessageKey) => string
}): BrandDirectoryLetterOption[] {
  return BRAND_DIRECTORY_LETTERS.filter(
    (letter) =>
      letter !== 'other' ||
      availableLetters.includes(letter) ||
      selectedLetter === letter,
  ).map((letter) => ({
    disabled: !availableLetters.includes(letter) && selectedLetter !== letter,
    label: getBrandDirectoryLetterLabel(letter, t),
    value: letter,
  }))
}

export function getBrandDirectoryLetterLabel(
  letter: BrandDirectoryLetter,
  t: (key: MessageKey) => string,
): string {
  if (letter === 'other') {
    return t('brand.otherLetters')
  }

  if (letter === '0-9') {
    return '0–9'
  }

  return letter
}
