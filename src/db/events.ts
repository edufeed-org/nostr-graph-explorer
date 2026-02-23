import type { Event as NostrEvent, Filter } from 'nostr-tools'
import { getDB } from './schema'

/**
 * Store a single Nostr event in IndexedDB
 */
export async function storeEvent(event: NostrEvent): Promise<void> {
  const db = await getDB()
  await db.put('events', event)
}

/**
 * Store multiple Nostr events in a single transaction
 */
export async function storeEvents(events: NostrEvent[]): Promise<void> {
  if (events.length === 0) return

  const db = await getDB()
  const tx = db.transaction('events', 'readwrite')

  await Promise.all(events.map((event) => tx.store.put(event)))
  await tx.done
}

/**
 * Get a single event by ID
 */
export async function getEvent(
  eventId: string,
): Promise<NostrEvent | undefined> {
  const db = await getDB()
  return db.get('events', eventId)
}

/**
 * Get multiple events by IDs
 */
export async function getEvents(eventIds: string[]): Promise<NostrEvent[]> {
  const db = await getDB()
  const events = await Promise.all(eventIds.map((id) => db.get('events', id)))
  return events.filter((e): e is NostrEvent => e !== undefined)
}

/**
 * Get all events (be careful with large datasets!)
 */
export async function getAllEvents(): Promise<NostrEvent[]> {
  const db = await getDB()
  return db.getAll('events')
}

/**
 * Query events by kind
 */
export async function getEventsByKind(kind: number): Promise<NostrEvent[]> {
  const db = await getDB()
  return db.getAllFromIndex('events', 'by-kind', kind)
}

/**
 * Query events by pubkey
 */
export async function getEventsByPubkey(pubkey: string): Promise<NostrEvent[]> {
  const db = await getDB()
  return db.getAllFromIndex('events', 'by-pubkey', pubkey)
}

/**
 * Query events by tag (e.g., ['e', 'event-id'] or ['p', 'pubkey'])
 */
export async function getEventsByTag(tag: string[]): Promise<NostrEvent[]> {
  const db = await getDB()
  const tagString = JSON.stringify(tag)
  return db.getAllFromIndex('events', 'by-tag', tagString)
}

/**
 * Query events within a time range
 */
export async function getEventsByTimeRange(
  startTime: number,
  endTime: number,
): Promise<NostrEvent[]> {
  const db = await getDB()
  const range = IDBKeyRange.bound(startTime, endTime)
  return db.getAllFromIndex('events', 'by-created', range)
}

/**
 * Delete an event by ID
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const db = await getDB()
  await db.delete('events', eventId)
}

/**
 * Delete multiple events by IDs
 */
export async function deleteEvents(eventIds: string[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction('events', 'readwrite')

  await Promise.all(eventIds.map((id) => tx.store.delete(id)))
  await tx.done
}

/**
 * Check if an event exists in the database
 */
export async function eventExists(eventId: string): Promise<boolean> {
  const db = await getDB()
  const count = await db.countFromIndex('events', 'by-kind', eventId)
  return count > 0
}

/**
 * Query events matching a Nostr filter (simplified implementation)
 * Note: This is a basic implementation. For complex queries, consider using SPARQL later.
 */
export async function queryEvents(filter: Filter): Promise<NostrEvent[]> {
  const db = await getDB()
  let results: NostrEvent[] = []

  // Query by IDs
  if (filter.ids && filter.ids.length > 0) {
    const events = await Promise.all(
      filter.ids.map((id) => db.get('events', id)),
    )
    results = events.filter((e): e is NostrEvent => e !== undefined)
  }
  // Query by authors
  else if (filter.authors && filter.authors.length > 0) {
    const eventsByAuthor = await Promise.all(
      filter.authors.map((pubkey) => getEventsByPubkey(pubkey)),
    )
    results = eventsByAuthor.flat()
  }
  // Query by kinds
  else if (filter.kinds && filter.kinds.length > 0) {
    const eventsByKind = await Promise.all(
      filter.kinds.map((kind) => getEventsByKind(kind)),
    )
    results = eventsByKind.flat()
  }
  // Otherwise get all events (dangerous!)
  else {
    results = await getAllEvents()
  }

  // Apply time filters
  if (filter.since || filter.until) {
    results = results.filter((event) => {
      if (filter.since && event.created_at < filter.since) return false
      if (filter.until && event.created_at > filter.until) return false
      return true
    })
  }

  // Apply limit
  if (filter.limit) {
    results = results.slice(0, filter.limit)
  }

  return results
}

/**
 * Find events that reference a specific event (replies, quotes, etc.)
 */
export async function getEventReferences(
  eventId: string,
): Promise<NostrEvent[]> {
  const db = await getDB()
  const allEvents = await getAllEvents()

  // Filter events that have an 'e' tag referencing this event
  return allEvents.filter((event) =>
    event.tags.some((tag) => tag[0] === 'e' && tag[1] === eventId),
  )
}

/**
 * Find events that mention a specific pubkey
 */
export async function getEventMentions(pubkey: string): Promise<NostrEvent[]> {
  const db = await getDB()
  const allEvents = await getAllEvents()

  // Filter events that have a 'p' tag mentioning this pubkey
  return allEvents.filter((event) =>
    event.tags.some((tag) => tag[0] === 'p' && tag[1] === pubkey),
  )
}

/**
 * Get events statistics
 */
export async function getEventsStats() {
  const db = await getDB()
  const allEvents = await getAllEvents()

  const kindCount: Record<number, number> = {}
  const pubkeyCount: Record<string, number> = {}

  allEvents.forEach((event) => {
    kindCount[event.kind] = (kindCount[event.kind] || 0) + 1
    pubkeyCount[event.pubkey] = (pubkeyCount[event.pubkey] || 0) + 1
  })

  const earliestEvent = allEvents.reduce(
    (earliest, event) =>
      event.created_at < earliest ? event.created_at : earliest,
    Infinity,
  )

  const latestEvent = allEvents.reduce(
    (latest, event) => (event.created_at > latest ? event.created_at : latest),
    0,
  )

  return {
    totalEvents: allEvents.length,
    byKind: kindCount,
    byPubkey: pubkeyCount,
    uniquePubkeys: Object.keys(pubkeyCount).length,
    timeRange: {
      earliest: earliestEvent === Infinity ? null : earliestEvent,
      latest: latestEvent === 0 ? null : latestEvent,
    },
  }
}
