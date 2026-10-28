import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutSubmitButtonView } from './checkout-submit-button-view'

afterEach(cleanup)

describe('CheckoutSubmitButtonView', () => {
  it('forwards an enabled checkout submission', () => {
    const submit = vi.fn()
    render(
      <CheckoutSubmitButtonView
        disabled={false}
        label="Pay now"
        onSubmit={submit}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Pay now' }))
    expect(submit).toHaveBeenCalledOnce()
  })

  it('blocks checkout submission while disabled', () => {
    const submit = vi.fn()
    render(
      <CheckoutSubmitButtonView
        disabled
        label="Processing payment…"
        onSubmit={submit}
      />,
    )

    const button = screen.getByRole('button', {
      name: 'Processing payment…',
    })
    expect(button).toHaveProperty('disabled', true)
    fireEvent.click(button)
    expect(submit).not.toHaveBeenCalled()
  })
})
