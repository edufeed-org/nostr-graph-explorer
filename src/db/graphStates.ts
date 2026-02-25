import { getDB } from './schema'

export interface GraphState {
  id: string
  name: string
  description: string
  // Graph data
  graphData: {
    nodes: any[]
    edges: any[]
  }
  // UI state
  layoutType: string
  selectedNodeId: string | null
  treeRootId: string | null
  expandedCardIds: string[]
  selectedCardId: string | null
  // Camera state
  zoom: number | null
  pan: { x: number; y: number } | null
  // Filters
  filters: {
    kinds?: number[]
    authors?: string[]
    timeRange?: [number, number]
    tags?: string[][]
  }
  // Metadata
  createdAt: number
  updatedAt: number
}

/**
 * Save a complete graph state snapshot
 */
export async function saveGraphState(
  state: Omit<GraphState, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<GraphState> {
  const fullState: GraphState = {
    ...state,
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const db = await getDB()
  await db.put('graphStates', fullState)

  return fullState
}

/**
 * Load a graph state by ID
 */
export async function loadGraphState(
  stateId: string,
): Promise<GraphState | undefined> {
  const db = await getDB()
  return db.get('graphStates', stateId)
}

/**
 * Update an existing graph state
 */
export async function updateGraphState(
  stateId: string,
  updates: Partial<Omit<GraphState, 'id' | 'createdAt'>>,
): Promise<void> {
  const db = await getDB()
  const state = await db.get('graphStates', stateId)

  if (!state) {
    throw new Error(`Graph state ${stateId} not found`)
  }

  Object.assign(state, updates, { updatedAt: Date.now() })
  await db.put('graphStates', state)
}

/**
 * Delete a graph state
 */
export async function deleteGraphState(stateId: string): Promise<void> {
  const db = await getDB()
  await db.delete('graphStates', stateId)
}

/**
 * Get all saved graph states
 */
export async function getAllGraphStates(): Promise<GraphState[]> {
  const db = await getDB()
  const states = await db.getAll('graphStates')

  // Sort by updated time (most recent first)
  return states.sort((a, b) => b.updatedAt - a.updatedAt)
}

/**
 * Get recently updated graph states
 */
export async function getRecentGraphStates(
  limit: number = 10,
): Promise<GraphState[]> {
  const states = await getAllGraphStates()
  return states.slice(0, limit)
}

/**
 * Duplicate an existing graph state
 */
export async function duplicateGraphState(
  stateId: string,
  newName?: string,
): Promise<GraphState> {
  const db = await getDB()
  const original = await db.get('graphStates', stateId)

  if (!original) {
    throw new Error(`Graph state ${stateId} not found`)
  }

  const duplicate: GraphState = {
    ...original,
    id: crypto.randomUUID(),
    name: newName || `${original.name} (copy)`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  await db.put('graphStates', duplicate)
  return duplicate
}

/**
 * Export a graph state to JSON
 */
export function exportGraphState(state: GraphState): string {
  return JSON.stringify(state, null, 2)
}

/**
 * Import a graph state from JSON
 */
export async function importGraphState(json: string): Promise<GraphState> {
  const state = JSON.parse(json) as GraphState

  // Generate new ID and timestamps
  state.id = crypto.randomUUID()
  state.createdAt = Date.now()
  state.updatedAt = Date.now()

  const db = await getDB()
  await db.put('graphStates', state)

  return state
}

// Local storage key for last active state
const LAST_STATE_KEY = 'nostr-graph:last-active-state'

/**
 * Set the last active graph state ID
 */
export function setLastActiveState(stateId: string | null): void {
  if (stateId) {
    localStorage.setItem(LAST_STATE_KEY, stateId)
  } else {
    localStorage.removeItem(LAST_STATE_KEY)
  }
}

/**
 * Get the last active graph state ID
 */
export function getLastActiveState(): string | null {
  return localStorage.getItem(LAST_STATE_KEY)
}
