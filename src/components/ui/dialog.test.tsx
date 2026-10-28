import { useState } from 'react'
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DialogContent, DialogRoot, DialogTrigger } from './dialog'

afterEach(cleanup)

function DialogExample() {
  const [open, setOpen] = useState(false)

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <DialogTrigger>Open profile</DialogTrigger>
      <DialogContent
        closeLabel="Dismiss profile"
        description="Update the customer profile."
        title="Customer profile"
      >
        <p>Profile form</p>
      </DialogContent>
    </DialogRoot>
  )
}

describe('Dialog', () => {
  it('opens through its trigger and closes through its labelled control', async () => {
    render(<DialogExample />)

    fireEvent.click(screen.getByRole('button', { name: 'Open profile' }))

    expect((await screen.findByRole('dialog')).textContent).toContain(
      'Profile form',
    )
    expect(screen.getByText('Update the customer profile.')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss profile' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })
})
