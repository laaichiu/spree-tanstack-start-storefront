import type { CartPageHeaderModel } from '@/components/contracts/cart'

export type { CartPageHeaderModel } from '@/components/contracts/cart'

export function CartPageHeaderView({ model }: { model: CartPageHeaderModel }) {
  return (
    <header className="space-y-4">
      <h1 className="text-2xl leading-tight md:text-3xl break-words font-normal tracking-wider text-foreground">
        {model.title}
        <span className="ml-3 inline-block align-middle text-xs leading-4 tracking-wider text-muted-foreground uppercase">
          ({model.itemCountLabel})
        </span>
      </h1>
      <p className="max-w-2xl text-xs leading-6 text-muted-foreground">
        {model.shippingNote}
      </p>
    </header>
  )
}
