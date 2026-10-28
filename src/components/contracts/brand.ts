import type {
  BrandDirectoryLetter,
  BrandDirectorySearch,
} from '@/lib/brands/contracts/brand-directory-search'

export type BrandDirectoryLetterOption = {
  disabled: boolean
  label: string
  value: BrandDirectoryLetter
}

export type BrandDirectorySearchChange = (
  search: BrandDirectorySearch,
  options?: { replace?: boolean },
) => void
