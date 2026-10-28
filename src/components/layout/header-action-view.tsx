import { Search, ShoppingBag, User } from 'lucide-react'
import type { ReactNode } from 'react'

import { buttonClassName } from '@/components/ui/button'
import { cn } from '@/components/ui/utils'
import type { LayoutActionRenderer } from '../contracts/layout'

const actionIcons = {
  account: User,
  cart: ShoppingBag,
  search: Search,
}

export function HeaderDesktopActionView({
  children,
  renderAction,
  withLeadingSpacing = false,
}: {
  children: ReactNode
  renderAction: LayoutActionRenderer
  withLeadingSpacing?: boolean
}) {
  return renderAction(
    children,
    cn(
      "relative inline-flex h-12 items-center whitespace-nowrap text-xs leading-4 font-normal text-foreground uppercase after:absolute after:bottom-[0.6rem] after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:content-[''] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-[underline-active=true]:after:scale-x-100 motion-reduce:after:transition-none",
      withLeadingSpacing && 'ml-5',
      'hidden xl:inline-flex',
    ),
  )
}

export function HeaderMobileActionView({
  count,
  icon,
  renderAction,
}: {
  count?: number
  icon: 'account' | 'cart' | 'search'
  renderAction: LayoutActionRenderer
}) {
  const Icon = actionIcons[icon]
  const className = buttonClassName({
    variant: 'icon',
    className: cn(
      'rounded-sm xl:hidden',
      icon === 'account' && 'hidden md:inline-flex',
    ),
  })
  const showCartCount = icon === 'cart' && count !== undefined && count > 0

  return renderAction(
    <>
      <Icon aria-hidden="true" className="h-5 w-5" />
      {showCartCount && (
        <span className="pointer-events-none absolute -top-2 -right-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-foreground px-1 text-xs font-semibold text-background">
          {count}
        </span>
      )}
    </>,
    className,
  )
}
