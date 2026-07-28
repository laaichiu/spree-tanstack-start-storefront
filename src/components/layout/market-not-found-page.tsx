import { NotFoundPage } from '@/components/layout/not-found-page'
import { translateMessage } from '@/lib/i18n/messages'
import type { ResolvedMarket } from '@/lib/market/model/market'

export function MarketNotFoundPage({ market }: { market: ResolvedMarket }) {
  const homeHref = `/${market.country}/${market.locale}`

  return (
    <NotFoundPage
      description={translateMessage(market.locale, 'notFound.description')}
      eyebrow={translateMessage(market.locale, 'notFound.eyebrow')}
      primaryHref={homeHref}
      primaryLabel={translateMessage(market.locale, 'notFound.primaryAction')}
      secondaryHref={`${homeHref}/products`}
      secondaryLabel={translateMessage(
        market.locale,
        'notFound.secondaryAction',
      )}
      title={translateMessage(market.locale, 'notFound.title')}
    />
  )
}
