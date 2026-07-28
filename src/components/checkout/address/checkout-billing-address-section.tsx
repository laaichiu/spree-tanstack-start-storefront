import { useMarket } from '@/components/layout/market-provider'
import { RadioGroup, RadioOption } from '@/components/ui/radio'
import { cn } from '@/lib/utils'

import { CheckoutBillingAddressFields } from './checkout-billing-address-fields'
import type { CheckoutBillingAddressSectionProps } from './checkout-billing-address-section.types'

export function CheckoutBillingAddressSection({
  billingCountryIso,
  billingForm,
  billingMode,
  billingStateAbbr,
  billingStateName,
  disabled,
  fieldsRef,
  labels,
  onAutofillSync,
  onBillingCountryChange,
  onBillingStateAbbrChange,
  onBillingStateNameChange,
  onModeChange,
}: CheckoutBillingAddressSectionProps) {
  const { t } = useMarket()

  return (
    <div className="space-y-4">
      <h3 className="text-xl leading-6 font-normal text-foreground">
        {t('checkout.billingAddress')}
      </h3>
      <RadioGroup
        className="overflow-hidden border border-border"
        disabled={disabled}
        onValueChange={(value) =>
          onModeChange(value === 'different' ? 'different' : 'same')
        }
        value={billingMode}
      >
        <RadioOption
          className={cn(
            'px-4 py-3',
            billingMode === 'same'
              ? 'bg-muted'
              : 'bg-background hover:bg-muted',
          )}
          label={t('checkout.sameAsShippingAddress')}
          value="same"
        />
        <RadioOption
          className={cn(
            'border-t border-border px-4 py-3',
            billingMode === 'different'
              ? 'bg-muted'
              : 'bg-background hover:bg-muted',
          )}
          label={t('checkout.useDifferentBillingAddress')}
          value="different"
        />
      </RadioGroup>
      {billingMode === 'different' ? (
        <CheckoutBillingAddressFields
          billingCountryIso={billingCountryIso}
          billingForm={billingForm}
          billingStateAbbr={billingStateAbbr}
          billingStateName={billingStateName}
          disabled={disabled}
          fieldsRef={fieldsRef}
          labels={labels}
          onAutofillSync={onAutofillSync}
          onBillingCountryChange={onBillingCountryChange}
          onBillingStateAbbrChange={onBillingStateAbbrChange}
          onBillingStateNameChange={onBillingStateNameChange}
        />
      ) : null}
    </div>
  )
}
