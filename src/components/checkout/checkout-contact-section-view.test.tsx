import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { CheckoutContactSectionView } from './checkout-contact-section-view'

afterEach(cleanup)

describe('CheckoutContactSectionView', () => {
  it('renders the contact field and optional action directly', () => {
    render(
      <CheckoutContactSectionView
        action={<a href="/account/login">Sign in</a>}
        fieldProps={{
          name: 'email',
          onBlur: vi.fn(),
          onChange: vi.fn(),
          ref: (_element: HTMLInputElement | null) => undefined,
        }}
        model={{
          contact: {
            disabled: false,
            label: 'Email',
            placeholder: 'you@example.com',
          },
          section: {
            errors: [],
            id: 'checkout-contact',
            title: 'Contact information',
          },
        }}
      />,
    )

    expect(
      screen.getByRole('heading', { name: 'Contact information' }),
    ).toBeTruthy()
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveProperty(
      'name',
      'email',
    )
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveProperty(
      'pathname',
      '/account/login',
    )
  })
})
