export function getCheckoutLineItemOptionsText(optionsText: string): string {
  return optionsText.replace(/^Color:\s*/i, '')
}
