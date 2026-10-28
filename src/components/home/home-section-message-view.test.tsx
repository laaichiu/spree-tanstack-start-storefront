import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { HomeSectionMessageView } from './home-section-message-view'

afterEach(cleanup)

describe('HomeSectionMessageView', () => {
  it('renders the section status title and description', () => {
    render(
      <HomeSectionMessageView
        description="Try again in a moment."
        title="Products are unavailable"
      />,
    )

    expect(screen.getByText('Products are unavailable')).toBeTruthy()
    expect(screen.getByText('Try again in a moment.')).toBeTruthy()
  })
})
