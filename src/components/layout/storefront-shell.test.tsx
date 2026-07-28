import { readFileSync } from 'node:fs'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { StorefrontShell } from '@/components/layout/storefront-shell'
import type { StorefrontShellCapabilities } from '@/components/layout/storefront-shell.model'

vi.mock('@/components/layout/header', () => ({
  Header: ({ capabilities }: { capabilities: StorefrontShellCapabilities }) => (
    <div data-testid="header">
      {capabilities.navigation.categories.length} categories
    </div>
  ),
}))

vi.mock('@/components/layout/footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}))

vi.mock('@/components/layout/newsletter-popup', () => ({
  NewsletterPopup: () => <div data-testid="newsletter-popup" />,
}))

const capabilities: StorefrontShellCapabilities = {
  cart: {
    freeShippingPromotion: null,
    initialCart: null,
    initialLoadError: null,
  },
  navigation: {
    categories: [
      {
        children: [],
        id: 'category-kitchen',
        imageUrl: null,
        name: 'Kitchen',
        permalink: 'kitchen',
      },
    ],
  },
}

afterEach(cleanup)

describe('StorefrontShell', () => {
  it('composes shared layout from normalized capability inputs', async () => {
    render(
      <StorefrontShell capabilities={capabilities}>
        <div>Page content</div>
      </StorefrontShell>,
    )

    expect(screen.getByTestId('header').textContent).toBe('1 categories')
    expect(screen.getByRole('main').textContent).toBe('Page content')
    expect(screen.getByTestId('footer')).toBeTruthy()
    expect(
      await screen.findByTestId('newsletter-popup', {}, { timeout: 2_000 }),
    ).toBeTruthy()
  })

  it('keeps the shell contract outside session and commerce infrastructure', () => {
    const files = [
      'src/components/layout/storefront-shell.tsx',
      'src/components/layout/storefront-shell.model.ts',
    ]
    const source = files.map((file) => readFileSync(file, 'utf8')).join('\n')

    expect(source).not.toMatch(/@spree\/sdk|@tanstack\/react-query/)
    expect(source).not.toMatch(/\/lib\/(?:spree|cookies|env)(?:\/|')/)
    expect(source).not.toMatch(/\.server(?:'|")/)
    expect(source).not.toMatch(/token|queryClient|serverFn/)
  })
})
