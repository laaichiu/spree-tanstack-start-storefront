type AccountProfileSummaryLabels = {
  accountInformation: string
  accountInformationDescription: string
  email: string
  name: string
  notProvided: string
  phone: string
  storeCredit: string
}

export type AccountProfileSummaryModel = {
  customer: {
    email: string
    name?: string
    phone?: string
    storeCredit?: string
  }
  labels: AccountProfileSummaryLabels
}

export type AccountProfileFormModel = {
  description: string
  errorMessage?: string
  isDirty: boolean
  isPending: boolean
  saveLabel: string
  savedMessage?: string
  savingLabel: string
  title: string
}
