import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CartQuantitySelectorView } from './cart-quantity-selector-view'

afterEach(cleanup)

const labels = {
  decrease: 'Decrease quantity',
  increase: 'Increase quantity',
  quantity: 'Quantity',
}

function renderQuantitySelector({
  disabled = false,
  maxQuantity = 10,
  quantity = 2,
  updateQuantity = vi.fn(async () => undefined),
}: {
  disabled?: boolean
  maxQuantity?: number
  quantity?: number
  updateQuantity?: (quantity: number) => Promise<void>
} = {}) {
  render(
    <CartQuantitySelectorView
      model={{
        decreaseLabel: labels.decrease,
        disabled,
        increaseLabel: labels.increase,
        maxQuantity,
        quantity,
        quantityLabel: labels.quantity,
        size: 'page',
      }}
      onUpdateQuantity={updateQuantity}
    />,
  )

  return {
    decrease: screen.getByRole('button', { name: labels.decrease }),
    increase: screen.getByRole('button', { name: labels.increase }),
    input: screen.getByRole('textbox', { name: labels.quantity }),
  }
}

describe('CartQuantitySelectorView', () => {
  it('forwards step changes from the current quantity', () => {
    const updateQuantity = vi.fn(async () => undefined)
    const controls = renderQuantitySelector({ updateQuantity })

    fireEvent.click(controls.increase)
    expect(updateQuantity).toHaveBeenLastCalledWith(3)

    fireEvent.change(controls.input, { target: { value: '4' } })
    fireEvent.click(controls.decrease)
    expect(updateQuantity).toHaveBeenLastCalledWith(3)
  })

  it('commits direct input on Enter or blur and clamps it to inventory', () => {
    const updateQuantity = vi.fn(async () => undefined)
    const controls = renderQuantitySelector({
      maxQuantity: 5,
      updateQuantity,
    })

    fireEvent.change(controls.input, { target: { value: '4' } })
    fireEvent.keyDown(controls.input, { key: 'Enter' })
    expect(updateQuantity).toHaveBeenLastCalledWith(4)

    fireEvent.change(controls.input, { target: { value: '99' } })
    fireEvent.blur(controls.input)
    expect(updateQuantity).toHaveBeenLastCalledWith(5)
  })

  it('does not suppress the next input blur after an unfocused step click', () => {
    const updateQuantity = vi.fn(async () => undefined)
    const controls = renderQuantitySelector({ updateQuantity })

    fireEvent.pointerDown(controls.increase)
    fireEvent.change(controls.input, { target: { value: '4' } })
    fireEvent.blur(controls.input)

    expect(updateQuantity).toHaveBeenCalledOnce()
    expect(updateQuantity).toHaveBeenCalledWith(4)
  })

  it('uses the focused draft when a step click causes the input to blur', () => {
    const updateQuantity = vi.fn(async () => undefined)
    const controls = renderQuantitySelector({ updateQuantity })

    fireEvent.focus(controls.input)
    fireEvent.change(controls.input, { target: { value: '4' } })
    fireEvent.pointerDown(controls.increase)
    fireEvent.blur(controls.input)
    fireEvent.click(controls.increase)

    expect(updateQuantity).toHaveBeenCalledOnce()
    expect(updateQuantity).toHaveBeenCalledWith(5)
  })

  it('restores the server quantity for invalid drafts and failed updates', async () => {
    const updateQuantity = vi.fn(async () => {
      throw new Error('Inventory changed')
    })
    const controls = renderQuantitySelector({ updateQuantity })

    fireEvent.change(controls.input, { target: { value: '' } })
    fireEvent.blur(controls.input)
    expect(controls.input).toHaveProperty('value', '2')
    expect(updateQuantity).not.toHaveBeenCalled()

    fireEvent.change(controls.input, { target: { value: '6' } })
    fireEvent.keyDown(controls.input, { key: 'Enter' })

    await waitFor(() => expect(controls.input).toHaveProperty('value', '2'))
    expect(updateQuantity).toHaveBeenCalledWith(6)
  })

  it('restores the latest server quantity after a stale failed update', async () => {
    let rejectUpdate: (error: Error) => void = () => undefined
    const updateQuantity = vi.fn(
      () =>
        new Promise<void>((_resolve, reject) => {
          rejectUpdate = reject
        }),
    )
    const view = render(
      <CartQuantitySelectorView
        model={{
          decreaseLabel: labels.decrease,
          disabled: false,
          increaseLabel: labels.increase,
          maxQuantity: 10,
          quantity: 2,
          quantityLabel: labels.quantity,
          size: 'page',
        }}
        onUpdateQuantity={updateQuantity}
      />,
    )
    const input = screen.getByRole('textbox', { name: labels.quantity })

    fireEvent.change(input, { target: { value: '6' } })
    fireEvent.keyDown(input, { key: 'Enter' })
    view.rerender(
      <CartQuantitySelectorView
        model={{
          decreaseLabel: labels.decrease,
          disabled: true,
          increaseLabel: labels.increase,
          maxQuantity: 10,
          quantity: 4,
          quantityLabel: labels.quantity,
          size: 'page',
        }}
        onUpdateQuantity={updateQuantity}
      />,
    )

    await waitFor(() => expect(input).toHaveProperty('value', '4'))

    await act(async () => {
      rejectUpdate(new Error('Inventory changed'))
      await Promise.resolve()
    })

    expect(input).toHaveProperty('value', '4')
  })

  it('disables invalid bounds and every control while pending', () => {
    const { decrease, increase, input } = renderQuantitySelector({
      maxQuantity: 1,
      quantity: 1,
    })

    expect(decrease).toHaveProperty('disabled', true)
    expect(increase).toHaveProperty('disabled', true)
    expect(input).toHaveProperty('disabled', false)

    cleanup()
    const pendingControls = renderQuantitySelector({ disabled: true })
    expect(pendingControls.decrease).toHaveProperty('disabled', true)
    expect(pendingControls.increase).toHaveProperty('disabled', true)
    expect(pendingControls.input).toHaveProperty('disabled', true)
  })
})
