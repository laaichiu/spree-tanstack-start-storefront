import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { createSheetHandle } from '@/components/ui/sheet'
import { HeaderSheetTriggerView } from './header-sheet-trigger-view'

afterEach(cleanup)

describe('HeaderSheetTriggerView', () => {
  it('preloads the drawer from focus, hover and pointer intent', () => {
    const onPreload = vi.fn()

    render(
      <HeaderSheetTriggerView
        ariaLabel="Open cart"
        onPreload={onPreload}
        triggerProps={{ handle: createSheetHandle(), id: 'cart-trigger' }}
      >
        Bag
      </HeaderSheetTriggerView>,
    )

    const trigger = screen.getByRole('button', { name: 'Open cart' })

    fireEvent.focus(trigger)
    fireEvent.mouseEnter(trigger)
    fireEvent.pointerDown(trigger)

    expect(trigger.id).toBe('cart-trigger')
    expect(onPreload).toHaveBeenCalledTimes(3)
  })
})
