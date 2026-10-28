import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { AccountGiftCardsSectionView } from './account-gift-cards-section-view'

afterEach(cleanup)

const labels = {
  activeGiftCards: 'Active gift cards',
  archivedGiftCards: 'Archived gift cards',
  giftCards: 'Gift cards',
  giftCardsDescription: 'View your gift cards.',
  giftCardsLoadFailed: 'Unable to load gift cards',
  giftCardsLoadFailedDescription: 'Try again later.',
  noGiftCards: 'No gift cards',
  noGiftCardsDescription: 'Gift cards will appear here.',
}

describe('AccountGiftCardsSectionView', () => {
  it('shows the load error without rendering gift card groups', () => {
    render(
      <AccountGiftCardsSectionView model={{ labels, status: 'load-error' }} />,
    )

    expect(screen.getByText('Unable to load gift cards')).toBeTruthy()
    expect(screen.queryByText('Active gift cards')).toBeNull()
  })

  it('shows the empty state when a successful response contains no cards', () => {
    render(
      <AccountGiftCardsSectionView
        model={{
          cards: { active: [], archived: [] },
          labels,
          status: 'ready',
        }}
      />,
    )

    expect(screen.getByText('No gift cards')).toBeTruthy()
    expect(screen.getByText('View your gift cards.')).toBeTruthy()
  })
})
