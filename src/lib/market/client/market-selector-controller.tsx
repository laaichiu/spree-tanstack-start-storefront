import { useServerFn } from '@tanstack/react-start'
import type { ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import type {
  MarketSelectionInput,
  ResolvedMarket,
  StorefrontCountryOption,
  StorefrontLocale,
  StorefrontMarket,
} from '@/lib/core/market'
import {
  findCountryOption,
  findMarket,
  findMarketForCountryOption,
  getValidLocaleForMarket,
} from '@/lib/core/market'

import { syncMarketPreferenceCookies } from '../../cookies/market-cookie'
import { persistMarketPreference } from '../api/persist-market-preference'
import { readMarketPreferenceErrorMessage } from '../utils/market-error'
import {
  replaceMarketRedirectSearch,
  replaceMarketPrefix,
  resolveMarketSelection,
} from '../utils/market'

export type MarketNavigationTarget = {
  hash: string
  path: string
  search: string
}

export type MarketSelectorControllerValue = {
  countryOptions: readonly StorefrontCountryOption[]
  draftCountry: string
  draftLocale: string
  hasSelectedMarket: boolean
  isSwitchingMarket: boolean
  localeOptions: readonly StorefrontLocale[]
  onApply: () => Promise<void>
  onCountryChange: (country: string) => void
  onLocaleChange: (locale: string) => void
  onOpenChange: (open: boolean) => void
  open: boolean
  switchError: string | null
}

type MarketSelectorControllerProps = {
  children: (controller: MarketSelectorControllerValue) => ReactNode
  countryOptions: readonly StorefrontCountryOption[]
  currentHash: string
  currentSearch: string
  errorMessage: string
  market: ResolvedMarket
  marketOptions: readonly StorefrontMarket[]
  onNavigate: (target: MarketNavigationTarget) => void
  pathname: string
}

export function MarketSelectorController({
  children,
  countryOptions,
  currentHash,
  currentSearch,
  errorMessage,
  market,
  marketOptions,
  onNavigate,
  pathname,
}: MarketSelectorControllerProps) {
  const persistMarketPreferenceFn = useServerFn(persistMarketPreference)
  const marketContextKey = JSON.stringify([
    market.country,
    market.locale,
    pathname,
    currentSearch,
    currentHash,
  ])
  const marketContextGenerationRef = useRef(0)
  const previousMarketContextKeyRef = useRef(marketContextKey)

  if (previousMarketContextKeyRef.current !== marketContextKey) {
    previousMarketContextKeyRef.current = marketContextKey
    marketContextGenerationRef.current += 1
  }

  const marketContextOwner = `${marketContextGenerationRef.current}:${marketContextKey}`
  const currentMarketContextOwnerRef = useRef(marketContextOwner)
  currentMarketContextOwnerRef.current = marketContextOwner
  const marketSwitchInFlightOwnerRef = useRef<string | null>(null)
  const [open, setOpen] = useState(false)
  const [draftCountry, setDraftCountry] = useState(market.country)
  const [draftLocale, setDraftLocale] = useState(market.locale)
  const [switchingMarketOwner, setSwitchingMarketOwner] = useState<
    string | null
  >(null)
  const [switchErrorState, setSwitchErrorState] = useState<{
    message: string
    owner: string
  } | null>(null)
  const selectedCountryOption = useMemo(
    () =>
      findCountryOption(countryOptions, draftCountry) ??
      findCountryOption(countryOptions, market.country),
    [countryOptions, draftCountry, market.country],
  )
  const selectedMarket = useMemo(
    () =>
      findMarketForCountryOption(marketOptions, selectedCountryOption) ??
      findMarket(marketOptions, market.country),
    [market.country, marketOptions, selectedCountryOption],
  )
  const localeOptions = selectedMarket?.locales ?? []
  const hasChanges =
    draftCountry !== market.country || draftLocale !== market.locale

  useEffect(() => {
    return () => {
      currentMarketContextOwnerRef.current = ''
      marketSwitchInFlightOwnerRef.current = null
    }
  }, [])

  useEffect(() => {
    marketSwitchInFlightOwnerRef.current = null
    setDraftCountry(market.country)
    setDraftLocale(market.locale)
    setSwitchingMarketOwner(null)
    setSwitchErrorState(null)
  }, [currentHash, currentSearch, market.country, market.locale, pathname])

  useEffect(() => {
    if (!open) {
      return
    }

    setDraftCountry(market.country)
    setDraftLocale(market.locale)
    setSwitchErrorState(null)
  }, [market.country, market.locale, open])

  useEffect(() => {
    if (!open || !selectedMarket) {
      return
    }

    const nextLocale = getValidLocaleForMarket(selectedMarket, draftLocale)

    if (nextLocale !== draftLocale) {
      setDraftLocale(nextLocale)
    }
  }, [draftLocale, open, selectedMarket])

  function handleCountryChange(nextCountry: string) {
    setSwitchErrorState(null)
    const nextCountryOption = findCountryOption(countryOptions, nextCountry)
    const nextMarket = findMarketForCountryOption(
      marketOptions,
      nextCountryOption,
    )

    if (!nextMarket) {
      return
    }

    setDraftCountry(nextCountryOption?.country ?? nextMarket.defaultCountry)
    setDraftLocale((currentLocale) =>
      getValidLocaleForMarket(nextMarket, currentLocale),
    )
  }

  function handleLocaleChange(nextLocale: string) {
    setSwitchErrorState(null)
    setDraftLocale(nextLocale)
  }

  async function handleApplyPreferences() {
    const requestOwner = marketContextOwner

    if (
      currentMarketContextOwnerRef.current !== requestOwner ||
      marketSwitchInFlightOwnerRef.current !== null
    ) {
      return
    }

    if (!selectedMarket) {
      return
    }

    const targetSelection = resolveMarketSelection(marketOptions, {
      country: selectedCountryOption?.country ?? draftCountry,
      locale: draftLocale,
    })
    const targetMarket = targetSelection.market

    if (
      !hasChanges ||
      (targetMarket.country === market.country &&
        targetMarket.locale === market.locale)
    ) {
      setOpen(false)
      return
    }

    marketSwitchInFlightOwnerRef.current = requestOwner
    setSwitchingMarketOwner(requestOwner)
    setSwitchErrorState(null)

    try {
      const persistedMarket = await persistMarketPreferenceFn({
        data: targetMarket satisfies MarketSelectionInput,
      })

      if (currentMarketContextOwnerRef.current !== requestOwner) {
        return
      }

      syncMarketPreferenceCookies(persistedMarket)
      try {
        await Promise.resolve(
          onNavigate({
            hash: currentHash,
            path: replaceMarketPrefix(pathname, persistedMarket),
            search: replaceMarketRedirectSearch(
              currentSearch,
              market,
              persistedMarket,
            ),
          }),
        )
      } catch {
        // Market preference persistence has already succeeded; navigation is a separate UI concern.
      }
    } catch (error) {
      if (currentMarketContextOwnerRef.current !== requestOwner) {
        return
      }

      setSwitchErrorState({
        message: readMarketPreferenceErrorMessage(error, errorMessage),
        owner: requestOwner,
      })
    } finally {
      if (
        currentMarketContextOwnerRef.current === requestOwner &&
        marketSwitchInFlightOwnerRef.current === requestOwner
      ) {
        marketSwitchInFlightOwnerRef.current = null
        setSwitchingMarketOwner(null)
      }
    }
  }

  return children({
    countryOptions,
    draftCountry,
    draftLocale,
    hasSelectedMarket: Boolean(selectedMarket),
    isSwitchingMarket: switchingMarketOwner === marketContextOwner,
    localeOptions,
    onApply: handleApplyPreferences,
    onCountryChange: handleCountryChange,
    onLocaleChange: handleLocaleChange,
    onOpenChange: setOpen,
    open,
    switchError:
      switchErrorState?.owner === marketContextOwner
        ? switchErrorState.message
        : null,
  })
}
