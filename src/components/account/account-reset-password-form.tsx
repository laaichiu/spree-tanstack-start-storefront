import { Link } from '@tanstack/react-router'

import {
  accountAuthLabelClassName,
  accountInlineLinkClassName,
} from '@/components/account/account-ui-view'
import { AccountAuthFormView } from '@/components/account/account-auth-form-view'
import { AccountAuthMessageView } from '@/components/account/account-auth-message-view'
import { AccountPasswordFieldView } from '@/components/account/account-password-field-view'
import { AccountAuthSubmitButtonView } from '@/components/account/account-auth-submit-button-view'
import { AccountPasswordResetSuccessView } from '@/components/account/account-password-reset-success-view'
import { useMarket } from '@/components/layout/market-provider'
import { usePasswordVisibility } from '@/components/account/use-password-visibility'
import { useAccountResetPasswordFormController } from './use-account-reset-password-form-controller'

export function AccountResetPasswordForm({ token }: { token: string }) {
  const { market, t } = useMarket()
  const passwordVisibility = usePasswordVisibility()
  const passwordConfirmationVisibility = usePasswordVisibility()
  const { form, state } = useAccountResetPasswordFormController({ token })
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  if (state.isSuccess) {
    return (
      <AccountPasswordResetSuccessView
        description={t('account.passwordResetSuccessDescription')}
        signInLink={
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/login"
          >
            {t('account.signIn')}
          </Link>
        }
      />
    )
  }

  return (
    <AccountAuthFormView onSubmit={form.submit}>
      {state.isError && (
        <AccountAuthMessageView
          message={t('account.passwordResetUnavailableMessage')}
          tone="error"
        />
      )}

      <input type="hidden" {...form.register('token')} />

      <AccountPasswordFieldView
        autoComplete="new-password"
        disabled={state.isPending}
        error={form.errors.password?.message && t('account.passwordMinLength')}
        label={t('account.newPassword')}
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
        label={t('account.confirmPassword')}
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

      <AccountAuthSubmitButtonView
        disabled={state.isPending}
        label={
          state.isPending
            ? t('account.resettingPassword')
            : t('account.resetPassword')
        }
      />
    </AccountAuthFormView>
  )
}
