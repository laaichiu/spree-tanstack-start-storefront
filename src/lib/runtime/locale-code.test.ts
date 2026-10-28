// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { toSpreeLocaleCode } from './locale-code'

describe('Spree locale request boundary', () => {
  it.each([
    ['zh-cn', 'zh-CN'],
    ['pt-br', 'pt-BR'],
    ['en_us', 'en-US'],
    ['es-419', 'es-419'],
    ['en', 'en'],
  ])('canonicalizes %s for Rails locale matching', (input, expected) => {
    expect(toSpreeLocaleCode(input)).toBe(expected)
  })
  it('rejects a malformed locale', () => {
    expect(() => toSpreeLocaleCode('not a locale')).toThrow()
  })
})
