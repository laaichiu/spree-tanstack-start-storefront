import { ArrowRight, Search } from 'lucide-react'
import type { ChangeEvent, FormEvent, KeyboardEvent, RefObject } from 'react'

import { Button } from '@/components/ui/button'

export function SearchFormView({
  inputRef,
  label,
  onChange,
  onSubmit,
  placeholder,
  submitLabel,
  value,
}: {
  inputRef: RefObject<HTMLInputElement | null>
  label: string
  onChange: (query: string) => void
  onSubmit: () => void
  placeholder: string
  submitLabel: string
  value: string
}) {
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    onSubmit()
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form className="px-5 sm:px-6" onSubmit={handleSubmit}>
      <label className="sr-only" htmlFor="storefront-search-input">
        {label}
      </label>
      <div className="flex items-center gap-3 border-b border-border bg-transparent pb-3 text-foreground transition-colors motion-reduce:transition-none hover:not-focus-within:border-b-foreground/40 focus-within:border-b-foreground">
        <Search
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-muted-foreground"
        />
        <input
          className="text-base leading-6 w-full border-none bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
          id="storefront-search-input"
          inputMode="search"
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          ref={inputRef}
          type="text"
          value={value}
        />
        <Button variant="icon" aria-label={submitLabel} type="submit">
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </Button>
      </div>
    </form>
  )
}
