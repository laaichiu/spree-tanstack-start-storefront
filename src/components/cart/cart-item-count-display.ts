export function getCartItemCountLabel({
  itemCount,
  itemPlural,
  itemSingular,
}: {
  itemCount: number
  itemPlural: string
  itemSingular: string
}): string {
  return `${itemCount} ${itemCount === 1 ? itemSingular : itemPlural}`
}
