import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Sheet } from '@/components/ui/sheet'
import { CartDrawerHeaderView } from './cart-drawer-header-view'

afterEach(cleanup)

describe('CartDrawerHeaderView', () => {
  it('delegates close directly to its callback', () => {
    const onClose = vi.fn()

    render(
      <Sheet open>
        <CartDrawerHeaderView
          model={{
            itemCountLabel: '1 item',
            labels: {
              closeCart: 'Close cart',
              yourBag: 'Your bag',
            },
          }}
          onClose={onClose}
        />
      </Sheet>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Close cart' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
