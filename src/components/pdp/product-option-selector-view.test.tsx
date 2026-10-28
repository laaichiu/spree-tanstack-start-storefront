import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ProductOptionSelection } from './product-option-selector-model'
import { ProductOptionSelectorView } from './product-option-selector-view'

afterEach(cleanup)

const options = [
  {
    id: 'color',
    isColor: true,
    label: 'Color',
    selectedLabel: 'Pink',
    values: [
      {
        colorCode: '#f46565',
        id: 'pink',
        imageUrl: null,
        isSelectable: true,
        isSelected: true,
        label: 'Pink',
      },
      {
        colorCode: null,
        id: 'black',
        imageUrl: null,
        isSelectable: false,
        isSelected: false,
        label: 'Black',
      },
    ],
  },
] satisfies readonly ProductOptionSelection[]

describe('ProductOptionSelectorView', () => {
  it('forwards selectable values and exposes the active option', () => {
    const selectOption = vi.fn()
    render(
      <ProductOptionSelectorView
        model={{ options }}
        onSelectOption={selectOption}
      />,
    )

    const selected = screen.getByRole('button', { name: 'Pink' })
    expect(selected.getAttribute('aria-pressed')).toBe('true')

    fireEvent.click(selected)
    expect(selectOption).toHaveBeenCalledWith('color', 'pink')
  })

  it('disables unavailable combinations without forwarding selection', () => {
    const selectOption = vi.fn()
    render(
      <ProductOptionSelectorView
        model={{ options }}
        onSelectOption={selectOption}
      />,
    )

    const unavailable = screen.getByRole('button', { name: 'Black' })
    const swatch = unavailable.querySelector<HTMLElement>(
      'span[aria-hidden="true"]',
    )
    expect(unavailable).toHaveProperty('disabled', true)
    expect(swatch?.className).toContain('bg-muted')
    expect(swatch?.className).not.toContain('bg-foreground')
    fireEvent.click(unavailable)
    expect(selectOption).not.toHaveBeenCalled()
  })

  it('omits the selector when the product has no options', () => {
    const { container } = render(
      <ProductOptionSelectorView
        model={{ options: [] }}
        onSelectOption={vi.fn()}
      />,
    )

    expect(container.firstChild).toBeNull()
  })
})
