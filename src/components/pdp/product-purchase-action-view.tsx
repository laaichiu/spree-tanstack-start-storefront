import { Button } from '@/components/ui/button'
import type { ProductPurchaseActionModel } from '@/lib/catalog/contracts'

type ProductPurchaseActionProps = {
  copy: {
    addToBag: string
    addToBagFailed: string
    addingToBag: string
    preorder: string
    purchaseUnavailable: string
    variantUnavailable: string
  }
  model: ProductPurchaseActionModel
  onAddToCart: () => void | Promise<void>
}

function getProductPurchaseButtonLabel(
  copy: ProductPurchaseActionProps['copy'],
  model: ProductPurchaseActionModel,
) {
  if (model.isAddingToCart) {
    return copy.addingToBag
  }

  if (model.isPreorder) {
    return copy.preorder
  }

  if (model.canAddToCart) {
    return copy.addToBag
  }

  return copy.purchaseUnavailable
}

function getProductPurchaseFeedbackMessage(
  copy: ProductPurchaseActionProps['copy'],
  model: ProductPurchaseActionModel,
) {
  if (model.hasAddToCartError) {
    return copy.addToBagFailed
  }

  if (model.canAddToCart) {
    return undefined
  }

  if (model.availability === 'select_variant') {
    return copy.variantUnavailable
  }

  return copy.purchaseUnavailable
}

export function ProductPurchaseActionView({
  copy,
  model,
  onAddToCart,
}: ProductPurchaseActionProps) {
  const buttonLabel = getProductPurchaseButtonLabel(copy, model)
  const feedbackMessage = getProductPurchaseFeedbackMessage(copy, model)

  return (
    <div className="pt-7">
      <Button
        className="h-14 w-full border-foreground bg-foreground text-background hover:bg-foreground/90"
        disabled={!model.canAddToCart || model.isAddingToCart}
        onClick={() => void onAddToCart()}
        size="lg"
      >
        {buttonLabel}
      </Button>
      {feedbackMessage && (
        <p
          className={
            model.hasAddToCartError
              ? 'mt-3 text-xs leading-6 text-destructive'
              : 'mt-3 text-xs leading-6 text-muted-foreground'
          }
        >
          {feedbackMessage}
        </p>
      )}
    </div>
  )
}
