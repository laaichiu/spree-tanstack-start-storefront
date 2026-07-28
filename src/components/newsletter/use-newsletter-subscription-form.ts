import { zodResolver } from '@hookform/resolvers/zod'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import { subscribeToNewsletter } from '@/lib/newsletter/api/subscribe-to-newsletter'
import { getBrowserNewsletterVerificationRedirectUrl } from '@/lib/newsletter/newsletter-url'
import type { ResolvedMarket } from '@/lib/market/model/market'
import type { NewsletterSubscriptionInput } from '@/lib/newsletter/validation/newsletter-subscription'
import { newsletterSubscriptionSchema } from '@/lib/newsletter/validation/newsletter-subscription'

type NewsletterSubscriptionMessages = {
  requestFailed: string
  unsupported: string
}

type NewsletterSubscriptionStatus =
  | 'idle'
  | 'submitting'
  | 'accepted'
  | 'unsupported'
  | 'error'

export function useNewsletterSubscriptionForm({
  market,
  messages,
}: {
  market: Pick<ResolvedMarket, 'country' | 'locale'>
  messages: NewsletterSubscriptionMessages
}) {
  const subscribeToNewsletterFn = useServerFn(subscribeToNewsletter)
  const [message, setMessage] = useState<string | null>(null)
  const [requestError, setRequestError] = useState<string | null>(null)
  const [status, setStatus] = useState<NewsletterSubscriptionStatus>('idle')
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
  } = useForm<NewsletterSubscriptionInput>({
    defaultValues: {
      email: '',
    },
    resolver: zodResolver(newsletterSubscriptionSchema),
  })

  function clearRequestError() {
    if (requestError) {
      setRequestError(null)
      setStatus('idle')
    }
  }

  async function submitNewsletter(values: NewsletterSubscriptionInput) {
    setMessage(null)
    setRequestError(null)
    setStatus('submitting')

    try {
      const result = await subscribeToNewsletterFn({
        data: {
          ...values,
          redirectUrl: getBrowserNewsletterVerificationRedirectUrl({
            country: market.country,
            locale: market.locale,
          }),
        },
      })

      if (result.status === 'unsupported') {
        setRequestError(messages.unsupported)
        setStatus('unsupported')
        return
      }

      setMessage(result.message)
      setStatus('accepted')
      reset()
    } catch (error) {
      setRequestError(
        error instanceof Error ? error.message : messages.requestFailed,
      )
      setStatus('error')
    }
  }

  return {
    errors,
    isSubmitting,
    message,
    register,
    requestError,
    clearRequestError,
    status,
    submit: handleSubmit(submitNewsletter),
  }
}
