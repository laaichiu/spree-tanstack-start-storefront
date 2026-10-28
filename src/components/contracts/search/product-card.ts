import type { MoneyDisplay } from '@/components/shared/money-display'
import type { ProductCardImage } from '@/components/contracts/catalog/product-card'

export type SearchProductCardModel = MoneyDisplay & {
  attribution: string | null
  image: ProductCardImage | null
  name: string
}
