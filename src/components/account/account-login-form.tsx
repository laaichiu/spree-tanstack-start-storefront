import { Link } from '@tanstack/react-router'

import { useMarket } from '@/components/layout/market-provider'
import {
  accountAuthLabelClassName,
  accountInlineLinkClassName,
} from '@/components/account/account-ui-view'
import { AccountAuthFormView } from '@/components/account/account-auth-form-view'
import { AccountAuthMessageView } from '@/components/account/account-auth-message-view'
import { AccountEmailFieldView } from '@/components/account/account-email-field-view'
import { AccountLoginPasswordSectionView } from '@/components/account/account-login-password-section-view'
import { AccountPasswordFieldView } from '@/components/account/account-password-field-view'
import { AccountAuthSubmitButtonView } from '@/components/account/account-auth-submit-button-view'
import { usePasswordVisibility } from '@/components/account/use-password-visibility'
import { useAccountLoginFormController } from './use-account-login-form-controller'

export function AccountLoginForm({ redirectTo }: { redirectTo: string }) {
  const { market, t } = useMarket()
  const passwordVisibility = usePasswordVisibility()
  const { form, state } = useAccountLoginFormController({ redirectTo })
  const marketParams = {
    country: market.country,
    locale: market.locale,
  }
  return (
    <AccountAuthFormView onSubmit={form.submit}>
      {state.isError && (
        <AccountAuthMessageView
          message={t('account.loginUnavailableMessage')}
          tone="error"
        />
      )}

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

      <AccountLoginPasswordSectionView
        forgotPasswordLink={
          <Link
            className={accountInlineLinkClassName}
            params={marketParams}
            to="/$country/$locale/account/forgot-password"
          >
            {t('account.forgotPassword')}
          </Link>
        }
        passwordField={
          <AccountPasswordFieldView
            autoComplete="current-password"
            disabled={state.isPending}
            error={
              form.errors.password?.message && t('account.passwordRequired')
            }
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
        }
      />

      <AccountAuthSubmitButtonView
        disabled={state.isPending}
        label={state.isPending ? t('account.signingIn') : t('account.signIn')}
      />
    </AccountAuthFormView>
  )
}
