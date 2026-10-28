import { CircleAlert, CircleCheck } from 'lucide-react'
import type { ReactNode } from 'react'

import { buttonClassName } from '@/components/ui/button'
import type { NewsletterVerificationStatus } from '@/lib/newsletter/contracts'

import { AccountAuthShellView } from '@/components/account/account-auth-shell-view'
import type {
  NewsletterVerificationCopy,
  NewsletterVerificationPageProps,
} from './newsletter-verification-types'

export type {
  NewsletterVerificationCopy,
  NewsletterVerificationLink,
  NewsletterVerificationLinks,
  NewsletterVerificationPageModel,
  NewsletterVerificationPageProps,
} from './newsletter-verification-types'

export function NewsletterVerificationContent({
  links,
  model,
}: NewsletterVerificationPageProps) {
  const { copy, status } = model

  if (status === 'verified') {
    return (
      <AccountAuthShellView
        model={{
          description: copy.successDescription,
          title: copy.successTitle,
        }}
        supportingContent={
          <p>
            {links.signIn({
              children: copy.signIn,
              className:
                'text-xs font-normal text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            })}{' '}
            {copy.signInHint}
          </p>
        }
      >
        <div className="space-y-5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border bg-muted text-foreground">
            <CircleCheck aria-hidden="true" className="h-5 w-5" />
          </div>
          {links.continueShopping({
            children: copy.continueShopping,
            className: buttonClassName({ size: 'lg' }),
          })}
        </div>
      </AccountAuthShellView>
    )
  }

  const noticeCopy = getNoticeCopy(status, copy)

  return (
    <NewsletterVerificationNotice
      continueShopping={links.continueShopping({
        children: copy.continueShopping,
        className: buttonClassName({ size: 'lg' }),
      })}
      description={noticeCopy.description}
      title={noticeCopy.title}
    />
  )
}

function getNoticeCopy(
  status: Exclude<NewsletterVerificationStatus, 'verified'>,
  copy: NewsletterVerificationCopy,
) {
  if (status === 'unsupported') {
    return {
      description: copy.unsupportedDescription,
      title: copy.unsupportedTitle,
    }
  }

  if (status === 'unavailable') {
    return {
      description: copy.unavailableDescription,
      title: copy.unavailableTitle,
    }
  }

  return {
    description: copy.invalidDescription,
    title: copy.invalidTitle,
  }
}

function NewsletterVerificationNotice({
  continueShopping,
  description,
  title,
}: {
  continueShopping: ReactNode
  description: string
  title: string
}) {
  return (
    <AccountAuthShellView model={{ description, title }}>
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center border border-border text-muted-foreground">
          <CircleAlert aria-hidden="true" className="h-5 w-5" />
        </div>
        {continueShopping}
      </div>
    </AccountAuthShellView>
  )
}
