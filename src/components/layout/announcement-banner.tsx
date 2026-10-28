import { useMemo } from 'react'

import { useMarket } from '@/components/layout/market-provider'
import type { CartFreeShippingPromotion } from '@/lib/cart/contracts'
import { formatMoney } from '@/components/shared/money-display'

import { AnnouncementBannerView } from './announcement-banner-view'

export function AnnouncementBanner({
  freeShippingPromotion,
}: {
  freeShippingPromotion: CartFreeShippingPromotion | null
}) {
  const { market, t } = useMarket()
  const messages = useMemo(() => {
    const newArrivalsMessage = t('header.announcementNewArrivals')

    if (!freeShippingPromotion) {
      return [newArrivalsMessage]
    }

    const threshold = formatMoney(
      freeShippingPromotion.threshold,
      market.locale,
    )

    return [
      t('header.announcementFreeShipping').replace('{amount}', threshold),
      newArrivalsMessage,
    ]
  }, [freeShippingPromotion, market.locale, t])
  return (
    <AnnouncementBannerView
      label={t('header.announcementLabel')}
      messages={messages}
    />
  )
}
