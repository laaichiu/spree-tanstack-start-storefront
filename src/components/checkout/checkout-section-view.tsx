import type {
  CheckoutSectionModel,
  CheckoutSectionSlots,
} from '../contracts/checkout'

export type {
  CheckoutSectionModel,
  CheckoutSectionSlots,
} from '../contracts/checkout'

export function CheckoutSectionView({
  model,
  slots,
}: {
  model: CheckoutSectionModel
  slots: CheckoutSectionSlots
}) {
  return (
    <section className="space-y-5 scroll-mt-8" id={model.id}>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-normal text-foreground">
            {model.title}
          </h2>
          {model.description && (
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {model.description}
            </p>
          )}
        </div>
        {slots.action && <div className="shrink-0">{slots.action}</div>}
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
      {slots.content}
    </section>
  )
}
