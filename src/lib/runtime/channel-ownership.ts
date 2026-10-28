import type { Channel, Client } from '@spree/sdk'

type ChannelOwnedResource = {
  channelId: string
  id: string
}

type ChannelOwnershipOptions = {
  cacheKey?: string
  channel: string
}

const channelIdPromises = new Map<string, Promise<string>>()

export class StorefrontChannelMismatchError extends Error {
  constructor() {
    super('The Store API resource belongs to a different storefront Channel')
    this.name = 'StorefrontChannelMismatchError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function normalizeIdentity(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function readChannelOwnedResource(value: unknown): ChannelOwnedResource | null {
  if (!isRecord(value)) {
    return null
  }

  const id = normalizeIdentity(value.id)

  if (!id.startsWith('cart_') && !id.startsWith('or_')) {
    return null
  }

  const channelId = normalizeIdentity(value.channel_id)

  if (!channelId.startsWith('ch_')) {
    throw new StorefrontChannelMismatchError()
  }

  return { channelId, id }
}

function getChannelOwnedResources(payload: unknown) {
  const directResource = readChannelOwnedResource(payload)

  if (directResource) {
    return [directResource]
  }

  if (!isRecord(payload)) {
    return []
  }

  if (normalizeIdentity(payload.id).startsWith('ogrp_')) {
    if (!Array.isArray(payload.orders) || payload.orders.length === 0) {
      throw new StorefrontChannelMismatchError()
    }

    return payload.orders.map((order) => {
      const resource = readChannelOwnedResource(order)
      if (!resource || !resource.id.startsWith('or_')) {
        throw new StorefrontChannelMismatchError()
      }
      return resource
    })
  }

  if (!Array.isArray(payload.data)) return []

  return payload.data.flatMap((item) => {
    const resource = readChannelOwnedResource(item)

    return resource ? [resource] : []
  })
}

function assertResolvedChannel(
  channel: Channel,
  expectedLocator: string,
): string {
  const id = normalizeIdentity(channel.id)
  const code = normalizeIdentity(channel.code)

  if (
    !id.startsWith('ch_') ||
    !code ||
    (expectedLocator !== id && expectedLocator !== code)
  ) {
    throw new StorefrontChannelMismatchError()
  }

  return id
}

function getResolvedChannelId(
  client: Client,
  { cacheKey, channel }: ChannelOwnershipOptions,
) {
  const channelLocator = channel.trim()
  const resolvedCacheKey = cacheKey ?? channelLocator
  const cachedPromise = channelIdPromises.get(resolvedCacheKey)

  if (cachedPromise) {
    return cachedPromise
  }

  const channelIdPromise = client.channel
    .get()
    .then((resolvedChannel) =>
      assertResolvedChannel(resolvedChannel, channelLocator),
    )
    .catch((error: unknown) => {
      channelIdPromises.delete(resolvedCacheKey)
      throw error
    })

  channelIdPromises.set(resolvedCacheKey, channelIdPromise)

  return channelIdPromise
}

async function assertChannelOwnedPayload(
  payload: unknown,
  resolveChannelId: () => Promise<string>,
) {
  const resources = getChannelOwnedResources(payload)

  if (resources.length === 0) {
    return payload
  }

  const channelId = await resolveChannelId()

  if (resources.some((resource) => resource.channelId !== channelId)) {
    throw new StorefrontChannelMismatchError()
  }

  return payload
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  if (
    !value ||
    (typeof value !== 'object' && typeof value !== 'function') ||
    !('then' in value)
  ) {
    return false
  }

  return typeof value.then === 'function'
}

export function withStorefrontChannelOwnership(
  client: Client,
  options: ChannelOwnershipOptions,
): Client {
  const proxies = new WeakMap<object, object>()
  const resolveChannelId = () => getResolvedChannelId(client, options)

  function wrap<T extends object>(target: T): T {
    const existingProxy = proxies.get(target)

    if (existingProxy) {
      return existingProxy as T
    }

    const proxy = new Proxy(target, {
      get(currentTarget, property, receiver) {
        const value = Reflect.get(currentTarget, property, receiver)

        if (typeof value === 'function') {
          return (...args: unknown[]) => {
            const result = Reflect.apply(value, currentTarget, args)

            return isPromiseLike(result)
              ? Promise.resolve(result).then((payload) =>
                  assertChannelOwnedPayload(payload, resolveChannelId),
                )
              : result
          }
        }

        return typeof value === 'object' && value !== null ? wrap(value) : value
      },
    })

    proxies.set(target, proxy)

    return proxy
  }

  return wrap(client)
}
