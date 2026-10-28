import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { SearchFormView } from './search-form-view'

afterEach(cleanup)

describe('SearchFormView', () => {
  it('delegates input changes and form submission directly', () => {
    const onChange = vi.fn()
    const onSubmit = vi.fn()

    render(
      <SearchFormView
        inputRef={{ current: null }}
        label="Search"
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder="Search products"
        submitLabel="View search results"
        value=""
      />,
    )

    const input = screen.getByRole('textbox', { name: 'Search' })

    fireEvent.change(input, { target: { value: 'Boots' } })
    fireEvent.submit(
      screen.getByRole('button', { name: 'View search results' }),
    )

    expect(onChange).toHaveBeenCalledWith('Boots')
    expect(onSubmit).toHaveBeenCalledTimes(1)
  })
})
