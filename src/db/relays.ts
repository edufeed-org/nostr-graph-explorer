import { getDB } from './schema'
import type { NostrGraphDB } from './schema'

export type RelayInfo = NostrGraphDB['relays']['value']

/**
 * Get all relays
 */
export async function getAllRelays(): Promise<RelayInfo[]> {
  const db = await getDB()
  const allRelays = await db.getAll('relays')
  console.log('[relays.ts] getAllRelays - Total in database:', allRelays.length)
  console.log(
    '[relays.ts] All relays:',
    allRelays.map((r) => `${r.url} (enabled: ${r.enabled})`),
  )
  return allRelays
}

/**
 * Get enabled relays only
 */
export async function getEnabledRelays(): Promise<RelayInfo[]> {
  const db = await getDB()

  // Get all relays and manually filter - more reliable than index query with boolean values
  const allFromDb = await db.getAll('relays')
  const enabledRelays = allFromDb.filter((r) => r.enabled === true)

  console.log('[relays.ts] getEnabledRelays - Total relays:', allFromDb.length)
  console.log(
    '[relays.ts] getEnabledRelays - Enabled relays:',
    enabledRelays.length,
  )
  console.log(
    '[relays.ts] Enabled relay URLs:',
    enabledRelays.map((r) => `${r.url} (enabled: ${r.enabled})`),
  )

  return enabledRelays
}

/**
 * Get relay by URL
 */
export async function getRelay(url: string): Promise<RelayInfo | undefined> {
  const db = await getDB()
  return db.get('relays', url)
}

/**
 * Add or update a relay
 */
export async function saveRelay(relay: RelayInfo): Promise<void> {
  const db = await getDB()
  await db.put('relays', relay)
}

/**
 * Add a new relay with default values
 */
export async function addRelay(url: string): Promise<RelayInfo> {
  const relay: RelayInfo = {
    url,
    enabled: true,
    addedAt: Date.now(),
    lastConnected: null,
    lastError: null,
    errorCount: 0,
    status: 'disconnected',
    latency: null,
    eventsReceived: 0,
  }

  await saveRelay(relay)
  return relay
}

/**
 * Remove a relay
 */
export async function removeRelay(url: string): Promise<void> {
  console.log(`[relays.ts] Removing relay: ${url}`)
  const db = await getDB()
  await db.delete('relays', url)
  console.log(`[relays.ts] Relay removed from database: ${url}`)
}

/**
 * Update relay status
 */
export async function updateRelayStatus(
  url: string,
  status: RelayInfo['status'],
  error?: string,
): Promise<void> {
  const relay = await getRelay(url)
  if (!relay) return

  relay.status = status

  if (status === 'connected') {
    relay.lastConnected = Date.now()
    relay.lastError = null
    relay.errorCount = 0
  } else if (status === 'error') {
    relay.lastError = error || 'Unknown error'
    relay.errorCount += 1
  }

  await saveRelay(relay)
}

/**
 * Update relay latency
 */
export async function updateRelayLatency(
  url: string,
  latency: number,
): Promise<void> {
  const relay = await getRelay(url)
  if (!relay) return

  relay.latency = latency
  await saveRelay(relay)
}

/**
 * Increment events received count
 */
export async function incrementRelayEventCount(url: string): Promise<void> {
  const relay = await getRelay(url)
  if (!relay) return

  relay.eventsReceived += 1
  await saveRelay(relay)
}

/**
 * Toggle relay enabled status
 */
export async function toggleRelayEnabled(url: string): Promise<void> {
  const relay = await getRelay(url)
  if (!relay) return

  console.log(
    `[relays.ts] Toggling relay ${url} from ${relay.enabled} to ${!relay.enabled}`,
  )
  relay.enabled = !relay.enabled

  // When disabling a relay, mark it as disconnected
  // When enabling, also mark as disconnected (will be updated on next connection test)
  relay.status = 'disconnected'
  relay.lastError = null

  await saveRelay(relay)
  console.log(
    `[relays.ts] Relay ${url} now enabled: ${relay.enabled}, status: ${relay.status}`,
  )
}

/**
 * Initialize default relays if none exist
 */
export async function initializeDefaultRelays(): Promise<void> {
  const existing = await getAllRelays()

  // Only add defaults if no relays exist
  if (existing.length === 0) {
    const defaultRelays = [
      'wss://relay-rpi.edufeed.org',
      'wss://amb-relay.edufeed.org',
      'wss://relay.edufeed.org',
    ]

    for (const url of defaultRelays) {
      await addRelay(url)
    }
  }
}
