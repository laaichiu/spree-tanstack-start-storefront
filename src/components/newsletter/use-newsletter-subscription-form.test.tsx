import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MarketProvider } from '@/components/layout/market-provider'
import { getDefaultResolvedMarket } from '@/lib/market/utils/market'

import { useNewsletterSubscriptionForm } from './use-newsletter-subscription-form'

const subscribeToNewsletterFn = vi.hoisted(() => vi.fn())

vi.mock('@tanstack/react-start', async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>()

  return {
    ...actual,
    useServerFn: () => subscribeToNewsletterFn,
  }
})

afterEach(() => {
  cleanup()
  subscribeToNewsletterFn.mockReset()
})

function Wrapper({ children }: { children: ReactNode }) {
  return (
    <MarketProvider market={getDefaultResolvedMarket()} marketOptions={[]}>
      {children}
    </MarketProvider>
  )
}

function NewsletterForm() {
  const form = useNewsletterSubscriptionForm({
    market: getDefaultResolvedMarket(),
    messages: {
      requestFailed: 'Request failed.',
      unsupported: 'Newsletter is unavailable.',
    },
  })

  return (
    <form aria-label="newsletter" onSubmit={form.submit}>
      <input
        aria-label="Email"
        {...form.register('email', { onChange: form.clearRequestError })}
      />
      <button type="submit">Submit</button>
      <output data-testid="status">{form.status}</output>
      <output data-testid="message">{form.message}</output>
      <output data-testid="error">{form.requestError}</output>
    </form>
  )
}

function renderNewsletterForm() {
  return render(<NewsletterForm />, { wrapper: Wrapper })
}

describe('useNewsletterSubscriptionForm', () => {
  it('submits the normalized email and exposes the accepted message', async () => {
    subscribeToNewsletterFn.mockResolvedValueOnce({
      message: 'Check your inbox.',
      status: 'accepted',
    })
    renderNewsletterForm()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: '  person@example.com ' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'newsletter' }))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('accepted')
    })

    expect(subscribeToNewsletterFn).toHaveBeenCalledWith({
      data: {
        email: 'person@example.com',
        redirectUrl: 'http://localhost:3000/us/en/newsletter/verify',
      },
    })
    expect(screen.getByTestId('message').textContent).toBe('Check your inbox.')
  })

  it('turns an unsupported endpoint into a recoverable feature error', async () => {
    subscribeToNewsletterFn.mockResolvedValueOnce({ status: 'unsupported' })
    renderNewsletterForm()

    fireEvent.change(screen.getByLabelText('Email'), {
      target: { value: 'person@example.com' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'newsletter' }))

    await waitFor(() => {
      expect(screen.getByTestId('status').textContent).toBe('unsupported')
    })

    expect(screen.getByTestId('error').textContent).toBe(
      'Newsletter is unavailable.',
    )
  })

  it('clears a request error when the customer edits the email', async () => {
    subscribeToNewsletterFn.mockResolvedValueOnce({ status: 'unsupported' })
    renderNewsletterForm()

    const email = screen.getByLabelText('Email')
    fireEvent.change(email, { target: { value: 'person@example.com' } })
    fireEvent.submit(screen.getByRole('form', { name: 'newsletter' }))

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe(
        'Newsletter is unavailable.',
      )
    })

    fireEvent.change(email, { target: { value: 'another@example.com' } })

    expect(screen.getByTestId('error').textContent).toBe('')
    expect(screen.getByTestId('status').textContent).toBe('idle')
  })
})
