import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { HeaderBrandView } from './header-brand-view'

afterEach(cleanup)

describe('HeaderBrandView', () => {
  it('presents a brand logo with a text fallback', () => {
    const { rerender } = render(
      <HeaderBrandView logoUrl="/brand.svg" name="Spree" />,
    )

    const logo = screen.getByRole('img', { name: 'Spree' })

    expect(logo.getAttribute('src')).toBe('/brand.svg')
    expect(logo).toHaveProperty('width', 189)
    expect(logo).toHaveProperty('height', 76)

    rerender(<HeaderBrandView logoUrl={null} name="Spree" />)

    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Spree')).toBeTruthy()
  })
})
