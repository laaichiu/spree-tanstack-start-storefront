import type { Client, ListResponse, Market, RequestOptions } from '@spree/sdk'
import { toSpreeLocaleCode } from '@/lib/runtime/locale-code'

type MarketListOptions = Pick<RequestOptions, 'country' | 'locale'>

export function listMarketsWithExpandedCountries(
  client: Client,
  options: MarketListOptions = {},
) {
  // The selected SDK does not expose expansion parameters on markets.list.
  return client.request<ListResponse<Market>>('GET', '/markets', {
    ...options,
    ...(options.locale ? { locale: toSpreeLocaleCode(options.locale) } : {}),
    params: { expand: 'countries' },
  })
}
