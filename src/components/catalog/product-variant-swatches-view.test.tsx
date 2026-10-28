import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductVariantSwatchesView } from './product-variant-swatches-view'

afterEach(cleanup)

describe('ProductVariantSwatchesView', () => {
  it('uses Spree color data and a neutral fallback for missing presentation', () => {
    const onVariantChange = vi.fn()
    render(
      <ProductVariantSwatchesView
        activeVariantId="variant-black"
        colorVariants={[
          {
            optionValue: {
              colorCode: '#111111',
              id: 'black',
              imageUrl: null,
              label: 'Black',
            },
            variant: { id: 'variant-black' },
          },
          {
            optionValue: {
              colorCode: null,
              id: 'rose-gold',
              imageUrl: null,
              label: 'Rose Gold',
            },
            variant: { id: 'variant-rose-gold' },
          },
        ]}
        onVariantChange={onVariantChange}
      />,
    )

    const providedSwatch = screen
      .getByRole('button', { name: 'Black' })
      .querySelector<HTMLElement>('span[aria-hidden="true"]')
    const missingSwatch = screen
      .getByRole('button', { name: 'Rose Gold' })
      .querySelector<HTMLElement>('span[aria-hidden="true"]')

    expect(providedSwatch?.style.backgroundColor).toBe('rgb(17, 17, 17)')
    expect(missingSwatch?.className).toContain('bg-muted')

    fireEvent.click(screen.getByRole('button', { name: 'Rose Gold' }))
    expect(onVariantChange).toHaveBeenCalledWith('variant-rose-gold')
  })

  it('does not render an empty swatch row when a product has no colors', () => {
    const { container } = render(
      <ProductVariantSwatchesView
        activeVariantId={null}
        colorVariants={[]}
        onVariantChange={() => undefined}
      />,
    )

    expect(container.firstElementChild).toBeNull()
  })
})
