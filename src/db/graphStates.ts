import { getDB } from './schema'

export interface GraphState {
  id: string
  name: string
  description: string
  nodeIds: string[] // List of event IDs in this graph state
  filters: {
    kinds?: number[]
    authors?: string[]
    timeRange?: [number, number]
    tags?: string[][]
  }
  layout: string // 'force', 'tree', 'circular', etc.
  createdAt: number
  updatedAt: number
}

/**
 * Save a graph state snapshot
 */
export async function saveGraphState(
  name: string,
  description: string,
  nodeIds: string[],
  filters: GraphState['filters'],
  layout: string,
): Promise<GraphState> {
  const state: GraphState = {
    id: crypto.randomUUID(),
    name,
    description,
    nodeIds,
    filters,
    layout,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }

  const db = await getDB()
  await db.put('graphStates', state)

  return state
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
