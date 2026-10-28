import { accountAuthLabelClassName } from '@/components/account/account-ui-view'
import { AccountAuthFormView } from '@/components/account/account-auth-form-view'
import { AccountAuthMessageView } from '@/components/account/account-auth-message-view'
import { AccountEmailFieldView } from '@/components/account/account-email-field-view'
import { AccountMarketingConsentView } from '@/components/account/account-marketing-consent-view'
import { AccountRegisterNameFieldsView } from '@/components/account/account-register-name-fields-view'
import { AccountPasswordFieldView } from '@/components/account/account-password-field-view'
import { AccountAuthSubmitButtonView } from '@/components/account/account-auth-submit-button-view'
import { usePasswordVisibility } from '@/components/account/use-password-visibility'
import { useMarket } from '@/components/layout/market-provider'
import { useAccountRegisterFormController } from './use-account-register-form-controller'

export function AccountRegisterForm() {
  const { t } = useMarket()
  const passwordVisibility = usePasswordVisibility()
  const passwordConfirmationVisibility = usePasswordVisibility()
  const { form, state } = useAccountRegisterFormController()

  return (
    <AccountAuthFormView onSubmit={form.submit}>
      {state.isError && (
        <AccountAuthMessageView
          message={t('account.registerUnavailableMessage')}
          tone="error"
        />
      )}

      <AccountRegisterNameFieldsView
        firstName={{
          ...form.register('firstName'),
          autoComplete: 'given-name',
          disabled: state.isPending,
          error:
            form.errors.firstName?.message && t('account.firstNameRequired'),
          label: t('account.firstName'),
          placeholder: t('account.firstNamePlaceholder'),
          type: 'text',
        }}
        lastName={{
          ...form.register('lastName'),
          autoComplete: 'family-name',
          disabled: state.isPending,
          error: form.errors.lastName?.message && t('account.lastNameRequired'),
          label: t('account.lastName'),
          placeholder: t('account.lastNamePlaceholder'),
          type: 'text',
        }}
      />

      <AccountEmailFieldView
        {...form.register('email')}
        autoComplete="email"
        disabled={state.isPending}
        error={form.errors.email?.message && t('account.invalidEmail')}
        inputMode="email"
        label={t('account.email')}
        placeholder={t('account.emailPlaceholder')}
        type="email"
      />

      <AccountPasswordFieldView
        autoComplete="new-password"
        disabled={state.isPending}
        error={form.errors.password?.message && t('account.passwordMinLength')}
        label={t('account.password')}
        labelClassName={accountAuthLabelClassName}
        ariaLabel={
          passwordVisibility.isVisible
            ? t('account.hidePassword')
            : t('account.showPassword')
        }
        isVisible={passwordVisibility.isVisible}
        onToggle={passwordVisibility.toggle}
        type={passwordVisibility.isVisible ? 'text' : 'password'}
        {...form.register('password')}
      />

      <AccountPasswordFieldView
        autoComplete="new-password"
        disabled={state.isPending}
        error={
          form.errors.passwordConfirmation?.message &&
          t('account.passwordsDoNotMatch')
        }
        label={t('account.passwordConfirmation')}
        labelClassName={accountAuthLabelClassName}
        ariaLabel={
          passwordConfirmationVisibility.isVisible
            ? t('account.hidePassword')
            : t('account.showPassword')
        }
        isVisible={passwordConfirmationVisibility.isVisible}
        onToggle={passwordConfirmationVisibility.toggle}
        type={passwordConfirmationVisibility.isVisible ? 'text' : 'password'}
        {...form.register('passwordConfirmation')}
      />

      <AccountMarketingConsentView
        checked={form.marketingField.value}
        disabled={state.isPending}
        label={t('account.marketingOptIn')}
        onChange={form.marketingField.onChange}
        description={t('account.marketingOptInDescription')}
      />

      <AccountAuthSubmitButtonView
        disabled={state.isPending}
        label={
          state.isPending
            ? t('account.creatingAccount')
            : t('account.createAccount')
        }
      />
    </AccountAuthFormView>
  )
}
