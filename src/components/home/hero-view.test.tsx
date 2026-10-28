import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { HeroView } from './hero-view'

afterEach(cleanup)

describe('HeroView', () => {
  it('renders storefront copy and delegates the CTA link', () => {
    const renderCta = vi.fn((content: ReactNode, className?: string) => (
      <a className={className} href="/us/en/products">
        {content}
      </a>
    ))

    render(
      <HeroView
        ctaLabel="Shop now"
        description="Everyday pieces made to last."
        eyebrow="New collection"
        renderCta={renderCta}
        title="Modern essentials"
      />,
    )

    expect(
      screen.getByRole('heading', { level: 1, name: 'Modern essentials' }),
    ).toBeTruthy()
    expect(screen.getByText('New collection')).toBeTruthy()
    expect(screen.getByText('Everyday pieces made to last.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Shop now' })).toHaveProperty(
      'pathname',
      '/us/en/products',
    )
    expect(renderCta).toHaveBeenCalledWith(
      'Shop now',
      expect.stringContaining(
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
      ),
    )
  })
})
