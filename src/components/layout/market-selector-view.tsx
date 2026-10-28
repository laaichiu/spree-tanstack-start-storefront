import { Button } from '@/components/ui/button'
import {
  DialogContent,
  DialogRoot,
  DialogTrigger,
} from '@/components/ui/dialog'
import { NativeSelect } from '@/components/ui/native-select'
import { cn } from '@/components/ui/utils'

import type {
  MarketSelectorProps,
  MarketSelectorTriggerProps,
} from '../contracts/layout'

export type {
  MarketSelectorOption,
  MarketSelectorActions,
  MarketSelectorModel,
  MarketSelectorProps,
  MarketSelectorTriggerProps,
} from '../contracts/layout'

export function MarketSelectorTriggerView({
  countryFlag,
  currencyCode,
  localeLabel,
}: MarketSelectorTriggerProps) {
  return (
    <span className="flex cursor-pointer items-center gap-2 text-xs leading-none font-semibold tracking-wider text-foreground uppercase">
      {countryFlag}
      <span aria-hidden="true" className="h-3 w-px bg-muted-foreground" />
      <span>{localeLabel}</span>
      <span aria-hidden="true" className="h-3 w-px bg-muted-foreground" />
      <span>{currencyCode}</span>
    </span>
  )
}

export function MarketSelectorView({
  actions,
  className,
  model,
  trigger,
}: MarketSelectorProps) {
  const {
    applyLabel,
    closeLabel,
    countryLabel,
    countryOptions,
    description,
    draftCountry,
    draftLocale,
    hasSelectedMarket,
    isSwitchingMarket,
    languageLabel,
    localeOptions,
    open,
    switchError,
    title,
    variant,
  } = model
  const { apply, countryChange, localeChange, openChange } = actions
  const triggerClasses =
    variant === 'menu'
      ? 'flex w-full items-center justify-center border-t border-border px-6 py-5 text-center transition-opacity hover:opacity-70'
      : "relative inline-flex items-center pb-1 text-left after:absolute after:bottom-0 after:left-0 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:content-[''] after:transition-transform after:duration-500 after:ease-in-out hover:after:origin-left hover:after:scale-x-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:after:origin-left focus-visible:after:scale-x-100 data-[underline-active=true]:after:scale-x-100 motion-reduce:after:transition-none"

  return (
    <DialogRoot onOpenChange={openChange} open={open}>
      <DialogTrigger
        aria-label={title}
        className={cn(triggerClasses, className)}
        type="button"
      >
        {trigger}
      </DialogTrigger>

      <DialogContent
        backdropClassName={variant === 'menu' ? 'z-[70]' : undefined}
        closeLabel={closeLabel}
        className={variant === 'menu' ? 'z-[80]' : undefined}
        description={description}
        forceBackdrop={variant === 'menu'}
        title={title}
      >
        <div className="mt-7 space-y-5">
          <NativeSelect
            id="market-country"
            label={countryLabel}
            onValueChange={countryChange}
            options={[...countryOptions]}
            value={draftCountry}
          />

          <NativeSelect
            id="market-locale"
            label={languageLabel}
            onValueChange={localeChange}
            options={[...localeOptions]}
            value={draftLocale}
          />
        </div>

        <div className="mt-7">
          {switchError && (
            <p className="mb-4 text-xs text-destructive" role="alert">
              {switchError}
            </p>
          )}
          <Button
            aria-busy={isSwitchingMarket}
            className="w-full"
            disabled={!hasSelectedMarket || isSwitchingMarket}
            onClick={apply}
            size="lg"
          >
            {applyLabel}
          </Button>
        </div>
      </DialogContent>
    </DialogRoot>
  )
}
