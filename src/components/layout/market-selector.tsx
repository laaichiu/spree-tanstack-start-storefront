import { useLocation } from '@tanstack/react-router'

import {
  formatCountryOptionLabel,
  formatLocaleLabel,
  getMarketCollator,
} from '@/lib/core/market'
import type {
  StorefrontCountryOption,
  StorefrontLocale,
} from '@/lib/core/market'
import { MarketSelectorController } from '@/lib/market/client/market-selector-controller'
import { useMarket } from './market-provider'
import {
  MarketSelectorView,
  MarketSelectorTriggerView,
} from '@/components/layout/market-selector-view'
import { CountryFlagView } from '@/components/layout/country-flag-view'

type MarketSelectorProps = {
  className?: string
  variant?: 'footer' | 'menu'
}

export function MarketSelector({
  className,
  variant = 'footer',
}: MarketSelectorProps) {
  const { countryOptions, market, marketOptions, t } = useMarket()
  const location = useLocation({
    select: (currentLocation) => ({
      hash: currentLocation.hash,
      pathname: currentLocation.pathname,
      search:
        'searchStr' in currentLocation &&
        typeof currentLocation.searchStr === 'string'
          ? currentLocation.searchStr
          : '',
    }),
  })

  return (
    <MarketSelectorController
      countryOptions={countryOptions}
      currentHash={location.hash}
      currentSearch={location.search}
      errorMessage={t('header.updatePreferencesFailed')}
      market={market}
      marketOptions={marketOptions}
      onNavigate={({ hash, path, search }) => {
        if (typeof window !== 'undefined') {
          window.location.assign(`${path}${search}${hash}`)
        }
      }}
      pathname={location.pathname}
    >
      {(controller) => {
        const optionDisplays = getMarketSelectorOptionDisplays({
          locale: market.locale,
          countryOptions: controller.countryOptions,
          localeOptions: controller.localeOptions,
        })
        const trigger = (
          <MarketSelectorTriggerView
            countryFlag={
              <CountryFlagView
                countryCode={market.country.trim().toLowerCase()}
                fallbackFlag={getCountryFlag(market.country)}
              />
            }
            currencyCode={market.currencyCode}
            localeLabel={market.localeShortLabel}
          />
        )

        return (
          <MarketSelectorView
            actions={{
              apply: controller.onApply,
              countryChange: controller.onCountryChange,
              localeChange: controller.onLocaleChange,
              openChange: controller.onOpenChange,
            }}
            className={className}
            model={{
              applyLabel: t('header.updatePreferences'),
              closeLabel: t('header.closeRegionSelector'),
              countryLabel: t('header.region'),
              countryOptions: optionDisplays.countryOptions,
              description: t('header.regionPreferencesDescription'),
              draftCountry: controller.draftCountry,
              draftLocale: controller.draftLocale,
              hasSelectedMarket: controller.hasSelectedMarket,
              isSwitchingMarket: controller.isSwitchingMarket,
              languageLabel: t('header.language'),
              localeOptions: optionDisplays.localeOptions,
              open: controller.open,
              switchError: controller.switchError,
              title: t('header.regionPreferencesTitle'),
              variant,
            }}
            trigger={trigger}
          />
        )
      }}
    </MarketSelectorController>
  )
}

function getCountryFlag(countryCode: string) {
  const code = countryCode.trim().toUpperCase()

  if (!/^[A-Z]{2}$/.test(code)) return ''

  const firstCodePoint = code.charCodeAt(0) - 65 + 0x1f1e6
  const secondCodePoint = code.charCodeAt(1) - 65 + 0x1f1e6

  return String.fromCodePoint(firstCodePoint, secondCodePoint)
}

function getMarketSelectorOptionDisplays({
  countryOptions,
  localeOptions,
  locale,
}: {
  locale: string
  countryOptions: readonly StorefrontCountryOption[]
  localeOptions: readonly StorefrontLocale[]
}) {
  return {
    countryOptions: countryOptions.map((option) => ({
      label: formatCountryOptionLabel(option, locale),
      value: option.country,
    })),
    localeOptions: localeOptions
      .map((option) => ({
        label: formatLocaleLabel(option.code, locale),
        value: option.code,
      }))
      .sort((left, right) =>
        getMarketCollator(locale).compare(left.label, right.label),
      ),
  }
}
