import { ImagePlus, X } from 'lucide-react'

import { useMarket } from '@/components/layout/market-provider'
import { cn } from '@/lib/utils'

const REVIEW_IMAGE_TYPES = new Set([
  'image/avif',
  'image/jpeg',
  'image/png',
  'image/webp',
])
const MAX_REVIEW_IMAGES = 5
const MAX_REVIEW_IMAGE_BYTES = 10 * 1024 * 1024

export function ReviewMediaPicker({
  files,
  onChange,
  onError,
}: {
  files: File[]
  onChange: (files: File[]) => void
  onError: (error: string | null) => void
}) {
  const { t } = useMarket()

  function addFiles(nextFiles: File[]) {
    onError(null)
    const availableSlots = MAX_REVIEW_IMAGES - files.length
    const accepted = nextFiles.slice(0, availableSlots)
    const invalid =
      nextFiles.length > availableSlots ||
      accepted.some(
        (file) =>
          !REVIEW_IMAGE_TYPES.has(file.type) ||
          file.size <= 0 ||
          file.size > MAX_REVIEW_IMAGE_BYTES,
      )

    if (invalid) {
      onError(t('reviews.photoInvalid'))
      return
    }

    onChange([...files, ...accepted])
  }

  return (
    <div>
      <label
        className={cn(
          'inline-flex h-10 cursor-pointer items-center gap-2 rounded-sm border border-border px-4 text-sm font-normal uppercase text-foreground transition-colors hover:border-foreground focus-within:focus-ring',
          files.length >= MAX_REVIEW_IMAGES &&
            'pointer-events-none cursor-not-allowed opacity-55',
        )}
      >
        <ImagePlus aria-hidden="true" className="h-4 w-4" />
        {t('reviews.addPhotos')} ({files.length}/{MAX_REVIEW_IMAGES})
        <input
          accept={[...REVIEW_IMAGE_TYPES].join(',')}
          className="sr-only"
          disabled={files.length >= MAX_REVIEW_IMAGES}
          multiple
          onChange={(event) => {
            addFiles(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
          type="file"
        />
      </label>
      {files.length ? (
        <ul className="mt-3 space-y-2">
          {files.map((file, index) => (
            <li
              className="flex items-center justify-between gap-3 border border-border bg-muted px-3 py-2 text-sm"
              key={`${file.name}-${file.size}-${index}`}
            >
              <span className="min-w-0 truncate">{file.name}</span>
              <button
                aria-label={`${t('reviews.cancel')} ${file.name}`}
                className="rounded-sm p-1 text-muted-foreground hover:text-foreground focus-visible:focus-ring"
                onClick={() =>
                  onChange(files.filter((_, fileIndex) => fileIndex !== index))
                }
                type="button"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
