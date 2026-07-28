import { useMarket } from '@/components/layout/market-provider'
import { buttonClassName } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CheckoutDiscountCodeEntry({
  code,
  disabled,
  error,
  isPending,
  onChange,
}: {
  code: string
  disabled: boolean
  error: string | null
  isPending: boolean
  onChange: (code: string) => void
}) {
  const { t } = useMarket()

  return (
    <div className="flex gap-3">
      <div className="min-w-0 flex-1">
        <Input
          className="h-14 bg-background px-4"
          disabled={isPending}
          error={error}
          label={t('checkout.discountCodeOrGiftCard')}
          labelClassName="sr-only"
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('checkout.discountCodeOrGiftCard')}
          type="text"
          value={code}
        />
      </div>
      <button
        className={buttonClassName({
          className: 'h-14 border-border px-5',
          size: 'lg',
          variant: 'secondary',
        })}
        disabled={disabled}
        type="submit"
      >
        {isPending ? t('checkout.applyingCode') : t('checkout.apply')}
      </button>
    </div>
  )
}
