import type { CartPageProps } from '@/components/contracts/cart'

export type { CartPageProps } from '@/components/contracts/cart'

/**
 * The view owns page layout while its caller composes each state's content.
 */
export function CartPageView(props: CartPageProps) {
  if (props.status !== 'ready') {
    return props.content
  }

  return (
    <section className="w-full px-4 py-6 lg:px-8 lg:py-8">
      <div className="space-y-6 lg:space-y-8">
        {props.header}
        {props.itemError}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
          <section>
            <ul>{props.lineItems}</ul>
          </section>
          {props.orderSummary}
        </div>
      </div>
    </section>
  )
}
