import '@spree/sdk'

// The integration backend registers Category#lft through Spree.ransack.
// Keep this declaration aligned with the documented backend initializer.
declare module '@spree/sdk' {
  interface CategorySortExtensions {
    lft: true
  }
}
