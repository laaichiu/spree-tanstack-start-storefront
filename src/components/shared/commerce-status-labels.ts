import type { MessageKey } from '@/lib/i18n/messages'
import type { StatusLabels } from './status-label'

export type CommerceStatusLabels = {
  fulfillment: StatusLabels
  payment: StatusLabels
}

export function getCommerceStatusLabels(
  t: (key: MessageKey) => string,
): CommerceStatusLabels {
  const translate = (key: MessageKey) => {
    const label = t(key)
    return label === key ? '' : label
  }
  const unfulfilled = translate('commerceStatus.fulfillment.unfulfilled')
  const fulfilled = translate('commerceStatus.fulfillment.fulfilled')
  const overcharged = translate('commerceStatus.payment.overcharged')
  const voided = translate('commerceStatus.payment.voided')

  return {
    fulfillment: {
      backorder: translate('commerceStatus.fulfillment.backorder'),
      canceled: translate('commerceStatus.fulfillment.canceled'),
      delivered: translate('commerceStatus.fulfillment.delivered'),
      fulfilled,
      partial: translate('commerceStatus.fulfillment.partial'),
      pending: unfulfilled,
      ready: unfulfilled,
      shipped: fulfilled,
      unfulfilled,
    },
    payment: {
      authorized: translate('commerceStatus.payment.authorized'),
      balance_due: translate('commerceStatus.payment.balanceDue'),
      captured: translate('commerceStatus.payment.captured'),
      completed: translate('commerceStatus.payment.completed'),
      credit_owed: overcharged,
      failed: translate('commerceStatus.payment.failed'),
      invalid: translate('commerceStatus.payment.invalid'),
      none: translate('commerceStatus.payment.none'),
      overcharged,
      paid: translate('commerceStatus.payment.paid'),
      partially_paid: translate('commerceStatus.payment.partiallyPaid'),
      partially_refunded: translate('commerceStatus.payment.partiallyRefunded'),
      pending: translate('commerceStatus.payment.pending'),
      processing: translate('commerceStatus.payment.processing'),
      refunded: translate('commerceStatus.payment.refunded'),
      void: voided,
      voided,
    },
  }
}
