import { ref, onUnmounted } from 'vue'
import { SimplePool, type Filter, type Event as NostrEvent } from 'nostr-tools'

const DEFAULT_RELAYS = [
  'wss://nostr.mutinywallet.com',
  'wss://relay.damus.io',
  'wss://nos.lol',
  'wss://relay.nostr.band',
  'wss://relay.nostr.net',
  'wss://relay.snort.social',
]

// Shared pool instance across all composable instances
let poolInstance: SimplePool | null = null

export function useNostr() {
  const connected = ref(false)
  const relays = ref<string[]>([...DEFAULT_RELAYS])
  const subscriptions = new Map<string, () => void>()

  // Get or create pool
  function getPool(): SimplePool {
    if (!poolInstance) {
      poolInstance = new SimplePool()
    }
    return poolInstance
  }

  /**
   * Add a relay to the pool
   */
  function addRelay(url: string) {
    if (!relays.value.includes(url)) {
      relays.value.push(url)
    }
  }

  /**
   * Remove a relay from the pool
   */
  function removeRelay(url: string) {
    relays.value = relays.value.filter((r) => r !== url)
  }

  /**
   * Subscribe to events matching filters
   */
  function subscribe(
    filters: Filter[],
    onEvent: (event: NostrEvent) => void,
    onEOSE?: () => void,
  ): string {
    const pool = getPool()
    const subId = crypto.randomUUID()

    // Merge filters into a single filter object
    const filter: Filter = filters.reduce((acc, f) => {
      // Merge arrays for kinds, authors, etc.
      if (f.kinds) acc.kinds = [...(acc.kinds || []), ...f.kinds]
      if (f.authors) acc.authors = [...(acc.authors || []), ...f.authors]
      if (f.limit) acc.limit = Math.max(acc.limit || 0, f.limit)
      return acc
    }, {} as Filter)

    // Use subscribeMany with correct params
    const sub = pool.subscribeMany(relays.value, filter, {
      onevent: onEvent,
      oneose: onEOSE,
      id: subId,
    })

    // Store cleanup function
    subscriptions.set(subId, () => sub.close())
    connected.value = true

    return subId
  }

  /**
   * Unsubscribe from a specific subscription
   */
  function unsubscribe(subId: string) {
    const cleanup = subscriptions.get(subId)
    if (cleanup) {
      cleanup()
      subscriptions.delete(subId)
    }
  }

  /**
   * Fetch events (one-time query, closes automatically)
   */
  async function fetchEvents(filters: Filter[]): Promise<NostrEvent[]> {
    const pool = getPool()

    try {
      console.log('Fetching from relays:', relays.value)
      console.log('Filters:', JSON.stringify(filters, null, 2))

      // Merge multiple filters into one
      const filter: Filter = filters.reduce((acc, f) => {
        // Merge arrays for kinds, authors, etc.
        if (f.kinds) acc.kinds = [...(acc.kinds || []), ...f.kinds]
        if (f.authors) acc.authors = [...(acc.authors || []), ...f.authors]
        if (f.limit) acc.limit = Math.max(acc.limit || 0, f.limit)
        // Copy other filter properties
        Object.keys(f).forEach((key) => {
          if (!['kinds', 'authors', 'limit'].includes(key)) {
            ;(acc as any)[key] = (f as any)[key]
          }
        })
        return acc
      }, {} as Filter)

      console.log('Merged filter:', JSON.stringify(filter, null, 2))

      // Use querySync with a single filter
      const events = await pool.querySync(relays.value, filter)

      connected.value = true
      console.log('Received events:', events.length)
      return events
    } catch (error) {
      console.error('Failed to fetch events:', error)
      throw error
    }
  }

  /**
   * Publish an event to relays
   */
  async function publishEvent(event: NostrEvent): Promise<string[]> {
    const pool = getPool()
    const publishedTo: string[] = []

    await Promise.allSettled(
      relays.value.map(async (relay) => {
        try {
          await pool.publish([relay], event)
          publishedTo.push(relay)
        } catch (err) {
          console.error(`Failed to publish to ${relay}:`, err)
        }
      }),
    )

    return publishedTo
  }

  /**
   * Close all subscriptions
   */
  function closeAll() {
    subscriptions.forEach((cleanup) => cleanup())
    subscriptions.clear()
    connected.value = false
  }

  /**
   * Cleanup on unmount
   */
  onUnmounted(() => {
    closeAll()
  })

  return {
    connected,
    relays,
    addRelay,
    removeRelay,
    subscribe,
    unsubscribe,
    fetchEvents,
    publishEvent,
    closeAll,
    getPool,
  }
}
