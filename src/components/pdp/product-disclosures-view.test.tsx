import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { ProductDisclosuresView } from './product-disclosures-view'

afterEach(cleanup)

const model = {
  activeSku: 'SKU-001',
  copy: {
    description: 'Description',
    details: 'Details',
    itemNumberLabel: 'Item number: {sku}',
    noAdditionalProperties: 'No additional properties',
    productUnavailableDescription: 'Product unavailable',
  },
  description: 'A lightweight cotton shirt.',
  descriptionHtml: '',
  specifications: [{ label: 'Material', value: 'Cotton' }],
}

describe('ProductDisclosuresView', () => {
  it('delegates disclosure toggles with their section identity', () => {
    const onToggle = vi.fn()
    render(
      <ProductDisclosuresView
        expandedSection={null}
        model={model}
        onToggle={onToggle}
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Description' }))
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))

    expect(onToggle).toHaveBeenNthCalledWith(1, 'description')
    expect(onToggle).toHaveBeenNthCalledWith(2, 'details')
  })

  it('exposes the expanded section content and accessible state', () => {
    render(
      <ProductDisclosuresView
        expandedSection="details"
        model={model}
        onToggle={vi.fn()}
      />,
    )

    const details = screen.getByRole('button', { name: 'Details' })
    expect(details.getAttribute('aria-expanded')).toBe('true')
    expect(screen.getByText('Material')).toBeTruthy()
    expect(screen.getByText('Cotton')).toBeTruthy()
    expect(
      screen
        .getByRole('button', { name: 'Description' })
        .getAttribute('aria-expanded'),
    ).toBe('false')
  })
})
