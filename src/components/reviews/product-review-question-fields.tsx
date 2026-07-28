import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { useMarket } from '@/components/layout/market-provider'
import type { ProductReviewQuestion } from '@/lib/reviews/model/product-review'

export function ProductReviewQuestionFields({
  answers,
  onChange,
  questions,
}: {
  answers: Record<string, string[]>
  onChange: (key: string, values: string[]) => void
  questions: ProductReviewQuestion[]
}) {
  const { t } = useMarket()

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {questions.map((question) => {
        const values = answers[question.key] ?? []
        const label = `${question.label}${
          question.required ? ` (${t('reviews.required')})` : ''
        }`

        if (question.kind === 'multi_select') {
          return (
            <fieldset className="space-y-3" key={question.id}>
              <legend className="text-sm leading-4 font-normal uppercase text-foreground">
                {label}
              </legend>
              {question.options.map((option) => (
                <Checkbox
                  checked={values.includes(option.value)}
                  key={option.id}
                  label={option.label}
                  onCheckedChange={(checked) =>
                    onChange(
                      question.key,
                      checked === true
                        ? [...new Set([...values, option.value])]
                        : values.filter((value) => value !== option.value),
                    )
                  }
                />
              ))}
            </fieldset>
          )
        }

        if (question.kind === 'text') {
          return (
            <Input
              key={question.id}
              label={label}
              onChange={(event) =>
                onChange(
                  question.key,
                  event.currentTarget.value ? [event.currentTarget.value] : [],
                )
              }
              value={values[0] ?? ''}
            />
          )
        }

        const options =
          question.kind === 'boolean'
            ? [
                { label: t('reviews.yes'), value: 'true' },
                { label: t('reviews.no'), value: 'false' },
              ]
            : question.kind === 'scale'
              ? [1, 2, 3, 4, 5].map((value) => ({
                  label: String(value),
                  value: String(value),
                }))
              : question.options.map((option) => ({
                  label: option.label,
                  value: option.value,
                }))

        return (
          <NativeSelect
            id={`review-question-${question.id}`}
            key={question.id}
            label={label}
            onValueChange={(value) =>
              onChange(question.key, value ? [value] : [])
            }
            options={[
              { label: t('reviews.selectPlaceholder'), value: '' },
              ...options,
            ]}
            value={values[0] ?? ''}
          />
        )
      })}
    </div>
  )
}
