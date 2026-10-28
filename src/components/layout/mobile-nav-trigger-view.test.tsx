import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MobileNavDrawerRootView } from './mobile-nav-drawer-view'
import { MobileNavTriggerView } from './mobile-nav-trigger-view'

afterEach(cleanup)

describe('MobileNavTriggerView', () => {
  it('delegates clicks and reflects the controlled drawer state', () => {
    const onClick = vi.fn()
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <MobileNavDrawerRootView onOpenChange={onOpenChange} open={false}>
        <MobileNavTriggerView
          ariaLabel="Open menu"
          hasInteracted={false}
          onClick={onClick}
          open={false}
        />
      </MobileNavDrawerRootView>,
    )

    const trigger = screen.getByRole('button', { name: 'Open menu' })

    expect(trigger.getAttribute('aria-expanded')).toBe('false')

    fireEvent.click(trigger)

    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onOpenChange).toHaveBeenCalledWith(true)

    rerender(
      <MobileNavDrawerRootView onOpenChange={onOpenChange} open={true}>
        <MobileNavTriggerView
          ariaLabel="Close menu"
          hasInteracted
          onClick={onClick}
          open
        />
      </MobileNavDrawerRootView>,
    )

    expect(
      screen
        .getByRole('button', { name: 'Close menu' })
        .getAttribute('aria-expanded'),
    ).toBe('true')
  })
})
