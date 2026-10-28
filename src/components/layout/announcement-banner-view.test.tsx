import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AnnouncementBannerView } from './announcement-banner-view'

afterEach(cleanup)

describe('AnnouncementBannerView', () => {
  it('presents the current storefront announcement as a labelled carousel', () => {
    render(
      <AnnouncementBannerView
        label="Store announcements"
        messages={['Free shipping over $100']}
      />,
    )

    const banner = screen.getByRole('group', {
      name: 'Store announcements',
    })

    expect(banner.getAttribute('aria-roledescription')).toBe('carousel')
    expect(screen.getByText('Free shipping over $100')).toBeTruthy()
  })
})
