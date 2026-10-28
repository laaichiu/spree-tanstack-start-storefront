import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CartDisplayOptionsView } from './cart-display-options-view'

afterEach(cleanup)

describe('CartDisplayOptionsView', () => {
  it('uses a neutral swatch when Spree omits color presentation', () => {
    render(
      <CartDisplayOptionsView
        className="options"
        model={{
          options: [
            {
              id: 'rose-gold',
              isColor: true,
              label: 'Rose Gold',
            },
          ],
        }}
        optionClassName="option"
      />,
    )

    const option = screen.getByText('Rose Gold').parentElement
    const swatch = option?.querySelector<HTMLElement>(
      'span[aria-hidden="true"]',
    )

    expect(swatch?.className).toContain('bg-muted')
  })
})
