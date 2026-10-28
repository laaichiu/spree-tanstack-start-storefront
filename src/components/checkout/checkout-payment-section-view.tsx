import type {
  CheckoutPaymentSectionModel,
  CheckoutPaymentSectionSlots,
} from '../contracts/checkout'

export type {
  CheckoutPaymentSectionModel,
  CheckoutPaymentSectionSlots,
} from '../contracts/checkout'

export function CheckoutPaymentSectionView({
  model,
  slots,
}: {
  model: CheckoutPaymentSectionModel
  slots: CheckoutPaymentSectionSlots
}) {
  return (
    <section className="space-y-5 scroll-mt-8" id={model.id}>
      <div>
        <h2 className="text-lg md:text-xl font-normal text-foreground">
          {model.title}
        </h2>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {model.description}
        </p>
      </div>

      {model.errors && model.errors.length > 0 && (
        <div className="border border-destructive bg-muted px-4 py-3">
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

      {model.hasPaymentMethods ? (
        slots.payment
      ) : (
        <div className="border border-border px-5 py-5">
          <p className="text-xs leading-6 text-muted-foreground">
            {model.noPaymentMethodsDescription}
          </p>
        </div>
      )}

      {slots.billingAddress}
    </section>
  )
}
