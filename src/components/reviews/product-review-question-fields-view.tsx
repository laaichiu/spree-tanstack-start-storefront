import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import type { ProductReviewQuestionFieldsModel } from '../contracts/reviews'
import type { ProductReviewQuestionDisplay } from './product-review-question-model'

export type { ProductReviewQuestionFieldsModel } from '../contracts/reviews'

type SelectQuestionKind = Extract<
  ProductReviewQuestionDisplay['kind'],
  'boolean' | 'scale' | 'single_select'
>

function getSelectQuestionOptions(
  kind: SelectQuestionKind,
  questionOptions: ProductReviewQuestionDisplay['options'],
  labels: ProductReviewQuestionFieldsModel['labels'],
) {
  switch (kind) {
    case 'boolean':
      return [
        { label: labels.yes, value: 'true' },
        { label: labels.no, value: 'false' },
      ]
    case 'scale':
      return [1, 2, 3, 4, 5].map((value) => ({
        label: String(value),
        value: String(value),
      }))
    case 'single_select':
      return questionOptions.map(({ label, value }) => ({ label, value }))
  }
}

export function ProductReviewQuestionFieldsView({
  model,
  onChange,
}: {
  model: ProductReviewQuestionFieldsModel
  onChange: (key: string, values: string[]) => void
}) {
  const { answers, labels, questions } = model
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {questions.map((question) => {
        const questionKind = question.kind
        const values = answers[question.key] ?? []
        const label = `${question.label}${
          question.required ? ` (${labels.required})` : ''
        }`

        if (questionKind === 'multi_select') {
          return (
            <fieldset className="space-y-3" key={question.id}>
              <legend className="text-xs leading-4 font-normal uppercase text-foreground">
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

        if (questionKind === 'text') {
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

        const options = getSelectQuestionOptions(
          questionKind,
          question.options,
          labels,
        )

        return (
          <NativeSelect
            id={`review-question-${question.id}`}
            key={question.id}
            label={label}
            onValueChange={(value) =>
              onChange(question.key, value ? [value] : [])
            }
            options={[
              { label: labels.selectPlaceholder, value: '' },
              ...options,
            ]}
            value={values[0] ?? ''}
          />
        )
      })}
    </div>
  )
}
