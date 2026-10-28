import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  MobileNavCategoryPanelView,
  MobileNavPanelsView,
} from './mobile-nav-panels-view'

afterEach(cleanup)

describe('MobileNavCategoryPanelView', () => {
  it('delegates back navigation and labels the category links', () => {
    const onBack = vi.fn()

    render(
      <MobileNavCategoryPanelView
        backLabel="Back"
        categoryLinks={<a href="/women/dresses">Dresses</a>}
        onBack={onBack}
        title="Women"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Back' }))

    expect(onBack).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('navigation', { name: 'Women' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Dresses' })).toBeTruthy()
  })
})

describe('MobileNavPanelsView', () => {
  it('renders the main panel passed to the outer panel view', () => {
    render(
      <MobileNavPanelsView
        animatedIndex={0}
        isPopping={false}
        isNestedPanel={false}
        mainPanel={<nav aria-label="Categories">Category links</nav>}
        nestedPanels={[]}
      />,
    )

    expect(
      screen.getByRole('navigation', { name: 'Categories' }).textContent,
    ).toContain('Category links')
  })

  it('keeps the previous panel visible while the current panel leaves on back', () => {
    render(
      <MobileNavPanelsView
        animatedIndex={1}
        isPopping
        isNestedPanel
        mainPanel={<div data-testid="main-panel">Main</div>}
        nestedPanels={[
          {
            content: <div data-testid="category-women">category-women</div>,
            id: 'category-women',
            stackIndex: 1,
          },
          {
            content: <div data-testid="category-dresses">category-dresses</div>,
            id: 'category-dresses',
            stackIndex: 2,
          },
        ]}
      />,
    )

    expect(
      screen.getByTestId('category-women').parentElement?.className,
    ).toContain('translate-x-0')
    expect(
      screen.getByTestId('category-dresses').parentElement?.className,
    ).toContain('translate-x-full')
  })
})
