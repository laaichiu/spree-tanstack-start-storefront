import type { ProductReviewMediaLightboxDisplay } from '@/components/reviews/review-media-lightbox-model'

export type ReviewMediaPickerModel = {
  accept: string
  files: readonly File[]
  labels: {
    addPhotos: string
    cancel: string
  }
  maxFiles: number
}

export type ReviewMediaPickerActions = {
  addFiles: (files: File[]) => void
  removeFile: (index: number) => void
}

export type ReviewMediaGalleryStatus = 'error' | 'loading' | 'ready'

export type ReviewMediaLightboxModel = {
  galleryStatus: ReviewMediaGalleryStatus
  items: readonly ProductReviewMediaLightboxDisplay[]
  labels: {
    anonymous: string
    closePhotoGallery: string
    customerPhoto: string
    loadFailedDescription: string
    loading: string
    nextPhoto: string
    openPhoto: string
    photoGallery: string
    previousPhoto: string
    purchasedOptions: string
    verifiedBuyer: string
  }
  selectedId: string | null
}

export type ReviewMediaLightboxActions = {
  close: () => void
  selectId: (id: string) => void
}
