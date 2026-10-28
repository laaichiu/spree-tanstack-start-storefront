import { PageHeadingView } from '@/components/shared/page-heading-view'
import { EmptyStateView } from '@/components/shared/empty-state-view'
import { BrandDirectoryLetterFilterView } from '@/components/brand/brand-directory-letter-filter-view'
import { BrandDirectoryResultsView } from '@/components/brand/brand-directory-results-view'
import { BrandDirectorySearchView } from '@/components/brand/brand-directory-search-view'
import type { BrandDirectorySearchChange } from '@/components/contracts/brand'
import type { BrandDirectoryPageModel } from '@/lib/brands/contracts'
import type { BrandDirectorySearch } from '@/lib/brands/contracts/brand-directory-search'
import { selectBrandDirectory } from '@/lib/brands/utils/brand-directory'
import type { MessageKey } from '@/lib/i18n/messages'
import { getBrandDirectoryLetterOptions } from './brand-directory-display'

type BrandDirectoryPageProps = {
  marketParams: { country: string; locale: string }
  onSearchChange: BrandDirectorySearchChange
  page: BrandDirectoryPageModel
  search: BrandDirectorySearch
  t: (key: MessageKey) => string
}

export function BrandDirectoryPage({
  marketParams,
  onSearchChange,
  page,
  search,
  t,
}: BrandDirectoryPageProps) {
  const heading = (
    <PageHeadingView model={{ title: t('brand.directory') }}>
      {t('brand.directoryDescription')}
    </PageHeadingView>
  )

  if (page.status === 'error') {
    return (
      <>
        {heading}
        <EmptyStateView
          model={{
            description: t('brand.unavailableDescription'),
            title: t('brand.unavailable'),
          }}
        />
      </>
    )
  }

  if (page.brands.length === 0) {
    return (
      <>
        {heading}
        <EmptyStateView
          model={{
            description: t('brand.empty'),
            title: t('brand.directory'),
          }}
        />
      </>
    )
  }

  const directory = selectBrandDirectory({
    brands: page.brands,
    locale: marketParams.locale,
    search,
  })
  const letterOptions = getBrandDirectoryLetterOptions({
    availableLetters: directory.availableLetters,
    selectedLetter: search.letter,
    t,
  })

  return (
    <>
      {heading}
      <section
        aria-label={t('brand.directory')}
        className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8"
      >
        <BrandDirectoryLetterFilterView
          allBrandsLabel={t('brand.allBrands')}
          ariaLabel={t('brand.filterByLetter')}
          onSelectLetter={(letter) => onSearchChange({ ...search, letter })}
          options={letterOptions}
          selectedLetter={search.letter}
        />

        <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
          <BrandDirectorySearchView
            count={directory.count}
            onSearchChange={onSearchChange}
            search={search}
            t={t}
            total={page.brands.length}
          />
          <div className="min-w-0" id="brand-directory-results">
            <BrandDirectoryResultsView
              groups={directory.groups}
              marketParams={marketParams}
              t={t}
            />
          </div>
        </div>
      </section>
    </>
  )
}
