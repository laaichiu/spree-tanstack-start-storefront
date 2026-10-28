import { useState } from 'react'
import type { ReactNode } from 'react'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BrandDirectoryPageModel } from '@/lib/brands/contracts'
import type { BrandDirectorySearch } from '@/lib/brands/contracts/brand-directory-search'
import { fallbackMessages } from '@/lib/i18n/messages'
import type { MessageKey } from '@/lib/i18n/messages'

import { BrandDirectoryPage } from './brand-directory-page'

vi.mock('@tanstack/react-router', () => ({
  Link: ({
    children,
    className,
    params,
    'aria-label': label,
  }: {
    children: ReactNode
    className?: string
    params: { country: string; locale: string; slug: string }
    'aria-label': string
  }) => (
    <a
      aria-label={label}
      className={className}
      href={'/' + params.country + '/' + params.locale + '/' + params.slug}
    >
      {children}
    </a>
  ),
}))

afterEach(cleanup)

const page: BrandDirectoryPageModel = {
  status: 'ready',
  brands: [
    'Apple',
    'A Paper Kid',
    'Beta',
    '2 Studio',
    'Éditions',
    '無印良品',
  ].map((name, index) => ({
    about: '',
    aboutHtml: '',
    coverPhotoUrl: null,
    id: 'sel_test' + index,
    logoUrl: null,
    name,
    slug: 'brand-' + index,
    squareLogoUrl: null,
  })),
}

function t(key: MessageKey) {
  return key.startsWith('brand.')
    ? fallbackMessages.brand[
        key.slice(6) as keyof typeof fallbackMessages.brand
      ]
    : key
}

function Directory({
  initialSearch = {},
  model = page,
}: {
  initialSearch?: BrandDirectorySearch
  model?: BrandDirectoryPageModel
}) {
  const [search, setSearch] = useState(initialSearch)
  return (
    <BrandDirectoryPage
      marketParams={{ country: 'us', locale: 'en' }}
      onSearchChange={setSearch}
      page={model}
      search={search}
      t={t}
    />
  )
}

describe('BrandDirectoryPage', () => {
  it('shows grouped links and disables unavailable letters', () => {
    render(<Directory />)

    expect(screen.getByRole('status').textContent).toBe('6 of 6 brands')
    expect(
      screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed'),
    ).toBe('true')
    expect(screen.getByRole('button', { name: 'C' })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('heading', { name: 'E' })).toBeTruthy()
    expect(screen.getByRole('heading', { name: 'Other' })).toBeTruthy()
    expect(
      screen
        .getByRole('link', { name: 'View brand: Apple' })
        .getAttribute('href'),
    ).toBe('/us/en/brand-0')
  })

  it('filters by a letter, then searches all letters as the user types', () => {
    render(<Directory />)
    fireEvent.click(screen.getByRole('button', { name: 'A' }))

    expect(screen.getAllByRole('link')).toHaveLength(2)
    expect(screen.getByRole('status').textContent).toBe('2 of 6 brands')
    expect(
      screen.getByRole('button', { name: 'A' }).getAttribute('aria-pressed'),
    ).toBe('true')

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search brands' }), {
      target: { value: 'editions' },
    })

    expect(screen.getAllByRole('link')).toHaveLength(1)
    expect(
      screen.getByRole('link', { name: 'View brand: Éditions' }),
    ).toBeTruthy()
    expect(
      screen.getByRole('button', { name: 'All' }).getAttribute('aria-pressed'),
    ).toBe('true')
  })

  it('recovers from no results and returns focus when clearing search', () => {
    render(<Directory initialSearch={{ q: 'Missing' }} />)

    expect(
      screen.getByRole('heading', { name: 'No brands found' }),
    ).toBeTruthy()
    expect(screen.queryAllByRole('link')).toHaveLength(0)
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByRole('searchbox')).toBe(document.activeElement)
    expect(screen.getAllByRole('link')).toHaveLength(6)

    fireEvent.click(screen.getByRole('button', { name: '0–9' }))
    expect(
      screen.getByRole('link', { name: 'View brand: 2 Studio' }),
    ).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(screen.getAllByRole('link')).toHaveLength(6)
  })

  it('keeps name filtering when returning to all letters', () => {
    render(<Directory initialSearch={{ q: 'a', letter: 'A' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'All' }))
    expect(screen.getByRole('searchbox')).toHaveProperty('value', 'a')
    expect(screen.getAllByRole('link')).toHaveLength(3)
  })

  it.each([
    {
      model: { brands: [], status: 'ready' as const },
      text: 'No brands are currently available.',
    },
    {
      model: { status: 'error' as const },
      text: 'Brands unavailable',
    },
  ])(
    'preserves the unavailable and empty directory states',
    ({ model, text }) => {
      render(<Directory model={model} />)
      expect(screen.getByText(text)).toBeTruthy()
      expect(screen.queryByRole('searchbox')).toBeNull()
    },
  )
})
