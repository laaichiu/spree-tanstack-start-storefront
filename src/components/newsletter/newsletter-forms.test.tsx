import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { NewsletterPopupForm } from './newsletter-popup-form'
import { NewsletterSignupForm } from './newsletter-signup-form'

afterEach(cleanup)

describe('newsletter forms', () => {
  it('delegates footer newsletter submission directly', () => {
    const onSubmit = vi.fn()

    render(
      <NewsletterSignupForm
        emailInputProps={{}}
        model={{
          emailLabel: 'Email address',
          emailPlaceholder: 'Email address',
          feedback: { text: 'Stay in the loop.', tone: 'hint' },
          isSubmitting: false,
          submitLabel: 'Subscribe',
        }}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.submit(screen.getByRole('button', { name: 'Subscribe' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })

  it('delegates popup newsletter submission directly', () => {
    const onSubmit = vi.fn()

    render(
      <NewsletterPopupForm
        emailInputProps={{}}
        model={{
          emailLabel: 'Email address',
          emailPlaceholder: 'Email address',
          errorMessage: null,
          isSubmitting: false,
          submitLabel: 'Subscribe',
          submittingLabel: 'Submitting',
        }}
        onSubmit={onSubmit}
      />,
    )

    fireEvent.submit(screen.getByRole('button', { name: 'Subscribe' }))

    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
