import type { ReactNode } from 'react'

export function AccountOrderStatusDetailEmptyNotice({
  children,
  icon,
}: {
  children: ReactNode
  icon: ReactNode
}) {
  return (
    <div className="mt-6 flex gap-3 border border-border bg-muted px-4 py-4 text-muted-foreground">
      {icon}
      <p className="text-xs leading-6">{children}</p>
    </div>
  )
}

export function AccountOrderStatusDetailInfoBlock({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs leading-4 font-normal uppercase text-muted-foreground">
        {label}
      </p>
      <p className="text-xs leading-6 text-foreground">{value}</p>
    </div>
  )
}
