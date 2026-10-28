import type { ReactNode } from 'react'
import type { CartPageModel as CartPageDataModel } from '@/lib/cart/contracts'

type CartPageStatus = CartPageDataModel['status']

export type CartPageHeaderModel = {
  itemCountLabel: string
  shippingNote: string
  title: string
}

type CartPageReadyContent = {
  header: ReactNode
  itemError?: ReactNode
  lineItems: ReactNode
  orderSummary: ReactNode
}

export type CartPageProps =
  | {
      content: ReactNode
      status: Exclude<CartPageStatus, 'ready'>
    }
  | (CartPageReadyContent & {
      status: 'ready'
    })
