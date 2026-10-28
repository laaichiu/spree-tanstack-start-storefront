import { CloseIcon } from '@/components/ui/close-icon'
import { DialogClose, DialogContent, DialogRoot } from '@/components/ui/dialog'
import type { NewsletterPopupProps } from './newsletter-popup-types'

export type {
  NewsletterPopupActions,
  NewsletterPopupModel,
  NewsletterPopupProps,
  NewsletterPopupSlots,
} from './newsletter-popup-types'

export function NewsletterPopup({
  actions,
  model,
  slots,
}: NewsletterPopupProps) {
  const { dismiss, openChange } = actions
  const {
    body,
    closeLabel,
    dismissLabel,
    open,
    successBody,
    successDismissLabel,
    successTitle,
    submitted,
    title,
  } = model
  return (
    <DialogRoot onOpenChange={openChange} open={open}>
      <DialogContent
        backdropClassName="z-[130] bg-black/40"
        className="z-140 max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100vw-2rem))] max-w-none overflow-auto bg-popover p-0 text-popover-foreground shadow-[0_40px_120px_rgb(15_23_42/0.32)] sm:max-h-[calc(100dvh-3rem)] sm:w-[min(52rem,calc(100vw-3rem))] sm:p-0"
        showHeader={false}
        title={title}
      >
        <DialogClose
          aria-label={closeLabel}
          className="absolute top-4 right-4 z-10"
        >
          <CloseIcon />
        </DialogClose>

        <div className="grid md:grid-cols-[0.92fr_1.08fr] max-lg:landscape:grid-cols-1">
          <div className="relative h-44 overflow-hidden bg-muted sm:h-52 md:h-auto md:min-h-full max-lg:landscape:hidden">
            {open && (
              <img
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
                decoding="async"
                fetchPriority="low"
                height={801}
                loading="lazy"
                sizes="(min-width: 768px) 25rem, calc(100vw - 2rem)"
                src="/newsletter-popup-bg-800.webp"
                srcSet="/newsletter-popup-bg-800.webp 800w, /newsletter-popup-bg-1200.webp 1200w"
                width={1200}
              />
            )}
          </div>

          <div className="px-5 pt-5 pb-8">
            <h2 className="text-2xl font-normal tracking-wider text-foreground uppercase">
              {submitted ? successTitle : title}
            </h2>
            <p className="mt-2 max-w-xl text-xs leading-7 text-foreground">
              {submitted ? successBody : body}
            </p>

            {submitted ? (
              <div className="mt-6">
                <button
                  className="flex h-12 w-full items-center justify-center bg-foreground px-5 text-xs font-normal tracking-wider text-background uppercase transition hover:bg-foreground/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  onClick={dismiss}
                  type="button"
                >
                  {successDismissLabel}
                </button>
              </div>
            ) : (
              slots.form
            )}

            {slots.consent}

            <button
              className="mt-6 text-xs text-foreground underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              onClick={dismiss}
              type="button"
            >
              {dismissLabel}
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
