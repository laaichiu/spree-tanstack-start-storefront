import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { FooterDeferredSlotView } from './footer-deferred-slot-view'

afterEach(cleanup)

describe('FooterDeferredSlotView', () => {
  it('forwards retry through the direct callback after a deferred load error', () => {
    const onRetry = vi.fn()

    render(
      <FooterDeferredSlotView
        model={{ hasLoadError: true, retryLabel: 'Retry interactive footer' }}
        onRetry={onRetry}
        slotRef={{ current: null }}
        slots={{ content: null, fallback: <div>Loading footer</div> }}
      />,
    )

    fireEvent.click(
      screen.getByRole('button', { name: 'Retry interactive footer' }),
    )

    expect(onRetry).toHaveBeenCalledOnce()
  })
})
