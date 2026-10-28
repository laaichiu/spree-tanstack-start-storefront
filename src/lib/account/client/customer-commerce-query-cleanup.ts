import type { QueryClient } from '@tanstack/react-query'

import { cartQueryKey } from '@/lib/cart/client/cart-query'
import {
  checkoutOrderQueryKey,
  checkoutOrderSnapshotQueryKey,
} from '@/lib/checkout/client/use-checkout-order'
import { clearProductReviewSessionState } from '@/lib/reviews/client/review-query'

export function removeCustomerCommerceQueries(queryClient: QueryClient) {
  queryClient.removeQueries({ queryKey: cartQueryKey })
  queryClient.removeQueries({ queryKey: checkoutOrderQueryKey })
  queryClient.removeQueries({ queryKey: checkoutOrderSnapshotQueryKey })
  clearProductReviewSessionState(queryClient)
}
