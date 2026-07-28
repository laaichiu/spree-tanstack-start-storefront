import { Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetCloseButton,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { useMarket } from '@/components/layout/market-provider'
import type {
  ProductReviewFilter,
  ProductReviewQuery,
} from '@/lib/reviews/model/product-review'

import {
  getReviewFilterValue,
  getVisibleReviewFilterValues,
  selectedReviewFilterCount,
} from './review-filter-query'

function ReviewFilterOption({
  label,
  onClick,
  selected,
}: {
  label: string
  onClick: () => void
  selected: boolean
}) {
  return (
    <button
      aria-pressed={selected}
      className="flex w-full items-center gap-3 text-left text-sm text-foreground transition-colors hover:text-muted-foreground focus-visible:focus-ring"
      onClick={onClick}
      type="button"
    >
      <span
        aria-hidden="true"
        className={`flex h-4 w-4 items-center justify-center border transition-colors ${
          selected
            ? 'border-foreground bg-foreground text-background'
            : 'border-border bg-background text-transparent'
        }`}
      >
        <Check className="h-3 w-3 stroke-[3]" />
      </span>
      <span className="flex-1">{label}</span>
    </button>
  )
}

export function ProductReviewFilterSheet({
  disabled,
  draftQuery,
  filters,
  onApply,
  onClear,
  onDraftFilterChange,
  onOpenChange,
  open,
}: {
  disabled: boolean
  draftQuery: ProductReviewQuery
  filters: ProductReviewFilter[]
  onApply: () => void
  onClear: () => void
  onDraftFilterChange: (filterId: string, value: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
}) {
  const { t } = useMarket()
  const selectedCount = selectedReviewFilterCount(draftQuery)

  return (
    <Sheet onOpenChange={onOpenChange} open={open}>
      <SheetContent className="border-r border-border" side="left">
        <SheetHeader className="grid grid-cols-[minmax(0,1fr)_auto_auto] border-b border-border px-4 py-4">
          <SheetTitle>{t('reviews.filterReviews')}</SheetTitle>
          <p className="text-sm leading-none tracking-wider text-muted-foreground uppercase">
            {selectedCount ? `(${selectedCount})` : t('reviews.allReviews')}
          </p>
          <SheetCloseButton
            aria-label={t('reviews.closeFilters')}
            className="-mr-1 flex h-8 w-8 items-center justify-center"
          />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          {filters.map((filter) => {
            const values = getVisibleReviewFilterValues(filter)
            const selectedValue = getReviewFilterValue(draftQuery, filter.id)

            return (
              <section className="border-b border-border py-5" key={filter.id}>
                <h3 className="mb-4 text-sm tracking-wider text-muted-foreground uppercase">
                  {filter.label}
                </h3>
                <div className="space-y-3">
                  <ReviewFilterOption
                    label={t('reviews.allReviews')}
                    onClick={() => onDraftFilterChange(filter.id, '')}
                    selected={!selectedValue}
                  />
                  {values.map((value) => (
                    <ReviewFilterOption
                      key={value.value}
                      label={value.label}
                      onClick={() =>
                        onDraftFilterChange(filter.id, value.value)
                      }
                      selected={selectedValue === value.value}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border p-4">
          <Button
            disabled={disabled || selectedCount === 0}
            onClick={onClear}
            size="lg"
            variant="secondary"
          >
            {t('reviews.clearFilters')}
          </Button>
          <Button disabled={disabled} onClick={onApply} size="lg">
            {t('reviews.applyFilters')}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
