import { useRef } from 'react'
import { Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CloseIcon } from '@/components/ui/close-icon'
import { Input } from '@/components/ui/input'
import type { BrandDirectorySearchChange } from '@/components/contracts/brand'
import type { BrandDirectorySearch } from '@/lib/brands/contracts/brand-directory-search'
import type { MessageKey } from '@/lib/i18n/messages'

type BrandDirectorySearchViewProps = {
  count: number
  onSearchChange: BrandDirectorySearchChange
  search: BrandDirectorySearch
  t: (key: MessageKey) => string
  total: number
}

export function BrandDirectorySearchView({
  count,
  onSearchChange,
  search,
  t,
  total,
}: BrandDirectorySearchViewProps) {
  const searchInput = useRef<HTMLInputElement>(null)
  const hasFilters = Boolean(search.q || search.letter)

  return (
    <div className="min-w-0">
      <Input
        autoComplete="off"
        className="rounded-none border-x-0 border-t-0 bg-transparent pl-11 [&::-webkit-search-cancel-button]:appearance-none"
        label={t('brand.searchBrands')}
        labelClassName="sr-only"
        leadingIcon={<Search aria-hidden="true" className="h-4 w-4" />}
        onValueChange={(value) =>
          onSearchChange({ q: value || undefined }, { replace: true })
        }
        placeholder={t('brand.searchBrands')}
        ref={searchInput}
        spellCheck={false}
        trailingSlot={
          search.q && (
            <Button
              aria-label={t('brand.clearSearch')}
              onClick={() => {
                onSearchChange({ letter: search.letter }, { replace: true })
                searchInput.current?.focus()
              }}
              variant="icon"
            >
              <CloseIcon className="size-2.5" />
            </Button>
          )
        }
        type="search"
        value={search.q ?? ''}
      />
      <p
        aria-atomic="true"
        className="mt-4 text-xs text-muted-foreground"
        role="status"
      >
        {t('brand.resultsCount')
          .replace('{count}', String(count))
          .replace('{total}', String(total))}
      </p>
      {hasFilters && (
        <Button
          className="mt-3 h-auto justify-start p-0 normal-case underline underline-offset-4 hover:bg-transparent"
          onClick={() => onSearchChange({})}
          variant="ghost"
        >
          {t('brand.clearFilters')}
        </Button>
      )}
    </div>
  )
}
