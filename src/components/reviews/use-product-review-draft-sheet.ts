import { useCallback, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export type ProductReviewDraftSheetState<T> = {
  close: () => void
  draft: T
  isOpen: boolean
  open: () => void
  setDraft: Dispatch<SetStateAction<T>>
  setOpen: (open: boolean) => void
}

export function useProductReviewDraftSheet<T>({
  clone,
  value,
}: {
  clone: (value: T) => T
  value: T
}): ProductReviewDraftSheetState<T> {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<T>(() => clone(value))

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (nextOpen) {
        setDraft(clone(value))
      }

      setIsOpen(nextOpen)
    },
    [clone, value],
  )
  const open = useCallback(() => setOpen(true), [setOpen])
  const close = useCallback(() => setOpen(false), [setOpen])

  return { close, draft, isOpen, open, setDraft, setOpen }
}
