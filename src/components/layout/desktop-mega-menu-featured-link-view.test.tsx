import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DesktopMegaMenuFeaturedLinkView } from './desktop-mega-menu-featured-link-view'

afterEach(cleanup)

describe('DesktopMegaMenuFeaturedLinkView', () => {
  it('keeps the featured link usable when its image fails and recovers when the image changes', () => {
    const props = {
      imageAlt: 'Apple',
      imageUrl: '/cover.webp',
      label: 'Shop Apple',
      renderLink: (content: React.ReactNode, className?: string) => (
        <a className={className} href="/us/en/apple">
          {content}
        </a>
      ),
    }
    const { rerender } = render(<DesktopMegaMenuFeaturedLinkView {...props} />)
    const image = screen.getByRole('img', { name: 'Apple' })
    expect(image).toHaveProperty('width', 272)
    expect(image).toHaveProperty('height', 340)

    fireEvent.error(image)
    expect(screen.queryByRole('img')).toBeNull()
    expect(screen.getByText('Apple')).toBeTruthy()
    expect(screen.getByRole('link').getAttribute('href')).toBe('/us/en/apple')

    rerender(
      <DesktopMegaMenuFeaturedLinkView {...props} imageUrl="/new-cover.webp" />,
    )
    expect(screen.getByRole('img', { name: 'Apple' }).getAttribute('src')).toBe(
      '/new-cover.webp',
    )
  })
})
