import type { ReactNode } from 'react'

import type { CheckoutSectionModel } from '../contracts/checkout'

export function CheckoutShippingMethodSectionView({
  methods,
  model,
}: {
  methods: ReactNode
  model: CheckoutSectionModel
}) {
  return (
    <div className="space-y-5 pt-3">
      <div className="scroll-mt-8" id={model.id}>
        <h3 className="text-base md:text-lg font-normal text-foreground">
          {model.title}
        </h3>
        {model.errors && model.errors.length > 0 && (
          <div className="mt-5 border border-destructive bg-muted px-4 py-3">
            {model.errors.map((error, index) => (
              <p
                className="text-xs leading-6 text-destructive"
                key={`${error}:${index}`}
              >
                {error}
              </p>
            ))}
          </div>
        )}
      </div>
      {methods}
    </div>
  )
}
