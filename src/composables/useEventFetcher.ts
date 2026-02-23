import { ref } from 'vue'
import { type Filter, type Event as NostrEvent } from 'nostr-tools'
import { useNostr } from './useNostr'
import {
  storeEvent,
  storeEvents,
  getEventsByPubkey,
  getEventReferences,
} from '@/db'

export interface FetchProgress {
  total: number
  fetched: number
  stored: number
}

export function useEventFetcher() {
  const { fetchEvents, subscribe } = useNostr()
  const isFetching = ref(false)
  const progress = ref<FetchProgress>({ total: 0, fetched: 0, stored: 0 })

  /**
   * Fetch initial events for a user/topic
   */
  async function fetchInitialEvents(
    filters: Filter[],
    options: { limit?: number; timeout?: number } = {},
  ): Promise<NostrEvent[]> {
    isFetching.value = true
    progress.value = { total: 0, fetched: 0, stored: 0 }

    try {
      const events = await fetchEvents(filters, options.timeout)
      progress.value.fetched = events.length
      progress.value.total = events.length

      // Store in batches for better performance
      await storeEvents(events)
      progress.value.stored = events.length

      return events
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Fetch and expand around a specific event (get replies, references, etc.)
   */
  async function expandAroundEvent(eventId: string): Promise<{
    replies: NostrEvent[]
    mentions: NostrEvent[]
  }> {
    isFetching.value = true

    try {
      // Fetch events that reference this event (replies, quotes, etc.)
      const replyFilter: Filter = {
        '#e': [eventId],
        limit: 100,
      }

      const replies = await fetchEvents([replyFilter])
      await storeEvents(replies)

      return {
        replies,
        mentions: [], // TODO: Implement mention detection
      }
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Fetch user's social graph (follows, followers)
   */
  async function fetchUserGraph(pubkey: string): Promise<{
    follows: string[]
    events: NostrEvent[]
  }> {
    isFetching.value = true

    try {
      // Get user's contact list (kind 3)
      const contactFilter: Filter = {
        authors: [pubkey],
        kinds: [3],
        limit: 1,
      }

      const contactEvents = await fetchEvents([contactFilter])
      const follows: string[] = []

      if (contactEvents.length > 0) {
        const contactList = contactEvents[0]
        // Extract followed pubkeys from tags
        follows.push(
          ...contactList.tags
            .filter((tag) => tag[0] === 'p')
            .map((tag) => tag[1]),
        )
      }

      // Fetch recent events from user and their follows
      const eventFilters: Filter[] = [
        {
          authors: [pubkey, ...follows.slice(0, 50)], // Limit to 50 follows
          kinds: [1, 6, 7, 9735], // notes, reposts, reactions, zaps
          limit: 200,
        },
      ]

      const events = await fetchEvents(eventFilters)
      await storeEvents(events)

      return { follows, events }
    } finally {
      isFetching.value = false
    }
  }

  /**
   * Subscribe to live updates for specific filters
   */
  function subscribeLive(
    filters: Filter[],
    onNewEvent?: (event: NostrEvent) => void,
  ): string {
    const subId = subscribe(
      filters,
      async (event) => {
        // Store new event in IndexedDB
        await storeEvent(event)

        // Call user callback if provided
        if (onNewEvent) {
          onNewEvent(event)
        }
      },
      () => {
        console.log('Subscription EOSE reached')
      },
    )

    return subId
  }

  /**
   * Fetch events by kind
   */
  async function fetchByKind(
    kinds: number[],
    limit: number = 100,
  ): Promise<NostrEvent[]> {
    const filter: Filter = { kinds, limit }
    return fetchInitialEvents([filter])
  }

  /**
   * Fetch events by author
   */
  async function fetchByAuthor(
    pubkey: string,
    limit: number = 100,
  ): Promise<NostrEvent[]> {
    const filter: Filter = { authors: [pubkey], limit }
    return fetchInitialEvents([filter])
  }

  /**
   * Fetch global feed
   */
  async function fetchGlobalFeed(limit: number = 20): Promise<NostrEvent[]> {
    const filter: Filter = {
      kinds: [1], // Text notes only
      limit,
    }
    return fetchInitialEvents([filter])
  }

  return {
    isFetching,
    progress,
    fetchInitialEvents,
    expandAroundEvent,
    fetchUserGraph,
    subscribeLive,
    fetchByKind,
    fetchByAuthor,
    fetchGlobalFeed,
  }
}
