import type { ReactNode } from 'react'
import type { FooterLinkCapabilities } from '../contracts/layout'

export type { FooterLinkCapabilities } from '../contracts/layout'

export function FooterLinkView({
  capabilities,
  children,
}: {
  capabilities?: FooterLinkCapabilities
  children: ReactNode
}) {
  if (!capabilities) {
    return (
      <span className="text-xs leading-4 font-normal uppercase text-foreground">
        {children}
      </span>
    )
  }

  return capabilities.renderLink(
    children,
    "relative inline-block w-fit text-xs leading-4 font-normal text-foreground uppercase after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:content-[''] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-[underline-active=true]:after:scale-x-100 motion-reduce:after:transition-none",
  )
}
