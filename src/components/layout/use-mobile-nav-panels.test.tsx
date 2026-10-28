import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { useMobileNavPanels } from './use-mobile-nav-panels'

afterEach(cleanup)

describe('useMobileNavPanels', () => {
  it('resets nested category state when its context key changes', async () => {
    const category = {
      children: [],
      id: 'cat_women_us',
    }
    const { result, rerender } = renderHook(
      ({ resetKey }: { resetKey: string }) =>
        useMobileNavPanels({
          open: true,
          resetKey,
        }),
      { initialProps: { resetKey: 'us:en' } },
    )

    act(() => {
      result.current.actions.pushPanel({ category, kind: 'category' })
    })

    expect(result.current.state.panelStack).toHaveLength(2)
    expect(result.current.state.animatedIndex).toBe(0)

    rerender({ resetKey: 'de:de' })

    await waitFor(() => {
      expect(result.current.state.panelStack).toEqual([{ kind: 'main' }])
      expect(result.current.state.animatedIndex).toBe(0)
    })
  })

  it('ignores repeated back actions until the current panel finishes leaving', async () => {
    const category = {
      children: [],
      id: 'cat_women_us',
    }
    const { result } = renderHook(() =>
      useMobileNavPanels({
        open: true,
      }),
    )

    act(() => {
      result.current.actions.pushPanel({ category, kind: 'category' })
    })
    await waitFor(() => {
      expect(result.current.state.animatedIndex).toBe(1)
    })

    act(() => {
      result.current.actions.popPanel()
      result.current.actions.popPanel()
    })

    expect(result.current.state.animatedIndex).toBe(0)
    expect(result.current.state.isPopping).toBe(true)

    await waitFor(() => {
      expect(result.current.state.panelStack).toEqual([{ kind: 'main' }])
    })

    expect(result.current.state.animatedIndex).toBe(0)
    expect(result.current.state.isPopping).toBe(false)
  })
})
