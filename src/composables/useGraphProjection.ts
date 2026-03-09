import { type Event as NostrEvent } from 'nostr-tools'
import type { GraphNode, GraphEdge } from '../stores/graph'
import { npubEncode } from 'nostr-tools/nip19'

/**
 * Convert Nostr event to graph node
 */
export function eventToNode(event: NostrEvent): GraphNode {
  const label = getEventLabel(event)

  return {
    id: event.id,
    label,
    data: {
      event,
      kind: event.kind,
      pubkey: event.pubkey,
      created_at: event.created_at,
      content: event.content.slice(0, 100), // Truncate for display
    },
  }
}

/**
 * Extract edges from event tags
 */
export function extractEdges(event: NostrEvent): GraphEdge[] {
  const edges: GraphEdge[] = []

  // Determine base edge type from event kind
  let baseType = 'reference'
  if (event.kind === 6) {
    baseType = 'repost' // Kind 6 = repost
  } else if (event.kind === 7) {
    baseType = 'reaction' // Kind 7 = reaction
  }

  for (const tag of event.tags) {
    // Event references (replies, quotes, reactions, reposts)
    if (tag[0] === 'e' && tag[1]) {
      const marker = tag[3] || 'mention' // root, reply, mention
      edges.push({
        source: event.id,
        target: tag[1],
        data: {
          type: baseType === 'reference' ? 'reference' : baseType,
          marker: marker,
        },
      })
    }

    // Pubkey references (mentions)
    if (tag[0] === 'p' && tag[1]) {
      edges.push({
        source: event.id,
        target: tag[1],
        data: {
          type: 'mention',
          pubkey: tag[1],
        },
      })
    }
  }

  // Note: authored-by edges are created only when author nodes exist
  // This is handled explicitly in expansion functions
  // Note: board-card edges (via 'a' tag) are created by connectCardsToBoard() in GraphView

  return edges
}

/**
 * Get display label for event based on kind
 */
function getEventLabel(event: NostrEvent): string {
  const kindLabels: Record<number, string> = {
    0: '👤 Profile',
    1: '📝 Note',
    3: '👥 Contacts',
    4: '💬 DM',
    5: '🗑️ Delete',
    6: '🔄 Repost',
    7: '❤️ Reaction',
    9735: '⚡ Zap',
    30023: '📄 Article',
    30301: '📋 Board',
    30302: '🗂️ Card',
    30303: '📸 Snapshot',
  }

  const prefix = kindLabels[event.kind] || `Kind ${event.kind}`

  // For text notes, show first few words
  if (event.kind === 1) {
    const words = event.content.split(/\s+/).slice(0, 5).join(' ')
    return words.length > 30 ? words.slice(0, 30) + '...' : words
  }

  // For profiles, try to show name
  if (event.kind === 0) {
    try {
      const profile = JSON.parse(event.content)
      return profile.name || profile.display_name || 'Profile'
    } catch {
      return 'Profile'
    }
  }

  return prefix
}

/**
 * Convert multiple events to graph data
 */
export function eventsToGraph(
  events: NostrEvent[],
  existingNodeIds?: Set<string>,
): {
  nodes: GraphNode[]
  edges: GraphEdge[]
} {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []
  const nodeIds = new Set<string>()

  // First pass: collect profile data (kind 0 events)
  const profileMap = new Map<string, any>()
  for (const event of events) {
    if (event.kind === 0) {
      try {
        const profile = JSON.parse(event.content)
        profileMap.set(event.pubkey, {
          name: profile.name,
          display_name: profile.display_name,
          picture: profile.picture,
          about: profile.about,
          nip05: profile.nip05,
        })
      } catch (e) {
        console.warn('Failed to parse profile event:', event.id)
      }
    }
  }

  for (const event of events) {
    // Add event node
    if (!nodeIds.has(event.id)) {
      nodes.push(eventToNode(event))
      nodeIds.add(event.id)
    }

    // Extract edges (no automatic author nodes)
    const eventEdges = extractEdges(event)
    edges.push(...eventEdges)
  }

  // Combine new node IDs with existing node IDs for edge validation
  const allNodeIds = existingNodeIds
    ? new Set([...nodeIds, ...existingNodeIds])
    : nodeIds

  // Filter edges to only include those where both source and target nodes exist
  const validEdges = edges.filter(
    (edge) => allNodeIds.has(edge.source) && allNodeIds.has(edge.target),
  )

  console.log(
    `Graph projection: ${nodes.length} nodes, ${validEdges.length}/${edges.length} edges (${edges.length - validEdges.length} filtered out)`,
  )

  return { nodes, edges: validEdges }
}

/**
 * Filter events based on criteria
 */
export function filterEvents(
  events: NostrEvent[],
  filters: {
    kinds?: number[]
    authors?: string[]
    timeRange?: [number, number]
    searchText?: string
  },
): NostrEvent[] {
  let filtered = events

  if (filters.kinds && filters.kinds.length > 0) {
    filtered = filtered.filter((e) => filters.kinds!.includes(e.kind))
  }

  if (filters.authors && filters.authors.length > 0) {
    filtered = filtered.filter((e) => filters.authors!.includes(e.pubkey))
  }

  if (filters.timeRange) {
    const [start, end] = filters.timeRange
    filtered = filtered.filter(
      (e) => e.created_at >= start && e.created_at <= end,
    )
  }

  if (filters.searchText) {
    const search = filters.searchText.toLowerCase()
    filtered = filtered.filter((e) => e.content.toLowerCase().includes(search))
  }

  return filtered
}

export function useGraphProjection() {
  return {
    eventToNode,
    extractEdges,
    eventsToGraph,
    filterEvents,
  }
}
