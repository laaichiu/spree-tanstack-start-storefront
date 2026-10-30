import { getMessage } from '@/lib/i18n/messages'
import type { MessageDictionary } from '@/lib/i18n/messages'
import type { ResolvedMarket } from '@/lib/core/market'
import { NotFoundPageView } from '@/components/layout/not-found-page-view'

export function MarketNotFoundPage({
  market,
  messages,
}: {
  market: ResolvedMarket
  messages: MessageDictionary
}) {
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }

  return (
    <NotFoundPageView
      marketParams={marketParams}
      model={{
        description: getMessage(messages, 'notFound.description'),
        eyebrow: getMessage(messages, 'notFound.eyebrow'),
        primaryLabel: getMessage(messages, 'notFound.primaryAction'),
        secondaryLabel: getMessage(messages, 'notFound.secondaryAction'),
        title: getMessage(messages, 'notFound.title'),
      }}
    />
  )
}
