import { parseFragment } from 'parse5'
import type { DefaultTreeAdapterTypes } from 'parse5'

const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'div',
  'em',
  'h2',
  'h3',
  'h4',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'span',
  'strong',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
])

const DROP_CONTENT_TAGS = new Set([
  'embed',
  'iframe',
  'object',
  'script',
  'style',
  'template',
])

const VOID_TAGS = new Set(['br', 'img'])

type RichTextNode = DefaultTreeAdapterTypes.Node

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function readAttribute(node: RichTextNode, name: string) {
  return 'attrs' in node
    ? (node.attrs.find((attribute) => attribute.name === name)?.value ?? null)
    : null
}

function isSafeUrl(value: string, kind: 'href' | 'src') {
  const normalized = value.trim()

  if (!normalized || normalized.includes('\\') || normalized.startsWith('//')) {
    return false
  }

  if (normalized.startsWith('#') || normalized.startsWith('/')) {
    return true
  }

  try {
    const url = new URL(normalized, 'https://storefront.invalid')

    if (
      kind === 'href' &&
      ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol)
    ) {
      return true
    }

    return kind === 'src' && ['http:', 'https:'].includes(url.protocol)
  } catch {
    return false
  }
}

function serializeAttributes(node: RichTextNode, tagName: string) {
  const attributes: string[] = []
  const href = tagName === 'a' ? readAttribute(node, 'href') : null
  const src = tagName === 'img' ? readAttribute(node, 'src') : null

  if (tagName === 'a' && href && isSafeUrl(href, 'href')) {
    attributes.push(` href="${escapeHtml(href)}"`)
  }

  if (tagName === 'img' && src && isSafeUrl(src, 'src')) {
    attributes.push(` src="${escapeHtml(src)}"`)

    for (const name of ['alt', 'height', 'width']) {
      const value = readAttribute(node, name)

      if (value) {
        attributes.push(` ${name}="${escapeHtml(value)}"`)
      }
    }
  }

  if (tagName === 'a') {
    const target = readAttribute(node, 'target')

    if (target === '_blank') {
      attributes.push(' target="_blank" rel="noopener noreferrer"')
    }
  }

  return attributes.join('')
}

function serializeNode(node: RichTextNode): string {
  if (node.nodeName === '#text' && 'value' in node) {
    return escapeHtml(node.value)
  }

  if (node.nodeName === '#comment') {
    return ''
  }

  if (!('childNodes' in node)) {
    return ''
  }

  const tagName = node.nodeName.toLowerCase()

  if (DROP_CONTENT_TAGS.has(tagName)) {
    return ''
  }

  const children = node.childNodes.map(serializeNode).join('')

  if (!ALLOWED_TAGS.has(tagName)) {
    return children
  }

  if (tagName === 'img' && !readAttribute(node, 'src')) {
    return ''
  }

  const attributes = serializeAttributes(node, tagName)

  if (tagName === 'img' && !attributes.includes(' src=')) {
    return ''
  }

  return VOID_TAGS.has(tagName)
    ? `<${tagName}${attributes}>`
    : `<${tagName}${attributes}>${children}</${tagName}>`
}

/**
 * Sanitize Spree product rich text before it reaches dangerouslySetInnerHTML.
 * Keep this boundary in the storefront because catalog descriptions are
 * external content and may contain legacy or unsanitized markup.
 */
export function sanitizeRichTextHtml(html: string) {
  if (!html.trim()) {
    return ''
  }

  const fragment = parseFragment(html)

  return fragment.childNodes.map(serializeNode).join('')
}
