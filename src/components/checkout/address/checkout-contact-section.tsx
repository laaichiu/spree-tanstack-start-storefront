import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import { CheckoutContactSectionView } from '@/components/checkout/checkout-contact-section-view'
import { CheckoutSignInLinkView } from '@/components/checkout/checkout-sign-in-link-view'
import { getCheckoutPath } from '@/lib/checkout/utils/checkout-navigation'

import { getCheckoutSectionElementId } from '../checkout-requirements'
import type { CheckoutContactSectionProps } from './checkout-delivery-section.types'

export function CheckoutContactSection({
  accountLoginTarget,
  addressErrors,
  authenticatedCustomerEmail,
  deliveryForm,
}: CheckoutContactSectionProps) {
  const { market, t } = useMarket()
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  const checkoutPath = getCheckoutPath({
    cartId: accountLoginTarget.cartId,
    ...marketParams,
  })

  return (
    <CheckoutContactSectionView
      action={
        !authenticatedCustomerEmail && (
          <CheckoutSignInLinkView
            capabilities={{
              renderLink: (content, className) => (
                <Link
                  className={className}
                  params={marketParams}
                  search={{ redirect: checkoutPath }}
                  to="/$country/$locale/account/login"
                >
                  {content}
                </Link>
              ),
            }}
            model={{ label: t('account.signIn') }}
          />
        )
      }
      model={{
        contact: {
          disabled: Boolean(authenticatedCustomerEmail),
          error: deliveryForm.formState.errors.email?.message,
          label: t('account.email'),
          placeholder: t('account.emailPlaceholder'),
        },
        section: {
          errors: addressErrors,
          id: getCheckoutSectionElementId('address'),
          title: t('checkout.contactStep'),
        },
      }}
      fieldProps={deliveryForm.register('email')}
    />
  )
}
