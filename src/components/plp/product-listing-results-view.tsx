import type {
  ProductListingResultsSlots,
  ProductListingResultsState,
} from '../contracts/catalog'

export type {
  ProductListingResultsSlots,
  ProductListingResultsState,
} from '../contracts/catalog'

type ProductListingResultsViewProps = {
  state: ProductListingResultsState
  slots: ProductListingResultsSlots
}

export function ProductListingResultsView({
  state,
  slots,
}: ProductListingResultsViewProps) {
  if (state === 'error') {
    return slots.error
  }

  if (state === 'empty') {
    return slots.empty
  }

  return slots.product
}
