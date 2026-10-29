import { Check, ChevronLeft, ChevronRight } from 'lucide-react'

import { CloseIcon } from '@/components/ui/close-icon'

import { DialogClose, DialogContent, DialogRoot } from '@/components/ui/dialog'

import type {
  ReviewMediaLightboxActions,
  ReviewMediaLightboxModel,
} from '../contracts/reviews'
import { ReviewStarsView } from './review-stars-view'
import { useReviewMediaLightbox } from './use-review-media-lightbox'

export type {
  ReviewMediaLightboxActions,
  ReviewMediaLightboxModel,
} from '../contracts/reviews'

export function ReviewMediaLightboxView({
  actions,
  model,
}: {
  actions: ReviewMediaLightboxActions
  model: ReviewMediaLightboxModel
}) {
  const { items, labels, selectedId } = model
  const { isOpen, selectNext, selectPrevious, selectedIndex, selectedItem } =
    useReviewMediaLightbox({
      items,
      onSelectId: actions.selectId,
      selectedId,
    })
  const purchasedOptions =
    selectedItem?.review.purchasedOptionValues.join(' / ') ?? ''

  return (
    <DialogRoot
      modal="trap-focus"
      onOpenChange={(open) => {
        if (!open) {
          actions.close()
        }
      }}
      open={isOpen}
    >
      {selectedItem ? (
        <DialogContent
          backdropClassName="hidden"
          className="inset-0 flex h-dvh max-h-none w-screen max-w-none translate-x-0 translate-y-0 flex-col overflow-hidden bg-background p-0 text-foreground shadow-none sm:p-0"
          closeLabel={labels.closePhotoGallery}
          showHeader={false}
          title={labels.photoGallery}
        >
          <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
            <p className="text-xs text-muted-foreground">
              {selectedIndex + 1} / {items.length}
            </p>
            <DialogClose aria-label={labels.closePhotoGallery}>
              <CloseIcon />
            </DialogClose>
          </header>

          <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:grid lg:grid-cols-[minmax(0,1fr)_24rem] lg:overflow-hidden max-lg:landscape:grid max-lg:landscape:grid-cols-[minmax(0,1fr)_minmax(8.75rem,38vw)] max-lg:landscape:overflow-hidden sm:max-lg:landscape:grid-cols-[minmax(0,1fr)_minmax(16rem,36vw)]">
            <div className="relative flex min-h-0 shrink-0 flex-col bg-muted">
              <div className="relative flex min-h-0 shrink-0 items-center justify-center overflow-hidden p-3 sm:p-6 lg:h-auto lg:flex-1 max-lg:landscape:h-auto max-lg:landscape:flex-1 max-lg:landscape:px-[clamp(4rem,8vw,5.5rem)] max-lg:landscape:py-3">
                {items.length > 1 ? (
                  <>
                    <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-3 sm:pl-5">
                      <button
                        aria-label={labels.previousPhoto}
                        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={selectPrevious}
                        type="button"
                      >
                        <ChevronLeft aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-10 flex items-center pr-3 sm:pr-5">
                      <button
                        aria-label={labels.nextPhoto}
                        className="pointer-events-auto inline-flex h-11 w-11 items-center justify-center bg-background/95 text-foreground shadow-sm transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                        onClick={selectNext}
                        type="button"
                      >
                        <ChevronRight aria-hidden="true" className="h-5 w-5" />
                      </button>
                    </div>
                  </>
                ) : null}

                <img
                  alt={selectedItem.media.alt ?? labels.customerPhoto}
                  className="h-auto max-h-[min(clamp(14rem,56dvh,32rem),calc(100dvh-11rem))] max-w-full object-contain lg:max-h-full max-lg:landscape:max-h-full"
                  src={selectedItem.media.url}
                />
              </div>

              {items.length > 1 ? (
                <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-border bg-background p-3 [scrollbar-width:none] max-lg:landscape:p-2 [&::-webkit-scrollbar]:hidden">
                  {items.map((item, index) => (
                    <button
                      aria-current={
                        index === selectedIndex ? 'true' : undefined
                      }
                      aria-label={`${labels.openPhoto} ${index + 1}`}
                      className={`h-16 w-16 shrink-0 overflow-hidden border bg-muted transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 max-lg:landscape:h-14 max-lg:landscape:w-14 ${
                        index === selectedIndex
                          ? 'border-foreground'
                          : 'border-border hover:border-muted-foreground'
                      }`}
                      key={item.id}
                      onClick={() => actions.selectId(item.id)}
                      type="button"
                    >
                      <img
                        alt={item.media.alt ?? labels.customerPhoto}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        src={item.media.url}
                      />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            <aside className="min-h-0 overflow-y-auto border-t border-border p-5 lg:border-t-0 lg:border-l lg:p-6 max-lg:landscape:border-t-0 max-lg:landscape:border-l max-lg:landscape:p-4">
              <div className="space-y-5">
                <div className="space-y-2 text-xs">
                  <p className="text-sm font-normal text-foreground uppercase">
                    {selectedItem.review.reviewerName ?? labels.anonymous}
                  </p>
                  {selectedItem.review.verifiedPurchase ? (
                    <p className="inline-flex items-center gap-2 text-foreground">
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-background">
                        <Check
                          aria-hidden="true"
                          className="h-3.5 w-3.5 stroke-[3]"
                        />
                      </span>
                      {labels.verifiedBuyer}
                    </p>
                  ) : null}
                  {selectedItem.review.verifiedPurchase && purchasedOptions ? (
                    <p className="leading-5 text-muted-foreground">
                      <span className="font-semibold text-foreground">
                        {labels.purchasedOptions}:
                      </span>{' '}
                      {purchasedOptions}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-3">
                  <ReviewStarsView
                    className="text-base leading-none"
                    label={`${selectedItem.review.rating} / 5`}
                    rating={selectedItem.review.rating}
                  />
                  {selectedItem.review.title ? (
                    <h3 className="text-xs font-normal text-foreground">
                      {selectedItem.review.title}
                    </h3>
                  ) : null}
                  {selectedItem.review.body ? (
                    <p className="text-xs leading-6 text-foreground">
                      {selectedItem.review.body}
                    </p>
                  ) : null}
                </div>

                {selectedItem.review.createdAtLabel ? (
                  <time
                    className="block text-xs text-muted-foreground"
                    dateTime={selectedItem.review.createdAt}
                  >
                    {selectedItem.review.createdAtLabel}
                  </time>
                ) : null}
              </div>
            </aside>
          </div>
        </DialogContent>
      ) : null}
    </DialogRoot>
  )
}
