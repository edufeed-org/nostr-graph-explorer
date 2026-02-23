# Database Layer Documentation

This module provides a complete IndexedDB-based storage solution for Nostr events, personal annotations, and graph states.

## Database Schema

The database (`nostr-graph`) contains 4 object stores:

### 1. **events** - Nostr Events
- **Key**: `id` (event ID)
- **Indexes**:
  - `by-kind` - Query events by kind
  - `by-pubkey` - Query events by author
  - `by-created` - Query events by timestamp
  - `by-tag` - Multi-entry index for tags

### 2. **annotations** - Personal Notes
- **Key**: `id` (UUID)
- **Indexes**:
  - `by-target` - Find annotations for specific events
  - `by-created` - Sort by creation time

### 3. **graphStates** - Saved Graph Views
- **Key**: `id` (UUID)
- **Indexes**:
  - `by-created` - Creation time
  - `by-updated` - Last modified time

### 4. **searchIndex** - Full-Text Search Metadata
- **Key**: `eventId`
- **Indexes**:
  - `by-indexed` - Track indexing status

## Usage Examples

### Initialize Database

```typescript
import { getDB, getDBStats } from '@/db';

// Get database instance
const db = await getDB();

// Get statistics
const stats = await getDBStats();
console.log(stats); // { events: 100, annotations: 5, graphStates: 3 }
```

### Store Events

```typescript
import { storeEvent, storeEvents } from '@/db';

// Store single event
await storeEvent(nostrEvent);

// Store multiple events (more efficient)
await storeEvents([event1, event2, event3]);
```

### Query Events

```typescript
import {
  getEvent,
  getEventsByKind,
  getEventsByPubkey,
  getEventsByTimeRange,
  queryEvents,
  getEventReferences,
} from '@/db';

// Get single event by ID
const event = await getEvent('event-id-here');

// Get all kind-1 events (notes)
const notes = await getEventsByKind(1);

// Get events from a specific author
const userEvents = await getEventsByPubkey('pubkey-hex');

// Get events in time range
const recentEvents = await getEventsByTimeRange(
  Date.now() - 86400000, // Last 24 hours
  Date.now()
);

// Query using Nostr filter format
const filtered = await queryEvents({
  kinds: [1, 6],
  authors: ['pubkey1', 'pubkey2'],
  since: Date.now() - 3600000,
  limit: 50,
});

// Find all replies to an event
const replies = await getEventReferences('original-event-id');
```

### Personal Annotations

```typescript
import {
  createAnnotation,
  getAnnotationsForEvent,
  updateAnnotation,
  deleteAnnotation,
} from '@/db';

// Add a note to an event
const annotation = await createAnnotation(
  'event-id',
  'This is my personal note about this event',
  ['important', 'research']
);

// Get all notes for an event
const notes = await getAnnotationsForEvent('event-id');

// Update annotation
await updateAnnotation(
  annotation.id,
  'Updated note content',
  ['important', 'research', 'verified']
);

// Delete annotation
await deleteAnnotation(annotation.id);
```

### Save/Load Graph States

```typescript
import {
  saveGraphState,
  loadGraphState,
  getAllGraphStates,
  getRecentGraphStates,
} from '@/db';

// Save current graph view
const state = await saveGraphState(
  'Bitcoin Discussion Graph',
  'Exploring bitcoin-related discussions from Feb 2026',
  ['event1', 'event2', 'event3'], // visible node IDs
  {
    kinds: [1],
    tags: [['t', 'bitcoin']],
    timeRange: [start, end],
  },
  'force' // layout type
);

// Load saved state
const loaded = await loadGraphState(state.id);

// Get all saved states (sorted by recent)
const allStates = await getAllGraphStates();

// Get last 5 states
const recent = await getRecentGraphStates(5);
```

### Database Maintenance

```typescript
import { clearDB, closeDB, getEventsStats } from '@/db';

// Get detailed statistics
const stats = await getEventsStats();
console.log(stats);
// {
//   totalEvents: 150,
//   byKind: { 1: 120, 6: 30 },
//   byPubkey: { 'pubkey1': 50, 'pubkey2': 100 },
//   uniquePubkeys: 2,
//   timeRange: { earliest: 1234567890, latest: 1234598765 }
// }

// Clear all data
await clearDB();

// Close database connection
closeDB();
```

## Architecture Notes

### Event Storage Strategy (Architecture #16)

This implementation follows **Architecture #16: Nostr-Native with Dynamic Graph Projection**:

1. **Ground Truth**: Nostr events stored as-is in IndexedDB (preserves signatures)
2. **On-the-Fly Projection**: Graph visualization reads from IndexedDB and projects to graph format
3. **Query Layer**: Multiple query interfaces (IndexedDB, later SPARQL) operate on same data

### Personal Annotations (Architecture #18)

Annotations are stored as local data structures (not yet Nostr events). Future enhancement: store as Nostr events (kind 30100) for potential sync to personal relay.

### Performance Considerations

- **Indexes**: All common query patterns have dedicated indexes
- **Batch Operations**: Use `storeEvents()` instead of multiple `storeEvent()` calls
- **Transactions**: Multi-operation functions use single transactions
- **Limit Results**: Always use `filter.limit` or `slice()` for large datasets

### Future Enhancements

- [ ] Full-text search integration (FlexSearch indexing)
- [ ] SPARQL query support (RDF mapping)
- [ ] Web Worker for heavy queries
- [ ] Annotation sync as Nostr events
- [ ] Export/import graph states as Nostr events (kind 30333)

## Error Handling

All functions may throw errors. Wrap in try-catch:

```typescript
try {
  const events = await queryEvents(filter);
} catch (error) {
  console.error('Database error:', error);
}
```

## Browser Compatibility

IndexedDB is supported in all modern browsers. PWA service workers enable offline access to stored data.
