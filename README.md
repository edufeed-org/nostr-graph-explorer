# Nostr Graph Explorer

PWA for Nostr event visualization with semantic knowledge graph integration.

## 🚀 Quick Start

### Install Dependencies

```bash
npm install
```

### Development Server

```bash
npm run dev
```

The app will open at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
nostr-graph/
├── src/
│   ├── components/       # Vue components
│   │   └── GraphView.vue # Main graph visualization component
│   ├── composables/      # Vue composables
│   │   ├── useNostr.ts         # Nostr relay connections
│   │   ├── useEventFetcher.ts  # Event fetching logic
│   │   └── useGraphProjection.ts # Event → Graph conversion
│   ├── stores/           # Pinia state management
│   │   └── graph.ts      # Graph data store
│   ├── db/               # IndexedDB layer
│   │   ├── schema.ts     # Database schema & initialization
│   │   ├── events.ts     # Nostr event storage/queries
│   │   ├── annotations.ts # Personal notes storage
│   │   ├── graphStates.ts # Saved graph views
│   │   ├── index.ts      # Barrel export
│   │   └── README.md     # Database documentation
│   ├── plugins/          # Vue plugins
│   │   └── vuetify.ts    # Vuetify configuration
│   ├── styles/           # Global styles
│   │   ├── main.css      # Global CSS
│   │   └── settings.scss # Vuetify SCSS variables
│   ├── App.vue           # Root component
│   ├── main.ts           # Application entry point
│   └── env.d.ts          # TypeScript definitions
├── index.html            # HTML entry point
├── vite.config.ts        # Vite configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies
```

## 🛠️ Tech Stack

## 🛠️ Tech Stack

- **Framework**: Vue 3 (Composition API)
- **UI Library**: Vuetify 3 (Material Design)
- **Graph Visualization**: AntV G6
- **State Management**: Pinia
- **Build Tool**: Vite
- **Nostr Client**: nostr-tools
- **Database**: IndexedDB (via idb)
- **Search**: FlexSearch
- **Markdown**: markdown-it

## 📖 Current Features

✅ Vue 3 + Vuetify app structure  
✅ G6 graph visualization with dynamic layouts  
✅ Pinia state management  
✅ PWA configuration (offline support)  
✅ TypeScript setup  
✅ **Complete IndexedDB layer for Nostr events**  
✅ **Personal annotations storage**  
✅ **Graph state snapshots**  
✅ **Nostr relay integration (SimplePool)**  
✅ **Event fetching and storage**  
✅ **Dynamic graph projection (Events → Nodes/Edges)**  
✅ **Fetch global Nostr feed**  
✅ **Load events from IndexedDB**  
✅ **Event Details Panel** - Click nodes to view full event content  
✅ **Node selection with visual feedback**  
✅ **Event expansion** - Load replies and mentions
- [ ] User profile cards (show author info on hover)
- [ ] Event cards with markdown rendering

### 4. Graph Features

Implement core graph features from brainstorming:

- [ ] Stepwise expansion (click to load more)
- [ ] Timeline slider
- [ ] Advanced filters
- [ ] Save/load graph states

### 5. SPARQL Integration (Phase 2)

Add semantic query capabilities:

- [ ] Comunica integration in Web Worker
- [ ] RDF mapping for Nostr events
- [ ] SPARQL query UI

## 🎯 Development Roadmap

See `_bmad-output/brainstorming/brainstorming-session-2026-02-23.md` for detailed prioritization and implementation phases.

## 📝 License

ISC
