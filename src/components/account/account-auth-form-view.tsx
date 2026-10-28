import type { FormEventHandler, ReactNode } from 'react'

export function AccountAuthFormView({
  children,
  onSubmit,
}: {
  children: ReactNode
  onSubmit: FormEventHandler<HTMLFormElement>
}) {
  return (
    <form className="space-y-5" onSubmit={onSubmit}>
      {children}
    </form>
  )
}
