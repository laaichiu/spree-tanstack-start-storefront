import { ImagePlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CloseIcon } from '@/components/ui/close-icon'
import type {
  ReviewMediaPickerActions,
  ReviewMediaPickerModel,
} from '../contracts/reviews'

export type {
  ReviewMediaPickerActions,
  ReviewMediaPickerModel,
} from '../contracts/reviews'

export function ReviewMediaPickerView({
  actions,
  model,
}: {
  actions: ReviewMediaPickerActions
  model: ReviewMediaPickerModel
}) {
  const { accept, files, labels, maxFiles } = model
  const atLimit = files.length >= maxFiles

  return (
    <div>
      <label
        className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-sm border border-input bg-background px-4 text-xs font-normal text-foreground uppercase transition-colors motion-reduce:transition-none hover:not-focus-within:border-foreground/40 focus-within:border-foreground ${
          atLimit ? 'pointer-events-none cursor-not-allowed opacity-55' : ''
        }`}
      >
        <ImagePlus aria-hidden="true" className="h-4 w-4" />
        {labels.addPhotos} ({files.length}/{maxFiles})
        <input
          accept={accept}
          className="sr-only"
          disabled={atLimit}
          multiple
          onChange={(event) => {
            actions.addFiles(Array.from(event.currentTarget.files ?? []))
            event.currentTarget.value = ''
          }}
          type="file"
        />
      </label>
      {files.length ? (
        <ul className="mt-3 space-y-3">
          {files.map((file, index) => (
            <li
              className="flex items-center justify-between gap-3 border border-border bg-muted px-3 py-2 text-xs"
              key={`${file.name}-${file.size}-${index}`}
            >
              <span className="min-w-0 truncate">{file.name}</span>
              <Button
                variant="icon"
                aria-label={`${labels.cancel} ${file.name}`}
                className="text-muted-foreground hover:text-foreground"
                onClick={() => actions.removeFile(index)}
                type="button"
              >
                <CloseIcon className="size-2.5" />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
