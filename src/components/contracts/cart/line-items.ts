import type { MoneyDisplay } from '@/components/shared/money-display'
import type { CartDisplayOption } from './display-options'

export type CartLineItemPresentation = {
  displayOptions: readonly CartDisplayOption[]
  id: string
  imageUrl?: string
  name: string
  productSlug: string
  quantity: number
  totalPrice: MoneyDisplay
  unitPrice: MoneyDisplay
}

export type CartLineItemModel = Pick<
  CartLineItemPresentation,
  'displayOptions' | 'imageUrl' | 'name' | 'totalPrice' | 'unitPrice'
> & {
  imageFallbackLabel: string
  isPending: boolean
  labels: {
    remove: string
    removeItem: string
    total: string
  }
}

export type CartDrawerLineItemModel = Pick<
  CartLineItemPresentation,
  'displayOptions' | 'imageUrl' | 'name' | 'totalPrice'
> & {
  imageFallbackLabel: string
  isPending: boolean
  labels: {
    remove: string
    removeItem: string
  }
}

export type CartQuantitySelectorModel = {
  decreaseLabel: string
  disabled: boolean
  increaseLabel: string
  maxQuantity: number
  quantity: number
  quantityLabel: string
  size: 'drawer' | 'page'
}
