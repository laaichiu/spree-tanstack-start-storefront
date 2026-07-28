import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DialogContent, DialogRoot } from './dialog'

afterEach(cleanup)

describe('DialogContent', () => {
  it('can render its backdrop when nested inside another dialog', () => {
    render(
      <DialogRoot onOpenChange={() => undefined} open>
        <DialogContent title="Parent dialog">
          <DialogRoot onOpenChange={() => undefined} open>
            <DialogContent forceBackdrop title="Nested dialog">
              Nested content
            </DialogContent>
          </DialogRoot>
        </DialogContent>
      </DialogRoot>,
    )

    const dialogBackdrops = screen
      .getAllByRole('presentation', { hidden: true })
      .filter((element) => element.classList.contains('bg-black/35'))

    expect(dialogBackdrops).toHaveLength(2)
  })
})
