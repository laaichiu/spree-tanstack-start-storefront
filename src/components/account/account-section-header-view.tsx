import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { AccountPageHeader } from './account-ui-view'
import type { AccountSectionHeaderModel } from '@/components/contracts/account'

export type { AccountSectionHeaderModel } from '@/components/contracts/account'

export function AccountSectionHeaderView({
  model,
  onSignOut,
}: {
  model: AccountSectionHeaderModel
  onSignOut: () => void | Promise<void>
}) {
  return (
    <AccountPageHeader
      action={
        <Button
          disabled={model.isSigningOut}
          onClick={() => void onSignOut()}
          type="button"
          variant="secondary"
        >
          <LogOut aria-hidden="true" className="h-4 w-4" />
          {model.isSigningOut ? model.labels.signingOut : model.labels.signOut}
        </Button>
      }
      description={model.email}
      label={model.label}
      title={model.title}
    />
  )
}
