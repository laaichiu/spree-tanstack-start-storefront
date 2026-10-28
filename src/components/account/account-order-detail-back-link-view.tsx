import { ChevronLeft } from 'lucide-react'

import { accountTextLinkClassName } from './account-ui-view'

import type { ReactNode } from 'react'

export function AccountOrderDetailBackLinkView({
  label,
  renderLink,
}: {
  label: string
  renderLink: (props: { children: ReactNode; className: string }) => ReactNode
}) {
  return renderLink({
    children: (
      <>
        <ChevronLeft aria-hidden="true" className="h-3.5 w-3.5" />
        {label}
      </>
    ),
    className: accountTextLinkClassName,
  })
}
