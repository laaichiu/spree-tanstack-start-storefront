import { Button } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import type { BrandDirectoryLetterOption } from '@/components/contracts/brand'
import type { BrandDirectoryLetter } from '@/lib/brands/contracts/brand-directory-search'

type BrandDirectoryLetterFilterViewProps = {
  allBrandsLabel: string
  ariaLabel: string
  onSelectLetter: (letter?: BrandDirectoryLetter) => void
  options: readonly BrandDirectoryLetterOption[]
  selectedLetter?: BrandDirectoryLetter
}

export function BrandDirectoryLetterFilterView({
  allBrandsLabel,
  ariaLabel,
  onSelectLetter,
  options,
  selectedLetter,
}: BrandDirectoryLetterFilterViewProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className="mb-8 grid grid-cols-8 gap-1 border-y border-border py-3 sm:flex sm:flex-wrap sm:items-center lg:mb-12 lg:justify-between lg:gap-0"
    >
      <Button
        aria-controls="brand-directory-results"
        aria-pressed={!selectedLetter}
        className={cn(
          'col-span-2 h-10 min-w-0 px-3 normal-case sm:min-w-10',
          !selectedLetter &&
            'bg-foreground text-background hover:bg-foreground',
        )}
        onClick={() => onSelectLetter()}
        variant="ghost"
      >
        {allBrandsLabel}
      </Button>
      {options.map(({ disabled, label, value }) => (
        <Button
          aria-controls="brand-directory-results"
          aria-pressed={selectedLetter === value}
          className={cn(
            'h-10 min-w-0 px-1 normal-case disabled:opacity-100 disabled:text-muted-foreground sm:min-w-10 sm:px-2',
            (value === '0-9' || value === 'other') && 'col-span-2',
            selectedLetter === value &&
              'bg-foreground text-background hover:bg-foreground',
          )}
          disabled={disabled}
          key={value}
          onClick={() => onSelectLetter(value)}
          variant="ghost"
        >
          {label}
        </Button>
      ))}
    </nav>
  )
}
