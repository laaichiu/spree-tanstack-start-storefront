import type { ReactNode } from 'react'

export function AccountLoginPasswordSectionView({
  forgotPasswordLink,
  passwordField,
}: {
  forgotPasswordLink: ReactNode
  passwordField: ReactNode
}) {
  return (
    <div className="space-y-2">
      {passwordField}
      <div className="flex justify-end">{forgotPasswordLink}</div>
    </div>
  )
}
