// @vitest-environment node

import { describe, expect, it } from 'vitest'

import type { ProductImage } from './product'
import { getVisibleProductImagesForVariant } from './product-media-selection'

function image(id: string, variantIds: string[] = []): ProductImage {
  return {
    alt: id,
    id,
    src: `https://example.com/${id}.jpg`,
    variantIds,
  }
}

describe('catalog product media selection', () => {
  it('keeps the selected variant media when it exists', () => {
    const shared = image('shared')
    const selected = image('selected', ['variant_selected'])
    const sibling = image('sibling', ['variant_sibling'])

    expect(
      getVisibleProductImagesForVariant(
        [shared, selected, sibling],
        'variant_selected',
      ),
    ).toEqual([selected])
  })

  it('uses shared product media when the selected variant has no media', () => {
    const shared = image('shared')
    const sibling = image('sibling', ['variant_sibling'])

    expect(
      getVisibleProductImagesForVariant([shared, sibling], 'variant_selected'),
    ).toEqual([shared])
  })

  it('does not show sibling variant media as a fallback', () => {
    const sibling = image('sibling', ['variant_sibling'])

    expect(
      getVisibleProductImagesForVariant([sibling], 'variant_selected'),
    ).toEqual([])
  })

  it('keeps the complete gallery when no variant is selected', () => {
    const images = [image('shared'), image('sibling', ['variant_sibling'])]

    expect(getVisibleProductImagesForVariant(images, null)).toBe(images)
  })
})
