import { z } from 'zod'

import { isCountryCode, isLocaleCode } from './market-format'

export const marketInputSchema = z.object({
  country: z.string().trim().refine(isCountryCode),
  locale: z.string().trim().refine(isLocaleCode),
})
