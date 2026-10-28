import { Link } from '@tanstack/react-router'

import { DEFAULT_BRAND_SEARCH } from '@/lib/brands/contracts'
import type { selectBrandDirectory } from '@/lib/brands/utils/brand-directory'
import type { MessageKey } from '@/lib/i18n/messages'
import { getBrandDirectoryLetterLabel } from './brand-directory-display'

type BrandDirectoryGroup = ReturnType<
  typeof selectBrandDirectory
>['groups'][number]

type BrandDirectoryResultsViewProps = {
  groups: readonly BrandDirectoryGroup[]
  marketParams: { country: string; locale: string }
  t: (key: MessageKey) => string
}

export function BrandDirectoryResultsView({
  groups,
  marketParams,
  t,
}: BrandDirectoryResultsViewProps) {
  if (groups.length === 0) {
    return (
      <div className="py-8">
        <h2 className="text-lg md:text-xl">{t('brand.noResults')}</h2>
        <p className="mt-3 text-xs leading-6 text-muted-foreground">
          {t('brand.noResultsDescription')}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-10 lg:space-y-12">
      {groups.map((group) => (
        <section
          aria-labelledby={`brand-directory-${group.letter}`}
          key={group.letter}
        >
          <h2
            className="mb-4 text-lg md:text-xl"
            id={`brand-directory-${group.letter}`}
          >
            {getBrandDirectoryLetterLabel(group.letter, t)}
          </h2>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-1 sm:gap-x-10 xl:grid-cols-3">
            {group.brands.map((brand) => (
              <li className="min-w-0" key={brand.id}>
                <Link
                  aria-label={`${t('brand.viewBrand')}: ${brand.name}`}
                  className="inline-flex min-h-11 max-w-full items-center py-2 text-xs leading-5 wrap-anywhere text-foreground underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  params={{ ...marketParams, slug: brand.slug }}
                  search={DEFAULT_BRAND_SEARCH}
                  to="/$country/$locale/$slug"
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
