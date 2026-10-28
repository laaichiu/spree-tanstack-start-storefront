import type { ReactNode } from 'react'
import type { LayoutLinkRenderer } from '../contracts/layout'

export function DesktopMegaMenuLinkView({
  children,
  renderLink,
  tone,
}: {
  children: ReactNode
  renderLink: LayoutLinkRenderer
  tone: 'default' | 'sale'
}) {
  return renderLink(
    children,
    `relative inline-flex h-12 items-center whitespace-nowrap text-xs leading-4 font-normal uppercase after:absolute after:bottom-[0.6rem] after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:content-[''] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-[underline-active=true]:after:scale-x-100 motion-reduce:after:transition-none ${tone === 'sale' ? 'text-destructive' : 'text-foreground'}`,
  )
}
