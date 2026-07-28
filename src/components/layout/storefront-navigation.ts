export type StorefrontCategoryLink = {
  featuredSlug: string
  labelKey: string
  searchLabelKey: string
  slug: string
}

export const storefrontCategoryLinks = [
  {
    featuredSlug: 'kitchen/coffee-machines',
    labelKey: 'navigation.kitchen',
    searchLabelKey: 'navigation.coffeeMachines',
    slug: 'kitchen',
  },
  {
    featuredSlug: 'air-climate/air-purifiers',
    labelKey: 'navigation.airClimate',
    searchLabelKey: 'navigation.airPurifiers',
    slug: 'air-climate',
  },
  {
    featuredSlug: 'garment-care/steam-generators',
    labelKey: 'navigation.garmentCare',
    searchLabelKey: 'navigation.steamGenerators',
    slug: 'garment-care',
  },
  {
    featuredSlug: 'floor-care/cordless-vacuums',
    labelKey: 'navigation.floorCare',
    searchLabelKey: 'navigation.cordlessVacuums',
    slug: 'floor-care',
  },
  {
    featuredSlug: 'personal-care/hair-dryers',
    labelKey: 'navigation.personalCare',
    searchLabelKey: 'navigation.hairDryers',
    slug: 'personal-care',
  },
] as const satisfies readonly StorefrontCategoryLink[]
