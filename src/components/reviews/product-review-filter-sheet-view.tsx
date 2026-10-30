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
import type {
  ProductReviewFilterSheetActions,
  ProductReviewFilterSheetModel,
} from '../contracts/reviews'

export type {
  ProductReviewFilterSheetActions,
  ProductReviewFilterSheetModel,
} from '../contracts/reviews'

export function ProductReviewFilterSheetView({
  actions,
  model,
}: {
  actions: ProductReviewFilterSheetActions
  model: ProductReviewFilterSheetModel
}) {
  const { clearDisabled, disabled, labels, open, sections } = model
  return (
    <Sheet onOpenChange={actions.openChange} open={open} swipeDirection="left">
      <SheetContent className="border-r border-border" disableSwipe side="left">
        <SheetHeader className="grid min-h-16 grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b border-border px-5 py-4">
          <SheetTitle>{labels.filterReviews}</SheetTitle>
          <SheetCloseButton aria-label={labels.closeFilters} />
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5">
          {sections.map((section) => (
            <section className="border-b border-border py-5" key={section.id}>
              <h3 className="mb-4 text-xs tracking-wider text-muted-foreground uppercase">
                {section.label}
              </h3>
              <div className="space-y-3">
                {section.options.map((option) => {
                  const selected = section.selectedValue === option.value

                  return (
                    <button
                      aria-pressed={selected}
                      className="flex w-full items-center gap-3 text-left text-sm leading-5 text-foreground transition-colors hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                      disabled={disabled}
                      key={option.value || `${section.id}-all`}
                      onClick={() =>
                        actions.draftFilterChange(section.id, option.value)
                      }
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
                      <span className="flex-1">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </section>
          ))}
        </div>

        <SheetFooter className="grid grid-cols-2 gap-2 border-t border-border p-4">
          <Button
            disabled={disabled || clearDisabled}
            onClick={actions.clear}
            size="lg"
            className="tracking-wider"
            variant="secondary"
          >
            {labels.clearFilters}
          </Button>
          <Button
            className="tracking-wider"
            disabled={disabled}
            onClick={actions.apply}
            size="lg"
          >
            {labels.applyFilters}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
