import { Receipt } from 'lucide-react'

import type { AccountOrderPaymentDisplay } from './account-order-payment-display'
import type { AccountOrderStatusLabels } from '@/components/contracts/account'
import {
  AccountPill,
  AccountSectionHeader,
  AccountSurface,
} from './account-ui-view'
import {
  AccountOrderStatusDetailEmptyNotice,
  AccountOrderStatusDetailInfoBlock,
} from './account-order-status-detail-view'

export function AccountOrderPaymentSectionView({
  labels,
  payments,
}: {
  labels: AccountOrderStatusLabels
  payments: readonly AccountOrderPaymentDisplay[]
}) {
  return (
    <AccountSurface className="xl:col-span-2">
      <AccountSectionHeader
        description={labels.paymentDescription}
        title={labels.paymentInformation}
      />
      <div className="mt-6 space-y-4">
        {payments.length ? (
          payments.map((payment) => (
            <PaymentCard key={payment.id} labels={labels} payment={payment} />
          ))
        ) : (
          <AccountOrderStatusDetailEmptyNotice
            icon={
              <Receipt aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
            }
          >
            {labels.noPayments}
          </AccountOrderStatusDetailEmptyNotice>
        )}
      </div>
    </AccountSurface>
  )
}

function PaymentCard({
  labels,
  payment,
}: {
  labels: AccountOrderStatusLabels
  payment: AccountOrderPaymentDisplay
}) {
  return (
    <div className="border border-border p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xs font-normal text-foreground">
            {payment.methodName}
          </h3>
          {payment.sourceLabel && (
            <p className="mt-1 text-xs leading-6 text-muted-foreground">
              {payment.sourceLabel}
            </p>
          )}
        </div>
        <AccountPill>{payment.statusLabel}</AccountPill>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <AccountOrderStatusDetailInfoBlock
          label={labels.paymentAmount}
          value={payment.amount}
        />
        {payment.reference && (
          <AccountOrderStatusDetailInfoBlock
            label={labels.paymentReference}
            value={payment.reference}
          />
        )}
        {payment.authorizationCode && (
          <AccountOrderStatusDetailInfoBlock
            label={labels.authorizationCode}
            value={payment.authorizationCode}
          />
        )}
      </div>
    </div>
  )
}
