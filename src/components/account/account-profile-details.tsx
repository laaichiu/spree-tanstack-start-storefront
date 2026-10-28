import { useMarket } from '@/components/layout/market-provider'
import type { CustomerProfile } from '@/lib/account/contracts'
import { getCustomerDisplayName } from '@/components/account/account-profile-display'
import { AccountProfileFormView } from '@/components/account/account-profile-form-view'
import { AccountProfileSummaryView } from '@/components/account/account-profile-summary-view'
import { useAccountProfileFormController } from './use-account-profile-form-controller'

export function AccountProfileDetails() {
  const { t } = useMarket()
  const { customer, form, state, submit } = useAccountProfileFormController()

  return (
    <div className="grid gap-6 xl:grid-cols-5">
      <AccountProfileFormView
        onSubmit={form.handleSubmit(submit)}
        fields={{
          email: {
            ...form.register('email'),
            autoComplete: 'email',
            disabled: state.isPending,
            error: form.errors.email?.message && t('account.invalidEmail'),
            inputMode: 'email',
            label: t('account.email'),
            placeholder: t('account.emailPlaceholder'),
            type: 'email',
          },
          firstName: {
            ...form.register('firstName'),
            autoComplete: 'given-name',
            disabled: state.isPending,
            label: t('account.firstName'),
            placeholder: t('account.firstNamePlaceholder'),
            type: 'text',
          },
          lastName: {
            ...form.register('lastName'),
            autoComplete: 'family-name',
            disabled: state.isPending,
            label: t('account.lastName'),
            placeholder: t('account.lastNamePlaceholder'),
            type: 'text',
          },
          marketing: {
            checked: form.marketingField.value,
            description: t('account.profileMarketingOptInDescription'),
            disabled: state.isPending,
            label: t('account.marketingOptIn'),
            onChange: (value) => form.marketingField.onChange(value),
          },
          phone: {
            ...form.register('phone'),
            autoComplete: 'tel',
            disabled: state.isPending,
            inputMode: 'tel',
            label: t('account.phone'),
            placeholder: t('account.phonePlaceholder'),
            type: 'tel',
          },
        }}
        model={{
          description: t('account.profileDescription'),
          errorMessage: state.error
            ? t('account.profileUpdateFailed')
            : undefined,
          isDirty: form.isDirty,
          isPending: state.isPending,
          saveLabel: t('account.saveProfile'),
          savedMessage: state.savedMessageVisible
            ? t('account.profileSaved')
            : undefined,
          savingLabel: t('account.savingProfile'),
          title: t('account.profile'),
        }}
      />
      <AccountProfileSummaryView
        model={{
          customer: getAccountProfileSummary(customer),
          labels: {
            accountInformation: t('account.accountInformation'),
            accountInformationDescription: t(
              'account.accountInformationDescription',
            ),
            email: t('account.email'),
            name: t('account.name'),
            notProvided: t('account.notProvided'),
            phone: t('account.phone'),
            storeCredit: t('account.storeCredit'),
          },
        }}
      />
    </div>
  )
}

function getAccountProfileSummary(customer: CustomerProfile) {
  return {
    email: customer.email,
    name: getCustomerDisplayName(customer),
    phone: customer.phone?.trim() || undefined,
    storeCredit: customer.displayAvailableStoreCreditTotal ?? undefined,
  }
}
