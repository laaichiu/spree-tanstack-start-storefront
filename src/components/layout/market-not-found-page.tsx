import { translateMessage } from '@/lib/i18n/messages'
import type { ResolvedMarket } from '@/lib/core/market'
import { NotFoundPageView } from '@/components/layout/not-found-page-view'

export function MarketNotFoundPage({ market }: { market: ResolvedMarket }) {
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <NotFoundPageView
      marketParams={marketParams}
      model={{
        description: translateMessage(market.locale, 'notFound.description'),
        eyebrow: translateMessage(market.locale, 'notFound.eyebrow'),
        primaryLabel: translateMessage(market.locale, 'notFound.primaryAction'),
        secondaryLabel: translateMessage(
          market.locale,
          'notFound.secondaryAction',
        ),
        title: translateMessage(market.locale, 'notFound.title'),
      }}
    />
  )
}
