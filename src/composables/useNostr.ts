import { ref, onUnmounted, onMounted } from 'vue'
import {
  SimplePool,
  Relay,
  type Filter,
  type Event as NostrEvent,
} from 'nostr-tools'
import {
  getEnabledRelays,
  initializeDefaultRelays,
  updateRelayStatus,
  incrementRelayEventCount,
} from '@/db/relays'

// Shared pool instance across all composable instances
let poolInstance: SimplePool | null = null

// Track relay response times for connection status
const relayResponseTimers = new Map<string, ReturnType<typeof setTimeout>>()
const CONNECTION_TIMEOUT = 5000 // 5 seconds

export function useNostr() {
  const connected = ref(false)
  const relays = ref<string[]>([])
  const subscriptions = new Map<string, () => void>()

  // Load relays from database on mount
  onMounted(async () => {
    await loadRelaysFromDB()
    // Test relay connections in background
    testAllRelayConnections().catch(console.error)
  })

  // Load enabled relays from database
  async function loadRelaysFromDB() {
    try {
      // Initialize defaults if needed
      await initializeDefaultRelays()

      // Load enabled relays
      const enabledRelays = await getEnabledRelays()
      relays.value = enabledRelays.map((r) => r.url)

      console.log(`Loaded ${relays.value.length} enabled relays from database`)

      // Initialize all relays as disconnected
      for (const url of relays.value) {
        await updateRelayStatus(url, 'disconnected')
      }
    } catch (error) {
      console.error('Failed to load relays from database:', error)
      // Fallback to default relays if DB fails
      relays.value = [
        'wss://nostr.mutinywallet.com',
        'wss://relay.damus.io',
        'wss://nos.lol',
        'wss://relay.nostr.band',
        'wss://relay.nostr.net',
        'wss://relay.snort.social',
      ]
    }
  }

  /**
   * Mark relays as connecting and set timeout for error detection
   */
  async function markRelaysConnecting() {
    for (const url of relays.value) {
      await updateRelayStatus(url, 'connecting')

      // Set timeout to detect non-responsive relays
      const timeout = setTimeout(async () => {
        // If still connecting after timeout, mark as error
        await updateRelayStatus(url, 'error', 'Connection timeout')
        relayResponseTimers.delete(url)
      }, CONNECTION_TIMEOUT)

      relayResponseTimers.set(url, timeout)
    }
  }

  /**
   * Mark a relay as successfully connected
   */
  async function markRelayConnected(url: string) {
    // Clear timeout if it exists
    const timeout = relayResponseTimers.get(url)
    if (timeout) {
      clearTimeout(timeout)
      relayResponseTimers.delete(url)
    }

    await updateRelayStatus(url, 'connected')
  }

  /**
   * Test individual relay connection to detect WebSocket errors
   */
  async function testRelayConnection(url: string): Promise<boolean> {
    try {
      const relay = new Relay(url)

      return new Promise<boolean>((resolve) => {
        const timeout = setTimeout(() => {
          relay.close()
          updateRelayStatus(url, 'error', 'Connection timeout').catch(
            console.error,
          )
          resolve(false)
        }, CONNECTION_TIMEOUT)

        // Attempt to connect
        relay
          .connect()
          .then(() => {
            clearTimeout(timeout)
            // Successfully connected, test with a simple subscription
            const sub = relay.subscribe([{ kinds: [1], limit: 1 }], {
              onevent: () => {
                // Got an event
                sub.close()
                relay.close()
                markRelayConnected(url).catch(console.error)
                resolve(true)
              },
              oneose: () => {
                // End of stored events - relay is working even if no events
                sub.close()
                relay.close()
                markRelayConnected(url).catch(console.error)
                resolve(true)
              },
            })

            // Set a timeout for the subscription
            setTimeout(() => {
              sub.close()
              relay.close()
              markRelayConnected(url).catch(console.error)
              resolve(true)
            }, 2000)
          })
          .catch((error: Error) => {
            clearTimeout(timeout)
            relay.close()
            const errorMsg = error.message || 'Connection failed'
            updateRelayStatus(url, 'error', errorMsg).catch(console.error)
            resolve(false)
          })
      })
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Connection failed'
      await updateRelayStatus(url, 'error', errorMsg)
      return false
    }
  }

  /**
   * Test all relay connections
   */
  async function testAllRelayConnections(): Promise<void> {
    const promises = relays.value.map((url) => testRelayConnection(url))
    await Promise.allSettled(promises)
  }

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

    // Mark relays as connecting
    markRelaysConnecting().catch(console.error)

    // Merge filters into a single filter object
    const filter: Filter = filters.reduce((acc, f) => {
      // Merge arrays for kinds, authors, etc.
      if (f.kinds) acc.kinds = [...(acc.kinds || []), ...f.kinds]
      if (f.authors) acc.authors = [...(acc.authors || []), ...f.authors]
      if (f.limit) acc.limit = Math.max(acc.limit || 0, f.limit)
      return acc
    }, {} as Filter)

    // Track first event/EOSE per relay to mark as connected
    const connectedRelays = new Set<string>()

    // Use subscribeMany with correct params
    const sub = pool.subscribeMany(relays.value, filter, {
      onevent: (event: NostrEvent) => {
        // Call original handler
        onEvent(event)
      },
      oneose: () => {
        // Mark all relays as connected when we get EOSE and increment activity
        for (const url of relays.value) {
          if (!connectedRelays.has(url)) {
            markRelayConnected(url).catch(console.error)
            connectedRelays.add(url)
            // Increment once per EOSE as a simple activity indicator
            incrementRelayEventCount(url).catch(console.error)
          }
        }

        // Call original handler
        if (onEOSE) onEOSE()
      },
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

      // Mark relays as connecting
      await markRelaysConnecting()

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

      // Mark all relays as connected and increment their activity count
      if (events.length > 0) {
        for (const url of relays.value) {
          await markRelayConnected(url)
          // Increment once per successful fetch as a simple activity indicator
          await incrementRelayEventCount(url)
        }
      }

      connected.value = true
      console.log('Received events:', events.length)
      return events
    } catch (error) {
      console.error('Failed to fetch events:', error)

      // Mark all relays as error
      for (const url of relays.value) {
        await updateRelayStatus(
          url,
          'error',
          error instanceof Error ? error.message : 'Unknown error',
        )
      }

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
    loadRelaysFromDB,
    testAllRelayConnections,
  }
}
