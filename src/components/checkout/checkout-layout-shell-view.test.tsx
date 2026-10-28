import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { CheckoutLayoutShellView } from './checkout-layout-shell-view'

afterEach(cleanup)

describe('CheckoutLayoutShellView', () => {
  it('renders content and delegates home and legal links', () => {
    render(
      <CheckoutLayoutShellView
        capabilities={{
          renderHomeLink: (content, className) => (
            <a aria-label="Storefront home" className={className} href="/">
              {content}
            </a>
          ),
          renderLegalLink: (link, { children, className }) => (
            <a className={className} href={`/policies/${link.id}`}>
              {children}
            </a>
          ),
        }}
        content={<p>Checkout content</p>}
        model={{
          branding: { logoUrl: null, name: 'Spree' },
          legalLinks: [
            { id: 'privacy-policy', label: 'Privacy policy' },
            { id: 'terms-of-service', label: 'Terms of service' },
          ],
        }}
      />,
    )

    expect(screen.getByText('Checkout content')).toBeTruthy()
    expect(screen.getByText('Spree')).toBeTruthy()
    expect(
      screen.getByRole('link', { name: 'Storefront home' }),
    ).toHaveProperty('pathname', '/')
    expect(screen.getByRole('link', { name: 'Privacy policy' })).toHaveProperty(
      'pathname',
      '/policies/privacy-policy',
    )
    expect(
      screen.getByRole('link', { name: 'Terms of service' }),
    ).toHaveProperty('pathname', '/policies/terms-of-service')
  })
})
