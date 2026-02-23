import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Event as NostrEvent } from 'nostr-tools'

export interface NostrGraphDB extends DBSchema {
  // Main events store
  events: {
    key: string // event.id
    value: NostrEvent
    indexes: {
      'by-kind': number
      'by-pubkey': string
      'by-created': number
      'by-tag': string
    }
  }

  // Personal annotations/notes
  annotations: {
    key: string
    value: {
      id: string
      targetEventId: string
      content: string
      createdAt: number
      tags: string[]
    }
    indexes: {
      'by-target': string
      'by-created': number
    }
  }

  // Graph state snapshots
  graphStates: {
    key: string
    value: {
      id: string
      name: string
      description: string
      nodeIds: string[]
      filters: any
      layout: string
      createdAt: number
      updatedAt: number
    }
    indexes: {
      'by-created': number
      'by-updated': number
    }
  }

  // Search index metadata
  searchIndex: {
    key: string
    value: {
      eventId: string
      content: string
      tags: string[]
      indexed: boolean
      indexedAt: number
    }
    indexes: {
      'by-indexed': number
    }
  }
}

const DB_NAME = 'nostr-graph'
const DB_VERSION = 1

let dbInstance: IDBPDatabase<NostrGraphDB> | null = null

/**
 * Initialize and return the IndexedDB database
 */
export async function getDB(): Promise<IDBPDatabase<NostrGraphDB>> {
  if (dbInstance) {
    return dbInstance
  }

  dbInstance = await openDB<NostrGraphDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      console.log(`Upgrading database from v${oldVersion} to v${newVersion}`)

      // Events store
      if (!db.objectStoreNames.contains('events')) {
        const eventsStore = db.createObjectStore('events', { keyPath: 'id' })
        eventsStore.createIndex('by-kind', 'kind', { unique: false })
        eventsStore.createIndex('by-pubkey', 'pubkey', { unique: false })
        eventsStore.createIndex('by-created', 'created_at', { unique: false })

        // Multi-entry index for tags (allows querying by any tag)
        eventsStore.createIndex('by-tag', 'tags', {
          unique: false,
          multiEntry: true,
        })
      }

      // Annotations store
      if (!db.objectStoreNames.contains('annotations')) {
        const annotationsStore = db.createObjectStore('annotations', {
          keyPath: 'id',
        })
        annotationsStore.createIndex('by-target', 'targetEventId', {
          unique: false,
        })
        annotationsStore.createIndex('by-created', 'createdAt', {
          unique: false,
        })
      }

      // Graph states store
      if (!db.objectStoreNames.contains('graphStates')) {
        const graphStatesStore = db.createObjectStore('graphStates', {
          keyPath: 'id',
        })
        graphStatesStore.createIndex('by-created', 'createdAt', {
          unique: false,
        })
        graphStatesStore.createIndex('by-updated', 'updatedAt', {
          unique: false,
        })
      }

      // Search index store
      if (!db.objectStoreNames.contains('searchIndex')) {
        const searchIndexStore = db.createObjectStore('searchIndex', {
          keyPath: 'eventId',
        })
        searchIndexStore.createIndex('by-indexed', 'indexedAt', {
          unique: false,
        })
      }
    },

    blocked() {
      console.warn('Database upgrade blocked by another open connection')
    },

    blocking() {
      console.warn('This database connection is blocking an upgrade')
    },

    terminated() {
      console.error('Database connection was unexpectedly terminated')
      dbInstance = null
    },
  })

  return dbInstance
}

/**
 * Close the database connection
 */
export function closeDB(): void {
  if (dbInstance) {
    dbInstance.close()
    dbInstance = null
  }
}

/**
 * Clear all data from the database (useful for testing)
 */
export async function clearDB(): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(
    ['events', 'annotations', 'graphStates', 'searchIndex'],
    'readwrite',
  )

  await Promise.all([
    tx.objectStore('events').clear(),
    tx.objectStore('annotations').clear(),
    tx.objectStore('graphStates').clear(),
    tx.objectStore('searchIndex').clear(),
  ])

  await tx.done
}

/**
 * Get database statistics
 */
export async function getDBStats() {
  const db = await getDB()

  const [eventCount, annotationCount, graphStateCount] = await Promise.all([
    db.count('events'),
    db.count('annotations'),
    db.count('graphStates'),
  ])

  return {
    events: eventCount,
    annotations: annotationCount,
    graphStates: graphStateCount,
  }
}
