import { useLocation } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NativeSelect } from '@/components/ui/native-select'
import { syncMarketPreferenceCookies } from '@/lib/cookies/market-cookie'
import { persistMarketPreference } from '@/lib/market/api/persist-market-preference'
import { cn } from '@/lib/utils'

import { useMarket } from './market-provider'
import {
  findMarket,
  replaceMarketRedirectSearch,
  replaceMarketPrefix,
  resolveMarketSelection,
} from '@/lib/market/utils/market'
import { formatCountryOptionLabel } from '@/lib/market/utils/market-format'
import {
  CountryFlagIcon,
  findCountryOption,
  findMarketForCountryOption,
  getMarketSelectorTriggerClasses,
  getValidLocaleForMarket,
} from './market-selector-support'

type MarketSelectorProps = {
  className?: string
  variant?: 'footer' | 'menu'
}

export function MarketSelector({
  className,
  variant = 'footer',
}: MarketSelectorProps) {
  const { countryOptions, market, marketOptions, t } = useMarket()
  const persistMarketPreferenceFn = useServerFn(persistMarketPreference)
  const [open, setOpen] = useState(false)
  const [draftCountry, setDraftCountry] = useState(market.country)
  const [draftLocale, setDraftLocale] = useState(market.locale)
  const [isSwitchingMarket, setIsSwitchingMarket] = useState(false)
  const [switchError, setSwitchError] = useState<string | null>(null)
  const pathname = useLocation({
    select: (location) => location.pathname,
  })
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
  const triggerClasses = getMarketSelectorTriggerClasses(variant)

  useEffect(() => {
    if (!open) {
      return
    }

    setDraftCountry(market.country)
    setDraftLocale(market.locale)
    setSwitchError(null)
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

  function goToMarket(nextMarket: { country: string; locale: string }) {
    if (typeof window === 'undefined') {
      return
    }

    const nextPath = replaceMarketPrefix(pathname, nextMarket)
    const nextSearch = replaceMarketRedirectSearch(
      window.location.search,
      market,
      nextMarket,
    )
    window.location.assign(`${nextPath}${nextSearch}${window.location.hash}`)
  }

  function handleCountryChange(nextCountry: string) {
    setSwitchError(null)
    const nextCountryOption = findCountryOption(countryOptions, nextCountry)
    const nextMarket = findMarketForCountryOption(
      marketOptions,
      nextCountryOption,
    )

    if (!nextMarket) {
      return
    }

    setDraftCountry(nextCountryOption?.country ?? nextMarket.defaultCountry)
    setDraftLocale((currentLocale) => {
      return getValidLocaleForMarket(nextMarket, currentLocale)
    })
  }

  function handleLocaleChange(nextLocale: string) {
    setSwitchError(null)
    setDraftLocale(nextLocale)
  }

  async function handleApplyPreferences() {
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

    setIsSwitchingMarket(true)
    setSwitchError(null)

    try {
      const persistedMarket = await persistMarketPreferenceFn({
        data: targetMarket,
      })

      syncMarketPreferenceCookies(persistedMarket)
      goToMarket(persistedMarket)
    } catch (error) {
      setSwitchError(
        error instanceof Error
          ? error.message
          : t('header.updatePreferencesFailed'),
      )
    } finally {
      setIsSwitchingMarket(false)
    }
  }

  const triggerLabel = (
    <span className="flex cursor-pointer items-center gap-2 text-sm leading-none font-semibold tracking-wider text-foreground uppercase">
      <CountryFlagIcon countryCode={market.country} />
      <span aria-hidden="true" className="h-3 w-px bg-muted-foreground" />
      <span>{market.localeShortLabel}</span>
      <span aria-hidden="true" className="h-3 w-px bg-muted-foreground" />
      <span>{market.currencyCode}</span>
    </span>
  )

  return (
    <DialogRoot onOpenChange={setOpen} open={open}>
      <DialogTrigger
        aria-label={t('header.openRegionSelector')}
        className={cn(triggerClasses, className)}
        type="button"
      >
        {triggerLabel}
      </DialogTrigger>

      <DialogContent
        backdropClassName={variant === 'menu' ? 'z-[70]' : undefined}
        closeLabel={t('header.closeRegionSelector')}
        className={variant === 'menu' ? 'z-[80]' : undefined}
        description={t('header.regionPreferencesDescription')}
        forceBackdrop={variant === 'menu'}
        title={t('header.regionPreferencesTitle')}
      >
        <div className="mt-7 space-y-5">
          <NativeSelect
            id="market-country"
            label={t('header.region')}
            onValueChange={handleCountryChange}
            options={countryOptions.map((option) => ({
              label: formatCountryOptionLabel(option),
              value: option.country,
            }))}
            value={draftCountry}
          />

          <NativeSelect
            id="market-locale"
            label={t('header.language')}
            onValueChange={handleLocaleChange}
            options={localeOptions.map((option) => ({
              label: option.label,
              value: option.code,
            }))}
            value={draftLocale}
          />
        </div>

        <div className="mt-7">
          {switchError ? (
            <p className="mb-4 text-sm text-destructive" role="alert">
              {switchError}
            </p>
          ) : null}
          <Button
            aria-busy={isSwitchingMarket}
            className="w-full"
            disabled={!selectedMarket || isSwitchingMarket}
            onClick={handleApplyPreferences}
            size="lg"
          >
            {t('header.updatePreferences')}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
