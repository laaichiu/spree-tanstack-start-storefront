// @vitest-environment node

import { describe, expect, it } from 'vitest'

import {
  assertReviewListResponse,
  ReviewListResponseTypeMismatchError,
} from './review-list-response'

describe('review list response boundary', () => {
  it('accepts the Spree pagination metadata shape', () => {
    expect(() =>
      assertReviewListResponse({
        data: [],
        meta: {
          count: 0,
          limit: 10,
          next: null,
          page: 1,
          pages: 0,
          previous: null,
        },
      }),
    ).not.toThrow()
  })

  it.each([
    null,
    [],
    'response',
    123,
    {},
    { data: null },
    { data: {} },
    { data: [] },
    { data: [], meta: {} },
    {
      data: [],
      meta: {
        count: 1.5,
        limit: 10,
        next: null,
        page: 1,
        pages: 1,
        previous: null,
      },
    },
    {
      data: [],
      meta: {
        count: 1,
        limit: '10',
        next: null,
        page: 1,
        pages: 1,
        previous: null,
      },
    },
    {
      data: [],
      meta: {
        count: 1,
        limit: 10,
        next: 0,
        page: 1,
        pages: 1,
        previous: null,
      },
    },
  ])('rejects a malformed list response: %s', (response) => {
    expect(() => assertReviewListResponse(response)).toThrow(
      ReviewListResponseTypeMismatchError,
    )
  })
})
