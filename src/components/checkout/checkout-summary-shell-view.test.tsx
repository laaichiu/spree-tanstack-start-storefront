import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutSummaryShellView } from './checkout-summary-shell-view'

afterEach(cleanup)

describe('CheckoutSummaryShellView', () => {
  it('forwards the mobile summary toggle and renders summary content', () => {
    const onMobileToggle = vi.fn()

    render(
      <CheckoutSummaryShellView
        model={{
          isMobileOpen: false,
          label: 'Order summary',
          total: '$25.00',
        }}
        onMobileToggle={onMobileToggle}
        content={<div>Summary content</div>}
      />,
    )

    const toggle = screen.getByRole('button', { name: /Order summary/ })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    expect(screen.getByText('Summary content')).toBeTruthy()

    fireEvent.click(toggle)
    expect(onMobileToggle).toHaveBeenCalledOnce()
  })
})
