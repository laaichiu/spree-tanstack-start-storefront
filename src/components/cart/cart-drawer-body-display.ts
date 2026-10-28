import type { CartDrawerBodyModel } from '@/components/contracts/cart'
import type { CartDrawerModel } from '@/lib/cart/contracts'
import type { MessageKey } from '@/lib/i18n/messages'

export function getCartDrawerBodyModel({
  cartMutationError,
  isResetPending,
  model,
  t,
}: {
  cartMutationError: string | null
  isResetPending: boolean
  model: CartDrawerModel
  t: (key: MessageKey) => string
}): CartDrawerBodyModel {
  switch (model.status) {
    case 'loading':
      return { loadingLabel: t('cart.loadingCart'), status: 'loading' }
    case 'error':
      return {
        error: {
          actionLabel: t('cart.resetCartSession'),
          description: t('cart.cartLoadFailedDescription'),
          error: cartMutationError,
          isPending: isResetPending,
          pendingActionLabel: t('cart.resettingCartSession'),
          title: t('cart.cartLoadFailed'),
        },
        status: 'error',
      }
    case 'empty':
      return {
        empty: {
          actionLabel: t('cart.startShopping'),
          description: t('cart.emptyDrawerDescription'),
          title: t('cart.emptyBagHeading'),
        },
        status: 'empty',
      }
    case 'ready':
      return { mutationError: cartMutationError, status: 'ready' }
  }
}
