export function isColorOption(label: string) {
  const normalizedLabel = label.toLowerCase()

  return (
    normalizedLabel.includes('color') ||
    normalizedLabel.includes('colour') ||
    normalizedLabel.includes('finish')
  )
}
