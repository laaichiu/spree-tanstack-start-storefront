import { useState } from 'react'

export function useProductListingFilterDrawer({
  sectionIds,
}: {
  sectionIds: readonly string[]
}) {
  const [expandedSection, setExpandedSection] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  function prepareSection(sectionId?: string) {
    setExpandedSection(sectionId ?? sectionIds.at(0) ?? null)
  }

  function toggleSection(sectionId: string) {
    setExpandedSection((current) => (current === sectionId ? null : sectionId))
  }

  return {
    expandedSection,
    isOpen,
    prepareSection,
    setIsOpen,
    toggleSection,
  }
}
