import { useMarket } from '@/components/layout/market-provider'
import { Input } from '@/components/ui/input'

import { checkoutFieldClassName, checkoutLabelClassName } from './checkout-form'
import { getCheckoutSectionElementId } from '../checkout-requirements'
import { CheckoutSection } from '../checkout-section'
import type { CheckoutContactSectionProps } from './checkout-delivery-section.types'

export function CheckoutContactSection({
  accountLoginHref,
  addressErrors,
  authenticatedCustomerEmail,
  deliveryForm,
}: CheckoutContactSectionProps) {
  const { t } = useMarket()

  return (
    <CheckoutSection
      action={
        authenticatedCustomerEmail ? null : (
          <a
            className="text-lg leading-5 text-muted-foreground underline underline-offset-2 transition hover:text-foreground focus-visible:focus-ring"
            href={accountLoginHref}
          >
            {t('account.signIn')}
          </a>
        )
      }
      errors={addressErrors}
      id={getCheckoutSectionElementId('address')}
      title={t('checkout.contactStep')}
    >
      <Input
        className={checkoutFieldClassName}
        disabled={Boolean(authenticatedCustomerEmail)}
        error={deliveryForm.formState.errors.email?.message}
        label={t('account.email')}
        labelClassName={checkoutLabelClassName}
        placeholder={t('account.emailPlaceholder')}
        type="email"
        {...deliveryForm.register('email')}
      />
    </CheckoutSection>
  )
}
