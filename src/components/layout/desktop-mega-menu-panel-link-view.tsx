import type { ReactNode } from 'react'
import type { LayoutActionRenderer } from '../contracts/layout'

export function DesktopMegaMenuPanelLinkView({
  children,
  renderLink,
}: {
  children: ReactNode
  renderLink: LayoutActionRenderer
}) {
  return renderLink(
    children,
    "relative block w-fit max-w-full text-xs font-normal tracking-wider wrap-anywhere text-foreground uppercase after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:content-[''] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-[underline-active=true]:after:scale-x-100 motion-reduce:after:transition-none",
  )
}
