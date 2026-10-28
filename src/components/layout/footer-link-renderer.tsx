import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'

import type { FooterLinkRenderer } from '@/components/contracts/layout'
import type { FooterConfigLink, FooterLegalLink } from '@/config/footer'
import { footerColumns, legalLinks } from '@/config/footer'

type FooterLinkConfig = FooterConfigLink | FooterLegalLink

export function createFooterLinkRenderer(marketParams: {
  country: string
  locale: string
}): FooterLinkRenderer {
  return (item, props) => {
    const link = findFooterLinkConfig(item.id)

    return link ? renderFooterLink(link, marketParams, props) : props.children
  }
}

function findFooterLinkConfig(id: string): FooterLinkConfig | undefined {
  for (const column of footerColumns) {
    const link = column.links.find((candidate) => candidate.labelKey === id)

    if (link) {
      return link
    }
  }

  return legalLinks.find((link) => link.policySlug === id)
}

function renderFooterLink(
  link: FooterLinkConfig,
  marketParams: { country: string; locale: string },
  { children, className }: { children: ReactNode; className: string },
): ReactNode {
  if (!('kind' in link)) {
    return (
      <Link
        className={className}
        params={{ ...marketParams, slug: link.policySlug }}
        to="/$country/$locale/policies/$slug"
      >
        {children}
      </Link>
    )
  }

  if (link.kind === 'internal') {
    const to = {
      account: '/$country/$locale/account',
      giftCards: '/$country/$locale/account/gift-cards',
      register: '/$country/$locale/account/register',
    }[link.target]

    return (
      <Link
        className={className}
        params={marketParams}
        preload={link.preload}
        to={to}
      >
        {children}
      </Link>
    )
  }

  if (link.kind === 'policy') {
    return (
      <Link
        className={className}
        params={{ ...marketParams, slug: link.policySlug }}
        to="/$country/$locale/policies/$slug"
      >
        {children}
      </Link>
    )
  }

  if (link.kind === 'external') {
    return (
      <a
        className={className}
        href={link.href}
        rel="noopener noreferrer"
        target="_blank"
      >
        {children}
      </a>
    )
  }

  return children
}
