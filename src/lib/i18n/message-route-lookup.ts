import { fallbackMessages, getMessage, isMessageDictionary } from './messages'
import type { MessageDictionary, MessageKey } from './messages'

type RouteMatchWithLoaderData = {
  loaderData?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function getMessagesFromMatches(
  matches: readonly RouteMatchWithLoaderData[],
): MessageDictionary {
  for (let index = matches.length - 1; index >= 0; index -= 1) {
    const loaderData = matches[index]?.loaderData

    if (isRecord(loaderData) && isMessageDictionary(loaderData.messages)) {
      return loaderData.messages
    }
  }

  return fallbackMessages
}

export function getMessageFromMatches(
  matches: readonly RouteMatchWithLoaderData[],
  key: MessageKey,
) {
  return getMessage(getMessagesFromMatches(matches), key)
}
