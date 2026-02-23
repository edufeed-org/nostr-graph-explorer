# Nostr Graph Explorer - Usage Guide

## Getting Started

### 1. Start the Application

```bash
npm run dev
```

Open your browser to `http://localhost:3000`

### 2. Load Nostr Events

The app displays a graph visualization with controls on the left and right sides.

#### Fetching Events from Nostr Relays

Click **"Fetch Global"** in the left toolbar to:
- Connect to 6 reliable Nostr relays:
  - `wss://nostr.mutinywallet.com`
  - `wss://relay.damus.io`
  - `wss://nos.lol`
  - `wss://relay.nostr.band`
  - `wss://relay.nostr.net`
  - `wss://relay.snort.social`
- Fetch the latest 50 text notes (kind 1 events)
- Store events in IndexedDB for offline access
- Automatically visualize events as a graph

The status bar shows a loading indicator while fetching. You'll receive a notification when complete showing how many events were fetched.

#### Loading Events from Database

Click **"Load from DB"** to:
- Load all previously fetched events from IndexedDB
- Useful for offline browsing
- Instant loading (no network requests)

### 3. Navigate the Graph

#### Layout Modes

Use the layout buttons in the right toolbar:
- 🌐 **Force**: Force-directed layout (organic, dynamic)
- 🌳 **Tree**: Hierarchical tree layout
- ⭕ **Circular**: Circular layout

#### View Controls

- **Fit View** (🔲): Center and zoom to fit all nodes
- **Refresh** (🔄): Re-run the current layout algorithm

#### Mouse Controls

- **Pan**: Click and drag on empty space
- **Zoom**: Mouse wheel or trackpad
- **Select Node**: Click on a node
- **Drag Node**: Click and drag a node (force layout only)

### 4. Understanding the Graph

#### Nodes

- **📝 Note nodes**: Nostr text events (kind 1)
- **👤 User nodes**: Nostr public keys (authors)
- Node labels show first few words of content or pubkey prefix
- **Selected nodes** appear in orange with a thicker border

#### Edges

- **Authored-by**: Event → Author
- **Reference**: Event → Referenced Event (replies, quotes)
- **Mention**: Event → Mentioned User

### 5. Event Details Panel

**Click any node** in the graph to open the Event Details Panel on the right side.

The panel shows:
- **Event type** and **kind** number
- **Full content** (rendered as markdown for text notes)
- **Author pubkey** (with copy button and npub format)
- **Timestamp** (relative time like "2 hours ago")
- **Event ID** (shortened with copy button)
- **Tags** (expandable list of all event tags)

**Actions available:**
- **Add Annotation**: Add personal notes to this event (coming soon)
- **Expand Graph**: Load replies and mentions for this event
- **Open in Nostr Client**: View event on njump.me
- **Show Raw JSON**: View the complete event JSON

**Tips:**
- Click outside the panel or press the close button to dismiss
- Click "Expand Graph" to discover connected events
- Selected node stays highlighted in orange

### 6. Status Information

The status bar (bottom left) shows:
- Number of nodes currently displayed
- Number of edges (connections)
- Fetching status indicator

The relay indicator (left toolbar) shows:
- Number of configured relays (6)
- Hover to see relay info

### 7. Notifications

The app now shows helpful notifications for:
- **Connecting to relays** - When fetching starts
- **Fetch success** - Shows number of events fetched
- **Fetch errors** - If relays fail to connect
- **Database empty** - Reminds you to fetch first
- **Graph operations** - Expand, clear, load confirmations

Notifications appear at the top of the screen and auto-dismiss after a few seconds.

## Advanced Usage

### Database Layer

The app uses IndexedDB to store all Nostr events locally. This enables:

- **Offline browsing**: View events without internet connection
- **Fast filtering**: Query events by kind, author, time range
- **Personal notes**: Add private annotations to events
- **Graph snapshots**: Save and restore graph views

See `src/db/README.md` for detailed API documentation.

### Composables

#### useNostr

Manages relay connections:

```typescript
import { useNostr } from '@/composables/useNostr'

const { 
  fetchEvents,     // One-time fetch
  subscribe,       // Live subscription
  publishEvent,    // Publish to relays
  relays          // Connected relays
} = useNostr()
```

#### useEventFetcher

High-level event fetching:

```typescript
import { useEventFetcher } from '@/composables/useEventFetcher'

const {
  fetchGlobalFeed,      // Fetch global feed
  fetchByKind,          // Fetch by event kind
  fetchByAuthor,        // Fetch author's events
  expandAroundEvent,    // Get replies/mentions
  subscribeLive,        // Live updates
  isFetching           // Loading state
} = useEventFetcher()
```

#### useGraphProjection

Convert events to graph data:

```typescript
import { useGraphProjection } from '@/composables/useGraphProjection'

const { 
  eventsToGraph,   // Convert events array to nodes/edges
  filterEvents     // Filter events by criteria
} = useGraphProjection()
```

### Graph Store

Centralized graph state:

```typescript
import { useGraphStore } from '@/stores/graph'

const graphStore = useGraphStore()

// Load from database
await graphStore.loadFromDatabase()

// Expand a node
await graphStore.expandNode(nodeId)

// Apply filters
graphStore.filters.kinds = [1, 6]  // Only notes and reposts
await graphStore.applyFilters()

// Clear graph
graphStore.clearGraph()
```

## Tips & Tricks

### Performance

- **Start small**: Fetch 20-50 events initially
- **Use filters**: Filter by kind or author to reduce complexity
- **Clear regularly**: Use "Clear" button to reset the view
- **Offline mode**: Load from DB for instant rendering

### Troubleshooting

**No events showing?**
- Check browser console for errors
- Verify relay connections (default relays may be slow)
- Try "Clear" then "Fetch Global" again

**Graph is too crowded?**
- Switch to tree or circular layout
- Use "Fit View" to recenter
- Consider filtering (when filter UI is added)

**Events not persisting?**
- Check IndexedDB in browser DevTools
- Database name: `nostr-graph-db`
- Stores: events, annotations, graphStates, searchIndex

## What's Next?

### Recently Completed ✅

- **Event Details Panel**: Click nodes to see full event content, metadata, and actions
- **Node Selection**: Visual feedback with orange highlight for selected nodes
- **Event Expansion**: Load connected events (replies, mentions) from the details panel

### Coming Soon

- **Filter Sidebar**: Filter events by kind, author, time range
- **Annotation Dialog**: Add and edit personal notes on events
- **User Profiles**: Show author information on hover
- **Timeline Slider**: Navigate graph by time
- **Graph State Save/Load**: Save and restore graph views
- **SPARQL Queries**: Semantic search (Phase 2)

### Current Limitations

- No filtering UI yet (data layer supports it)
- No personal annotations UI (storage ready)
- No user profiles (author nodes are simple)
- Markdown rendering in details panel only

See the main README.md for the full roadmap.

## Architecture Overview

```
User Action
    ↓
GraphView Component
    ↓
useEventFetcher → useNostr → Nostr Relays
    ↓
IndexedDB (events.ts) ← Store Events
    ↓
Graph Store (loadFromDatabase)
    ↓
useGraphProjection → Convert to Nodes/Edges
    ↓
G6 Visualization
```

**Key Design Principle**: Nostr events in IndexedDB are the "ground truth". The graph is dynamically projected from events based on current filters and view settings.

This architecture enables:
- Multiple views of the same data
- Complex filtering without data duplication
- Offline-first experience
- Incremental graph construction
- Personal annotations without modifying public events
