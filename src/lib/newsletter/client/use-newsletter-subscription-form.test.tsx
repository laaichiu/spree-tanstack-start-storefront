import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { act } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useNewsletterSubscriptionForm } from './use-newsletter-subscription-form'

const server = vi.hoisted(() => ({
  subscribe: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: () => server.subscribe,
}))

vi.mock('../api/subscribe-to-newsletter', () => ({
  subscribeToNewsletter: {},
}))

type Market = { country: string; locale: string }

function SubscriptionHarness({
  market,
  name = 'Newsletter',
}: {
  market: Market
  name?: string
}) {
  const form = useNewsletterSubscriptionForm({
    market,
    messages: {
      requestFailed: 'Unable to subscribe.',
      unsupported: 'Newsletter unavailable.',
    },
  })

  return (
    <form aria-label={name} onSubmit={form.submit}>
      <input aria-label="Email" {...form.register()} />
      <output data-testid="status">{form.status}</output>
      <output data-testid="message">{form.message ?? ''}</output>
      <output data-testid="request-error">{form.requestError ?? ''}</output>
    </form>
  )
}

afterEach(cleanup)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useNewsletterSubscriptionForm', () => {
  it('shares a pending subscription across forms for the same market and email', async () => {
    let resolveSubscription: (result: {
      message: string
      status: 'accepted'
    }) => void = () => undefined
    server.subscribe.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSubscription = resolve
      }),
    )

    render(
      <>
        <SubscriptionHarness
          market={{ country: 'us', locale: 'en' }}
          name="Footer"
        />
        <SubscriptionHarness
          market={{ country: 'us', locale: 'en' }}
          name="Popup"
        />
      </>,
    )

    const inputs = screen.getAllByRole('textbox', { name: 'Email' })
    fireEvent.change(inputs[0], { target: { value: 'Ada@Example.com' } })
    fireEvent.change(inputs[1], { target: { value: 'ada@example.com' } })
    fireEvent.submit(screen.getByRole('form', { name: 'Footer' }))
    fireEvent.submit(screen.getByRole('form', { name: 'Popup' }))

    await waitFor(() => expect(server.subscribe).toHaveBeenCalledOnce())

    await act(async () => {
      resolveSubscription({
        message: 'Check your inbox.',
        status: 'accepted',
      })
      await Promise.resolve()
    })

    expect(screen.getAllByTestId('status')).toHaveLength(2)
    expect(
      screen
        .getAllByTestId('status')
        .every((status) => status.textContent.includes('accepted')),
    ).toBe(true)
  })

  it('ignores a stale response after the market changes', async () => {
    let resolveSubscription: (result: {
      message: string
      status: 'accepted'
    }) => void = () => undefined
    server.subscribe.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveSubscription = resolve
      }),
    )

    const { rerender } = render(
      <SubscriptionHarness market={{ country: 'us', locale: 'en' }} />,
    )

    fireEvent.change(screen.getByRole('textbox', { name: 'Email' }), {
      target: { value: 'ada@example.com' },
    })
    fireEvent.submit(screen.getByRole('form', { name: 'Newsletter' }))

    await waitFor(() => expect(server.subscribe).toHaveBeenCalledOnce())

    rerender(<SubscriptionHarness market={{ country: 'de', locale: 'de' }} />)
    await waitFor(() =>
      expect(screen.getByTestId('status').textContent).toBe('idle'),
    )

    await act(async () => {
      resolveSubscription({
        message: 'Old market accepted.',
        status: 'accepted',
      })
      await Promise.resolve()
    })

    expect(screen.getByTestId('status').textContent).toBe('idle')
    expect(screen.getByTestId('message').textContent).toBe('')
    expect(screen.getByTestId('request-error').textContent).toBe('')
  })
})
