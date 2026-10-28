import { useMarket } from '@/components/layout/market-provider'
import {
  PRODUCT_REVIEW_MAX_MEDIA_COUNT,
  PRODUCT_REVIEW_MEDIA_CONTENT_TYPES,
} from '@/lib/reviews/contracts'
import {
  isReviewImageContentType,
  isReviewImageSizeAllowed,
} from '@/lib/reviews/review-media-policy'
import { ReviewMediaPickerView } from './review-media-picker-view'

const REVIEW_IMAGE_ACCEPT = PRODUCT_REVIEW_MEDIA_CONTENT_TYPES.join(',')

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
    const availableSlots = PRODUCT_REVIEW_MAX_MEDIA_COUNT - files.length
    const invalid =
      nextFiles.length > availableSlots ||
      nextFiles.some(
        (file) =>
          !isReviewImageContentType(file.type) ||
          !isReviewImageSizeAllowed(file.size),
      )

    if (invalid) {
      onError(t('reviews.photoInvalid'))
      return
    }

    onChange([...files, ...nextFiles])
  }

  return (
    <ReviewMediaPickerView
      model={{
        accept: REVIEW_IMAGE_ACCEPT,
        files,
        labels: {
          addPhotos: t('reviews.addPhotos'),
          cancel: t('reviews.cancel'),
        },
        maxFiles: PRODUCT_REVIEW_MAX_MEDIA_COUNT,
      }}
      actions={{
        addFiles,
        removeFile: (index) =>
          onChange(files.filter((_, fileIndex) => fileIndex !== index)),
      }}
    />
  )
}
