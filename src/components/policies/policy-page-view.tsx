import { PageHeadingView } from '@/components/shared/page-heading-view'

export type PolicyPageModel = {
  content: string
  eyebrow: string
  title: string
}

export function PolicyPageView({ model }: { model: PolicyPageModel }) {
  return (
    <>
      <PageHeadingView model={{ eyebrow: model.eyebrow, title: model.title }} />
      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="max-w-3xl border-t border-border pt-8">
          <p className="text-xs leading-7 text-muted-foreground">
            {model.content}
          </p>
        </div>
      </section>
    </>
  )
}
