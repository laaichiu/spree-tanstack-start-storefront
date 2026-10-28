import { act, cleanup, render, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type {
  MarketSelectorControllerValue,
  MarketNavigationTarget,
} from './market-selector-controller'
import { MarketSelectorController } from './market-selector-controller'
import type {
  ResolvedMarket,
  StorefrontCountryOption,
  StorefrontMarket,
} from '@/lib/core/market'

const server = vi.hoisted(() => ({
  persistMarketPreference: vi.fn(),
}))

vi.mock('@tanstack/react-start', () => ({
  useServerFn: (serverFn: unknown) => serverFn,
}))

vi.mock('../api/persist-market-preference', () => ({
  persistMarketPreference: server.persistMarketPreference,
}))

vi.mock('../../cookies/market-cookie', () => ({
  syncMarketPreferenceCookies: vi.fn(),
}))

const usCountryOption: StorefrontCountryOption = {
  country: 'US',
  countryName: 'United States',
  currencyCode: 'USD',
  locale: 'en',
  marketId: 'market-us',
  marketName: 'United States',
}
const caCountryOption: StorefrontCountryOption = {
  country: 'CA',
  countryName: 'Canada',
  currencyCode: 'CAD',
  locale: 'en',
  marketId: 'market-ca',
  marketName: 'Canada',
}
const usMarketOption: StorefrontMarket = {
  countries: [usCountryOption],
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  defaultCountry: 'US',
  defaultLocale: 'en',
  id: 'market-us',
  isDefault: true,
  locales: [{ code: 'en', label: 'English', shortLabel: 'EN' }],
  name: 'United States',
}
const caMarketOption: StorefrontMarket = {
  countries: [caCountryOption],
  currencyCode: 'CAD',
  currencyLabel: 'Canadian Dollar',
  defaultCountry: 'CA',
  defaultLocale: 'en',
  id: 'market-ca',
  isDefault: false,
  locales: [{ code: 'en', label: 'English', shortLabel: 'EN' }],
  name: 'Canada',
}
const marketOptions = [usMarketOption, caMarketOption]
const countryOptions = [usCountryOption, caCountryOption]
const usMarket: ResolvedMarket = {
  country: 'US',
  countryName: 'United States',
  currencyCode: 'USD',
  currencyLabel: 'US Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'market-us',
  marketName: 'United States',
}
const caMarket: ResolvedMarket = {
  country: 'CA',
  countryName: 'Canada',
  currencyCode: 'CAD',
  currencyLabel: 'Canadian Dollar',
  locale: 'en',
  localeLabel: 'English',
  localeShortLabel: 'EN',
  marketId: 'market-ca',
  marketName: 'Canada',
}

function renderController(
  market: ResolvedMarket,
  onNavigate = vi.fn<(target: MarketNavigationTarget) => void>(),
) {
  let currentController: MarketSelectorControllerValue | undefined
  const capture = (controller: MarketSelectorControllerValue): ReactNode => {
    currentController = controller
    return null
  }
  function createView(nextMarket: ResolvedMarket) {
    return (
      <MarketSelectorController
        countryOptions={countryOptions}
        currentHash=""
        currentSearch=""
        errorMessage="Could not update market."
        market={nextMarket}
        marketOptions={marketOptions}
        onNavigate={onNavigate}
        pathname={`/${nextMarket.country}/en/products`}
      >
        {capture}
      </MarketSelectorController>
    )
  }
  const view = render(createView(market))

  return {
    get controller() {
      if (!currentController) {
        throw new Error('Market selector controller was not rendered.')
      }

      return currentController
    },
    rerenderMarket: (nextMarket: ResolvedMarket) => {
      view.rerender(createView(nextMarket))
    },
    ...view,
  }
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('MarketSelectorController owner lifecycle', () => {
  it('ignores an old market response after the active market changes', async () => {
    let rejectFirstPersist: (error: Error) => void = () => undefined
    let resolveSecondPersist: (market: ResolvedMarket) => void = () => undefined
    const firstPersist = new Promise<ResolvedMarket>((_, reject) => {
      rejectFirstPersist = reject
    })
    const secondPersist = new Promise<ResolvedMarket>((resolve) => {
      resolveSecondPersist = resolve
    })
    const onNavigate = vi.fn<(target: MarketNavigationTarget) => void>()
    server.persistMarketPreference
      .mockReturnValueOnce(firstPersist)
      .mockReturnValueOnce(secondPersist)
    const rendered = renderController(usMarket, onNavigate)

    act(() => {
      rendered.controller.onOpenChange(true)
    })
    act(() => {
      rendered.controller.onCountryChange('CA')
    })
    let firstApply: Promise<void> | undefined
    act(() => {
      firstApply = rendered.controller.onApply()
    })
    await waitFor(() =>
      expect(server.persistMarketPreference).toHaveBeenCalledOnce(),
    )

    rendered.rerenderMarket(caMarket)

    await act(async () => {
      rejectFirstPersist(new Error('old market failed'))
      await firstApply
    })

    expect(onNavigate).not.toHaveBeenCalled()
    expect(rendered.controller.switchError).toBeNull()
    expect(rendered.controller.isSwitchingMarket).toBe(false)

    act(() => {
      rendered.controller.onCountryChange('US')
    })
    let secondApply: Promise<void> | undefined
    act(() => {
      secondApply = rendered.controller.onApply()
    })
    await waitFor(() =>
      expect(server.persistMarketPreference).toHaveBeenCalledTimes(2),
    )

    await act(async () => {
      rendered.controller.onApply()
      resolveSecondPersist(usMarket)
      await secondApply
    })

    expect(server.persistMarketPreference).toHaveBeenCalledTimes(2)
    expect(onNavigate).toHaveBeenCalledOnce()
  })

  it('keeps market persistence successful when navigation throws', async () => {
    server.persistMarketPreference.mockResolvedValue(caMarket)
    const onNavigate = vi.fn<(target: MarketNavigationTarget) => void>(() => {
      throw new Error('navigation failed')
    })
    const rendered = renderController(usMarket, onNavigate)

    act(() => {
      rendered.controller.onOpenChange(true)
    })
    act(() => {
      rendered.controller.onCountryChange('CA')
    })

    await act(async () => {
      await expect(rendered.controller.onApply()).resolves.toBeUndefined()
    })

    expect(server.persistMarketPreference).toHaveBeenCalledOnce()
    expect(onNavigate).toHaveBeenCalledOnce()
    expect(rendered.controller.switchError).toBeNull()
    expect(rendered.controller.isSwitchingMarket).toBe(false)
  })

  it('contains an asynchronous navigation rejection after persistence succeeds', async () => {
    server.persistMarketPreference.mockResolvedValue(caMarket)
    const onNavigate = vi
      .fn<(target: MarketNavigationTarget) => void>()
      .mockRejectedValue(new Error('navigation failed'))
    const rendered = renderController(usMarket, onNavigate)

    act(() => {
      rendered.controller.onOpenChange(true)
    })
    act(() => {
      rendered.controller.onCountryChange('CA')
    })

    await act(async () => {
      await expect(rendered.controller.onApply()).resolves.toBeUndefined()
    })

    expect(server.persistMarketPreference).toHaveBeenCalledOnce()
    expect(onNavigate).toHaveBeenCalledOnce()
    expect(rendered.controller.switchError).toBeNull()
    expect(rendered.controller.isSwitchingMarket).toBe(false)
  })
})
