import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { ProductRelatedProductsView } from './product-related-products-view'

afterEach(cleanup)

describe('ProductRelatedProductsView', () => {
  it('presents the related-products heading and card content', () => {
    render(
      <ProductRelatedProductsView
        cards={
          <>
            <a href="/products/linen-shirt">Linen shirt</a>
            <a href="/products/cotton-trousers">Cotton trousers</a>
          </>
        }
        title="You may also like"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 2, name: 'You may also like' }),
    ).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Linen shirt' })).toHaveProperty(
      'pathname',
      '/products/linen-shirt',
    )
    expect(
      screen.getByRole('link', { name: 'Cotton trousers' }),
    ).toHaveProperty('pathname', '/products/cotton-trousers')
  })
})
