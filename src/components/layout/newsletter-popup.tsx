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
        className="z-140 max-h-[calc(100dvh-2rem)] w-[min(52rem,calc(100vw-2rem))] max-w-none overflow-auto bg-popover p-0 text-popover-foreground shadow-[0_40px_120px_rgb(15_23_42/0.32)] sm:max-h-[calc(100dvh-3rem)] sm:w-[min(52rem,calc(100vw-3rem))] sm:p-0"
        showHeader={false}
        title={t('newsletterPopup.title')}
      >
        <DialogClose
          aria-label={t('newsletterPopup.closeButton')}
          className="absolute top-4 right-4 z-10 focus-visible:ring-0 focus-visible:outline-none"
        >
          <X aria-hidden="true" className="h-5 w-5" />
        </DialogClose>

        <div className="grid md:grid-cols-[0.92fr_1.08fr]">
          <div className="relative h-44 overflow-hidden bg-muted sm:h-52 md:h-auto md:min-h-full">
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              decoding="async"
              loading="eager"
              src="/newsletter-popup-bg.jpg"
            />
          </div>

          <div className="px-5 pt-5 pb-8">
            <h2 className="mt-3 text-2xl font-normal tracking-wider text-foreground uppercase">
              {submitted
                ? t('newsletterPopup.successTitle')
                : t('newsletterPopup.title')}
            </h2>
            <p className="mt-2 max-w-xl text-lg leading-7 text-foreground">
              {submitted
                ? t('newsletterPopup.successBody')
                : t('newsletterPopup.body')}
            </p>

            {submitted ? (
              <div className="mt-6">
                <button
                  className="flex h-12 w-full items-center justify-center bg-foreground px-5 text-sm font-normal tracking-wider text-background uppercase transition hover:bg-foreground/85 focus-visible:focus-ring"
                  onClick={dismissPopup}
                  type="button"
                >
                  {t('newsletterPopup.successDismiss')}
                </button>
              </div>
            ) : (
              <form
                className="mt-2 space-y-2"
                onSubmit={submit}
              >
                <label className="block">
                  <input
                    autoComplete="email"
                    className="mt-2 h-12 w-full border border-input bg-background px-4 text-base text-foreground outline-none transition placeholder:text-muted-foreground focus:border-foreground disabled:cursor-not-allowed disabled:bg-muted"
                    disabled={isSubmitting}
                    placeholder={t('newsletterPopup.emailPlaceholder')}
                    type="email"
                    {...register('email', {
                      onChange: clearRequestError,
                    })}
                  />
                </label>

                <div aria-live="polite" className="min-h-1">
                  {errors.email?.message ? (
                    <p className="text-sm text-destructive">
                      {t('newsletterPopup.invalidEmail')}
                    </p>
                  ) : requestError ? (
                    <p className="text-sm text-destructive">{requestError}</p>
                  ) : null}
                </div>

                <button
                  className="flex h-12 w-full items-center justify-center gap-2 bg-foreground px-5 text-sm font-normal tracking-wider text-background uppercase transition hover:bg-foreground/85 focus-visible:focus-ring disabled:cursor-not-allowed disabled:opacity-60"
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

            <p className="mt-5 max-w-xl text-xs leading-5 text-muted-foreground">
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
              className="mt-6 text-sm text-foreground underline decoration-border underline-offset-4 transition hover:text-muted-foreground focus-visible:focus-ring"
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
