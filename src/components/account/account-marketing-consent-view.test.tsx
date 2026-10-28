import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AccountMarketingConsentView } from './account-marketing-consent-view'

afterEach(cleanup)

describe('AccountMarketingConsentView', () => {
  it('normalizes checkbox changes for the direct callback', () => {
    const onChange = vi.fn()

    render(
      <AccountMarketingConsentView
        label="Marketing emails"
        onChange={onChange}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'Marketing emails' }))

    expect(onChange).toHaveBeenCalledWith(true)
  })
})
