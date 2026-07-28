import { useRouterState } from '@tanstack/react-router'
import { ArrowRight, X } from 'lucide-react'
import { useEffect, useState } from 'react'

import { DialogClose, DialogContent, DialogRoot } from '@/components/ui/dialog'
import { useMarket } from '@/components/layout/market-provider'
import {
  isNewsletterPopupDismissed,
  markNewsletterPopupDismissed,
} from '@/components/layout/newsletter-popup-dismissal'
import { useNewsletterSubscriptionForm } from '@/components/newsletter/use-newsletter-subscription-form'
import { isNewsletterPopupRouteExcluded } from '@/components/layout/newsletter-popup-eligibility'
import type { ProductSummary } from '@/lib/catalog/model/product'

function ProductTile({
  product,
  storeName,
}: {
  product?: ProductSummary
  storeName: string
}) {
  if (product?.image) {
    return (
      <img
        alt={product.image.alt || product.name}
        className="h-full w-full object-cover"
        src={product.image.src}
      />
    )
  }

  return (
    <div className="flex h-full w-full items-center justify-center bg-muted px-6 text-center text-sm tracking-wider text-muted-foreground uppercase">
      {storeName}
    </div>
  )
}

export function NewsletterPopup() {
  const { market, t } = useMarket()
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const [open, setOpen] = useState(false)
  const {
    errors,
    isSubmitting,
    requestError,
    clearRequestError,
    register,
    status,
    submit,
  } = useNewsletterSubscriptionForm({
    market,
    messages: {
      requestFailed: t('newsletterPopup.requestFailed'),
      unsupported: t('newsletterPopup.unsupported'),
    },
  })
  const submitted = status === 'accepted'

  useEffect(() => {
    if (
      isNewsletterPopupRouteExcluded(pathname) ||
      isNewsletterPopupDismissed()
    ) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      if (!isNewsletterPopupDismissed()) {
        setOpen(true)
      }
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [pathname])

  useEffect(() => {
    if (submitted) {
      markNewsletterPopupDismissed()
    }
  }, [submitted])

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      markNewsletterPopupDismissed()
    }

    setOpen(nextOpen)
  }

  function dismissPopup() {
    markNewsletterPopupDismissed()
    setOpen(false)
  }

  return (
    <DialogRoot onOpenChange={handleOpenChange} open={open}>
      <DialogContent
        backdropClassName="z-[130] bg-black/40"
        className="z-[140] max-h-[calc(100dvh-1.5rem)] w-[min(64rem,calc(100vw-1.5rem))] max-w-none overflow-auto bg-popover p-0 text-popover-foreground shadow-[0_40px_120px_rgb(15_23_42_/_0.32)] sm:max-h-[calc(100dvh-3rem)] sm:p-0"
        showHeader={false}
        title={t('newsletterPopup.title')}
      >
        <DialogClose
          aria-label={t('newsletterPopup.closeButton')}
          className="absolute top-4 right-4 z-10"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </DialogClose>

        <div className="grid lg:grid-cols-[0.92fr_1.08fr]">
          <div className="grid h-56 grid-cols-2 grid-rows-2 bg-muted lg:h-auto">
            {Array.from({ length: 4 }).map((_, index) => (
              <ProductTile
                // biome-ignore lint/suspicious/noArrayIndexKey: static visual collage slots
                key={`newsletter-product-${index}`}
                storeName={t('newsletterPopup.featuredFallback')}
              />
            ))}
          </div>

          <div className="px-5 pt-12 pb-6 sm:px-8 sm:pt-14 sm:pb-8 lg:px-10 lg:pt-16 lg:pb-10">
            <p className="text-sm tracking-wider text-muted-foreground uppercase">
              {t('newsletterPopup.eyebrow')}
            </p>
            <h2 className="mt-4 text-4xl leading-[0.98] font-normal tracking-wider text-foreground uppercase sm:text-5xl">
              {submitted
                ? t('newsletterPopup.successTitle')
                : t('newsletterPopup.title')}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-foreground">
              {submitted
                ? t('newsletterPopup.successBody')
                : t('newsletterPopup.body')}
            </p>

            {submitted ? (
              <div className="mt-8">
                <button
                  className="flex h-14 w-full items-center justify-center bg-foreground px-5 text-sm font-normal tracking-wider text-background uppercase transition hover:bg-foreground/85 focus-visible:focus-ring"
                  onClick={dismissPopup}
                  type="button"
                >
                  {t('newsletterPopup.successDismiss')}
                </button>
              </div>
            ) : (
              <form className="mt-8 space-y-4" onSubmit={submit}>
                <label className="block">
                  <span className="text-sm font-normal text-foreground">
                    {t('newsletterPopup.emailLabel')}
                  </span>
                  <input
                    autoComplete="email"
                    className="mt-3 h-14 w-full border border-input bg-background px-5 text-lg text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted"
                    disabled={isSubmitting}
                    placeholder={t('newsletterPopup.emailPlaceholder')}
                    type="email"
                    {...register('email', {
                      onChange: clearRequestError,
                    })}
                  />
                </label>

                <div aria-live="polite" className="min-h-5">
                  {errors.email?.message ? (
                    <p className="text-sm text-destructive">
                      {t('newsletterPopup.invalidEmail')}
                    </p>
                  ) : requestError ? (
                    <p className="text-sm text-destructive">{requestError}</p>
                  ) : null}
                </div>

                <button
                  className="flex h-14 w-full items-center justify-center gap-2 bg-foreground px-5 text-sm font-normal tracking-wider text-background uppercase transition hover:bg-foreground/85 focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting
                    ? t('newsletterPopup.submitting')
                    : t('newsletterPopup.submit')}
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </button>
              </form>
            )}

            <p className="mt-6 max-w-xl text-sm leading-6 text-muted-foreground">
              {t('newsletterPopup.consentPrefix')}{' '}
              <span className="underline decoration-border underline-offset-4">
                {t('footer.privacyPolicy')}
              </span>{' '}
              {t('newsletterPopup.consentAnd')}{' '}
              <span className="underline decoration-border underline-offset-4">
                {t('footer.termsOfService')}
              </span>
              .
            </p>

            <button
              className="mt-8 text-sm text-foreground underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:focus-ring"
              onClick={dismissPopup}
              type="button"
            >
              {t('newsletterPopup.dismiss')}
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
