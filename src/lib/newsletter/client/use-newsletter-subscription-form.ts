import { useServerFn } from '@tanstack/react-start'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'

import type { ResolvedMarket } from '@/lib/core/market'

import { subscribeToNewsletter } from '../api/subscribe-to-newsletter'
import type { NewsletterSubscribeResult } from '../api/subscribe-to-newsletter'
import { getBrowserNewsletterVerificationRedirectUrl } from '../newsletter-url'
import { readNewsletterErrorMessage } from '../utils/newsletter-error'
import type { NewsletterSubscriptionInput } from '../validation/newsletter-subscription'

type NewsletterSubscriptionMessages = {
  requestFailed: string
  unsupported: string
}

type NewsletterSubscriptionStatus =
  'idle' | 'submitting' | 'accepted' | 'unsupported' | 'error'

const pendingNewsletterSubscriptions = new Map<
  string,
  Promise<NewsletterSubscribeResult>
>()

function getNewsletterSubscriptionKey({
  email,
  marketKey,
}: {
  email: string
  marketKey: string
}) {
  return JSON.stringify([email.trim().toLowerCase(), marketKey])
}

export function useNewsletterSubscriptionForm({
  market,
  messages,
}: {
  market: Pick<ResolvedMarket, 'country' | 'locale'>
  messages: NewsletterSubscriptionMessages
}) {
  const subscribeToNewsletterFn = useServerFn(subscribeToNewsletter)
  const marketKey = `${market.country}:${market.locale}`
  const currentMarketKeyRef = useRef(marketKey)
  currentMarketKeyRef.current = marketKey
  const isMountedRef = useRef(true)
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
  })

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    setMessage(null)
    setRequestError(null)
    setStatus('idle')
  }, [marketKey])

  function registerEmail(options?: { onChange?: (event: unknown) => void }) {
    return register('email', {
      required: 'Enter a valid email address.',
      validate: (value) =>
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()) ||
        'Enter a valid email address.',
      ...options,
    })
  }

  function clearRequestError() {
    if (requestError) {
      setRequestError(null)
      setStatus('idle')
    }
  }

  async function submitNewsletter(values: NewsletterSubscriptionInput) {
    const submissionMarketKey = marketKey
    setMessage(null)
    setRequestError(null)
    setStatus('submitting')

    const subscriptionKey = getNewsletterSubscriptionKey({
      email: values.email,
      marketKey: submissionMarketKey,
    })
    const pendingSubscription =
      pendingNewsletterSubscriptions.get(subscriptionKey)
    let ownedSubscription: Promise<NewsletterSubscribeResult> | null = null

    try {
      const subscription =
        pendingSubscription ??
        subscribeToNewsletterFn({
          data: {
            ...values,
            redirectUrl: getBrowserNewsletterVerificationRedirectUrl({
              country: market.country,
              locale: market.locale,
            }),
          },
        })
      if (!pendingSubscription) {
        pendingNewsletterSubscriptions.set(subscriptionKey, subscription)
        ownedSubscription = subscription
      }

      const result = await subscription

      if (
        !isMountedRef.current ||
        currentMarketKeyRef.current !== submissionMarketKey
      ) {
        return
      }

      if (result.status === 'unsupported') {
        setRequestError(messages.unsupported)
        setStatus('unsupported')
        return
      }

      setMessage(result.message)
      setStatus('accepted')
      reset()
    } catch (error) {
      if (
        !isMountedRef.current ||
        currentMarketKeyRef.current !== submissionMarketKey
      ) {
        return
      }

      setRequestError(readNewsletterErrorMessage(error, messages.requestFailed))
      setStatus('error')
    } finally {
      if (
        ownedSubscription &&
        pendingNewsletterSubscriptions.get(subscriptionKey) ===
          ownedSubscription
      ) {
        pendingNewsletterSubscriptions.delete(subscriptionKey)
      }
    }
  }

  return {
    errors,
    isSubmitting,
    message,
    register: registerEmail,
    requestError,
    clearRequestError,
    status,
    submit: handleSubmit(submitNewsletter),
  }
}
