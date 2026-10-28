import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { X } from 'lucide-react'
import type { FormEvent } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Button, buttonClassName } from './button'

afterEach(cleanup)

describe('Button', () => {
  it('defaults to a non-submitting button', () => {
    render(<Button>Continue</Button>)

    expect(screen.getByRole('button', { name: 'Continue' })).toHaveProperty(
      'type',
      'button',
    )
  })

  it('applies variants while preserving consumer classes', () => {
    const className = buttonClassName({
      className: 'checkout-action',
      size: 'lg',
      variant: 'danger',
    })

    expect(className).toContain('bg-destructive')
    expect(className).toContain('h-12')
    expect(className).toContain('checkout-action')
  })

  it('keeps a labelled icon action focusable without submitting its form', () => {
    const onClick = vi.fn()
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    )

    render(
      <form onSubmit={onSubmit}>
        <Button variant="icon" aria-label="Dismiss" onClick={onClick}>
          <X aria-hidden="true" />
        </Button>
      </form>,
    )

    const button = screen.getByRole('button', { name: 'Dismiss' })
    button.focus()
    expect(document.activeElement).toBe(button)
    fireEvent.click(button)
    expect(onClick).toHaveBeenCalledOnce()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('preserves submit behavior, disabled state, and Base UI state classes', () => {
    const onSubmit = vi.fn((event: FormEvent<HTMLFormElement>) =>
      event.preventDefault(),
    )
    function Form({ disabled }: { disabled: boolean }) {
      return (
        <form onSubmit={onSubmit}>
          <Button
            variant="icon"
            aria-label="Search"
            className={(state) => (state.disabled ? 'opacity-40' : undefined)}
            disabled={disabled}
            type="submit"
          >
            <X aria-hidden="true" />
          </Button>
        </form>
      )
    }

    const { rerender } = render(<Form disabled />)
    const button = screen.getByRole('button', { name: 'Search' })
    expect(button).toHaveProperty('disabled', true)
    expect(button.className).toContain('opacity-40')
    fireEvent.click(button)
    expect(onSubmit).not.toHaveBeenCalled()

    rerender(<Form disabled={false} />)
    fireEvent.click(button)
    expect(onSubmit).toHaveBeenCalledOnce()
  })
})
