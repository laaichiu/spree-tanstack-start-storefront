export function getOptionSwatchClass(label: string) {
  const normalizedLabel = label.toLowerCase()

  if (normalizedLabel.includes('black')) {
    return 'bg-foreground'
  }

  if (normalizedLabel.includes('silver')) {
    return 'bg-muted-foreground/30'
  }

  if (normalizedLabel.includes('white')) {
    return 'bg-background'
  }

  return 'bg-muted'
}

export function isColorOption(label: string) {
  const normalizedLabel = label.toLowerCase()

  return (
    normalizedLabel.includes('color') ||
    normalizedLabel.includes('colour') ||
    normalizedLabel.includes('finish')
  )
}
