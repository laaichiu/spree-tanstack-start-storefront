import { CircleAlert } from 'lucide-react'

export function AccountSessionErrorView({ message }: { message: string }) {
  return (
    <>
      <CircleAlert aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </>
  )
}
