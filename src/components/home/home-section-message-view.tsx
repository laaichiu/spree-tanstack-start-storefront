type HomeSectionMessageViewProps = {
  description: string
  title: string
}

export function HomeSectionMessageView({
  description,
  title,
}: HomeSectionMessageViewProps) {
  return (
    <div className="mx-4 mb-4 border border-dashed border-foreground/30 bg-muted p-8">
      <p className="text-xs leading-4 font-normal text-foreground uppercase">
        {title}
      </p>
      <p className="mt-3 text-xs leading-6 text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
