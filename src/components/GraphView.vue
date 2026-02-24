<template>
  <v-container fluid class="graph-container pa-0">
    <div ref="graphRef" class="graph-canvas"></div>
    
    <!-- Graph controls -->
    <div class="graph-controls">
      <v-card class="pa-2" style="min-width: 280px; max-height: 90vh; overflow-y: auto;">
        <!-- Search Bar -->
        <v-text-field
          v-model="searchQuery"
          label="Search events..."
          placeholder="Content, tags, authors..."
          density="compact"
          hide-details
          prepend-inner-icon="mdi-magnify"
          clearable
          @keyup.enter="performSearch"
          @click:clear="clearSearch"
          class="mb-2"
        >
          <template #append>
            <v-btn
              size="x-small"
              icon="mdi-magnify"
              variant="tonal"
              color="primary"
              @click="performSearch"
              :loading="isSearching"
            ></v-btn>
          </template>
        </v-text-field>
        
        <!-- Search Controls -->
        <div v-if="searchQuery" class="d-flex ga-1 mb-2">
          <v-btn
            size="x-small"
            variant="tonal"
            prepend-icon="mdi-web"
            @click="searchNostrRelays"
            :loading="isSearching"
            style="flex: 1;"
          >
            Search Nostr
          </v-btn>
          <v-btn
            size="x-small"
            variant="tonal"
            :prepend-icon="searchMode === 'AND' ? 'mdi-set-center' : 'mdi-set-all'"
            @click="toggleSearchMode"
            :title="searchMode + ' mode'"
          >
            {{ searchMode }}
          </v-btn>
        </div>
        
        <!-- Search Results Counter -->
        <v-chip 
          v-if="searchActive" 
          size="small" 
          variant="flat" 
          color="primary"
          closable
          @click:close="clearSearch"
          class="mb-2"
        >
          <v-icon start>mdi-filter-check</v-icon>
          {{ searchResults.size }} matches
        </v-chip>
        
        <v-divider v-if="searchQuery || searchActive" class="mb-2"></v-divider>
        
        <v-select
          v-model="layoutMode"
          :items="layoutOptions"
          item-title="label"
          item-value="value"
          label="Layout"
          density="compact"
          hide-details
        ></v-select>
        
        <!-- Filter/Highlight Controls -->
        <div class="d-flex gap-1 mt-2">
          <v-btn 
            @click="clearFilters" 
            size="small" 
            variant="tonal" 
            color="primary"
            prepend-icon="mdi-filter-off"
            block
          >
            Clear Filters
          </v-btn>
          <v-btn 
            @click="resetHighlights" 
            size="small" 
            variant="tonal" 
            color="secondary"
            prepend-icon="mdi-format-color-highlight-off"
            block
          >
            Reset Style
          </v-btn>
        </div>
        
        <v-divider class="my-2"></v-divider>
        
        <!-- Layout Settings -->
        <div class="text-caption text-medium-emphasis mb-1">Layout Settings</div>
        
        <div v-if="layoutMode === 'd3-force'" class="mb-2">
          <div class="text-caption text-medium-emphasis mb-1">Link Force</div>
          <v-slider v-model="layoutSettings.d3Force.linkDistance" :min="10" :max="500" label="Distance" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.linkStrength" :min="0" :max="2" :step="0.1" label="Strength" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.linkIterations" :min="1" :max="10" label="Iterations" thumb-label density="compact" hide-details class="mb-2"></v-slider>
          
          <div class="text-caption text-medium-emphasis mb-1">Many-Body Force (Repulsion)</div>
          <v-slider v-model="layoutSettings.d3Force.manyBodyStrength" :min="-2000" :max="100" label="Strength" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.manyBodyTheta" :min="0" :max="1" :step="0.1" label="Theta (Accuracy)" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.manyBodyDistanceMin" :min="1" :max="100" label="Min Distance" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.manyBodyDistanceMax" :min="100" :max="2000" label="Max Distance" thumb-label density="compact" hide-details class="mb-2"></v-slider>
          
          <div class="text-caption text-medium-emphasis mb-1">Collision Force</div>
          <v-slider v-model="layoutSettings.d3Force.collideRadius" :min="5" :max="100" label="Radius" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.collideStrength" :min="0" :max="1" :step="0.1" label="Strength" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.collideIterations" :min="1" :max="10" label="Iterations" thumb-label density="compact" hide-details class="mb-2"></v-slider>
          
          <div class="text-caption text-medium-emphasis mb-1">Center Force</div>
          <v-slider v-model="layoutSettings.d3Force.centerStrength" :min="0" :max="1" :step="0.05" label="Strength" thumb-label density="compact" hide-details class="mb-2"></v-slider>
          
          <div class="text-caption text-medium-emphasis mb-1">Radial Force (Optional)</div>
          <v-slider v-model="layoutSettings.d3Force.radialStrength" :min="0" :max="1" :step="0.1" label="Strength" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.radialRadius" :min="50" :max="500" label="Radius" thumb-label density="compact" hide-details class="mb-2"></v-slider>
          
          <div class="text-caption text-medium-emphasis mb-1">Iteration Control</div>
          <v-slider v-model="layoutSettings.d3Force.alpha" :min="0" :max="1" :step="0.1" label="Alpha (Energy)" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.alphaMin" :min="0" :max="0.1" :step="0.001" label="Min Alpha" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.alphaDecay" :min="0" :max="0.1" :step="0.001" label="Alpha Decay" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.d3Force.velocityDecay" :min="0" :max="1" :step="0.05" label="Velocity Decay" thumb-label density="compact" hide-details></v-slider>
        </div>
        
        <div v-else-if="layoutMode === 'force'" class="mb-2">
          <v-slider v-model="layoutSettings.force.nodeSize" :min="20" :max="100" label="Node Size" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.force.nodeSpacing" :min="10" :max="100" label="Node Spacing" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-switch v-model="layoutSettings.force.preventOverlap" label="Prevent Overlap" color="primary" density="compact" hide-details></v-switch>
        </div>
        
        <div v-else-if="layoutMode === 'circular'" class="mb-2">
          <v-slider v-model="layoutSettings.circular.radius" :min="200" :max="1000" label="Radius" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.startRadius" :min="100" :max="500" label="Start Radius (Spiral)" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.endRadius" :min="400" :max="1200" label="End Radius (Spiral)" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.divisions" :min="1" :max="10" label="Divisions" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.angleRatio" :min="0.1" :max="2" :step="0.1" label="Angle Ratio" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.startAngle" :min="0" :max="6.28" :step="0.1" label="Start Angle" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.endAngle" :min="0" :max="6.28" :step="0.1" label="End Angle" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.nodeSize" :min="20" :max="120" label="Node Size" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.circular.nodeSpacing" :min="5" :max="50" label="Node Spacing" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-select v-model="layoutSettings.circular.ordering" :items="['topology', 'topology-directed', 'degree', null]" label="Ordering" density="compact" hide-details class="mb-1"></v-select>
          <v-switch v-model="layoutSettings.circular.clockwise" label="Clockwise" color="primary" density="compact" hide-details></v-switch>
        </div>
        
        <div v-else-if="layoutMode === 'compact-box'" class="mb-2">
          <v-select v-model="layoutSettings.compactBox.direction" :items="['LR', 'RL', 'TB', 'BT', 'H', 'V']" label="Direction" density="compact" hide-details class="mb-1"></v-select>
          <v-slider v-model="layoutSettings.compactBox.nodeWidth" :min="20" :max="100" label="Node Width" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.compactBox.nodeHeight" :min="20" :max="100" label="Node Height" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.compactBox.hGap" :min="50" :max="200" label="Horizontal Gap" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.compactBox.vGap" :min="50" :max="200" label="Vertical Gap" thumb-label density="compact" hide-details></v-slider>
        </div>
        
        <div v-else-if="layoutMode === 'dagre'" class="mb-2">
          <v-select v-model="layoutSettings.dagre.rankdir" :items="['TB', 'BT', 'LR', 'RL']" label="Direction" density="compact" hide-details class="mb-1"></v-select>
          <v-slider v-model="layoutSettings.dagre.nodesep" :min="20" :max="200" label="Node Separation" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.dagre.ranksep" :min="50" :max="300" label="Rank Separation" thumb-label density="compact" hide-details></v-slider>
        </div>
        
        <div v-else-if="layoutMode === 'concentric'" class="mb-2">
          <v-slider v-model="layoutSettings.concentric.minNodeSpacing" :min="10" :max="100" label="Min Node Spacing" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-switch v-model="layoutSettings.concentric.preventOverlap" label="Prevent Overlap" color="primary" density="compact" hide-details></v-switch>
        </div>
        
        <div v-else-if="layoutMode === 'grid'" class="mb-2">
          <v-slider v-model="layoutSettings.grid.rows" :min="1" :max="20" label="Rows" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.grid.cols" :min="1" :max="20" label="Columns" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-switch v-model="layoutSettings.grid.preventOverlap" label="Prevent Overlap" color="primary" density="compact" hide-details></v-switch>
        </div>
        
        <div v-else-if="layoutMode === 'radial'" class="mb-2">
          <v-slider v-model="layoutSettings.radial.unitRadius" :min="50" :max="200" label="Unit Radius" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-switch v-model="layoutSettings.radial.preventOverlap" label="Prevent Overlap" color="primary" density="compact" hide-details></v-switch>
        </div>
        
        <div v-else-if="layoutMode === 'dendrogram'" class="mb-2">
          <v-select v-model="layoutSettings.dendrogram.direction" :items="['LR', 'RL', 'TB', 'BT', 'H', 'V']" label="Direction" density="compact" hide-details class="mb-1"></v-select>
          <v-slider v-model="layoutSettings.dendrogram.nodeSep" :min="10" :max="100" label="Node Separation" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.dendrogram.rankSep" :min="50" :max="200" label="Rank Separation" thumb-label density="compact" hide-details></v-slider>
        </div>
        
        <div v-else-if="layoutMode === 'mindmap'" class="mb-2">
          <v-select v-model="layoutSettings.mindmap.direction" :items="['H', 'V']" label="Direction" density="compact" hide-details class="mb-1"></v-select>
          <v-slider v-model="layoutSettings.mindmap.hGap" :min="20" :max="150" label="Horizontal Gap" thumb-label density="compact" hide-details class="mb-1"></v-slider>
          <v-slider v-model="layoutSettings.mindmap.vGap" :min="20" :max="150" label="Vertical Gap" thumb-label density="compact" hide-details></v-slider>
        </div>
        
        <div v-else class="mb-2">
          <p class="text-caption text-medium-emphasis">No settings for this layout</p>
        </div>
        
        <v-divider class="my-2"></v-divider>
        
        <div class="d-flex ga-1">
          <v-btn icon="mdi-fit-to-screen" size="small" @click="fitView" title="Fit to screen"></v-btn>
          <v-btn icon="mdi-pause" size="small" @click="stopAnimation" title="Stop animation"></v-btn>
          <v-btn icon="mdi-refresh" size="small" @click="refreshGraph" title="Refresh"></v-btn>
        </div>
      </v-card>
    </div>
    
    <!-- Data controls -->
    <div class="data-controls">
      <v-card class="pa-2">
        <div class="d-flex flex-column ga-2">
          <v-btn
            size="small"
            color="primary"
            prepend-icon="mdi-download"
            :loading="isFetching"
            @click="fetchGlobal"
          >
            Fetch Global
          </v-btn>
          
          <v-btn
            size="small"
            prepend-icon="mdi-database"
            @click="loadFromDb"
          >
            Load from DB
          </v-btn>
          
          <v-btn
            size="small"
            prepend-icon="mdi-delete"
            @click="clearAll"
          >
            Clear
          </v-btn>

          <v-divider class="my-1"></v-divider>

          <v-tooltip :text="`${relayManager.stats.value.enabled} enabled, ${relayManager.stats.value.connected} connected`" location="end">
            <template #activator="{ props }">
              <v-chip
                v-bind="props"
                size="small"
                variant="tonal"
                prepend-icon="mdi-server-network"
                :color="relayManager.stats.value.connected > 0 ? 'success' : 'error'"
                @click="relayDialog.show = true"
                style="cursor: pointer;"
              >
                {{ relayManager.stats.value.total }} Relays
              </v-chip>
            </template>
          </v-tooltip>
        </div>
      </v-card>
    </div>
    
    <!-- Status bar -->
    <div class="status-bar">
      <v-chip size="small" variant="flat">
        <v-icon start>mdi-chart-bubble</v-icon>
        {{ nodeCount }} nodes
      </v-chip>
      <v-chip size="small" variant="flat" class="ml-2">
        <v-icon start>mdi-connection</v-icon>
        {{ edgeCount }} edges
      </v-chip>
      <v-chip v-if="isFetching" size="small" variant="flat" color="primary" class="ml-2">
        <v-icon start>mdi-loading mdi-spin</v-icon>
        Fetching...
      </v-chip>
    </div>

    <!-- Snackbar for notifications -->
    <v-snackbar
      v-model="snackbar.show"
      :color="snackbar.color"
      :timeout="snackbar.timeout"
      location="top"
    >
      {{ snackbar.message }}
      <template #actions>
        <v-btn variant="text" @click="snackbar.show = false">Close</v-btn>
      </template>
    </v-snackbar>
    
    <!-- Context Menu -->
    <v-menu
      v-model="contextMenu.show"
      :location="'bottom'"
      :style="{ position: 'fixed', left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
    >
      <v-list density="compact" min-width="200">
        <v-list-subheader>{{ contextMenu.title }}</v-list-subheader>
        
        <v-list-item
          v-for="action in contextMenu.actions"
          :key="action.label"
          @click="action.handler"
          :prepend-icon="action.icon"
        >
          <v-list-item-title>{{ action.label }}</v-list-item-title>
        </v-list-item>
      </v-list>
    </v-menu>
    
    <!-- Relay Manager Dialog -->
    <v-dialog v-model="relayDialog.show" max-width="700">
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>Relay Manager</span>
          <v-chip size="small" :color="relayManager.stats.value.connected > 0 ? 'success' : 'error'">
            {{ relayManager.stats.value.connected }}/{{ relayManager.stats.value.enabled }} Connected
          </v-chip>
        </v-card-title>
        
        <v-divider></v-divider>
        
        <v-card-text style="max-height: 500px; overflow-y: auto;">
          <!-- Add New Relay -->
          <div class="mb-4">
            <v-text-field
              v-model="newRelayUrl"
              label="Add New Relay"
              placeholder="wss://relay.example.com"
              density="compact"
              prepend-inner-icon="mdi-plus"
              :error-messages="relayManager.error.value || undefined"
              @keyup.enter="handleAddRelay"
            >
              <template #append>
                <v-btn
                  size="small"
                  color="primary"
                  @click="handleAddRelay"
                  :loading="relayManager.loading.value"
                >
                  Add
                </v-btn>
              </template>
            </v-text-field>
          </div>
          
          <!-- Relay List -->
          <div v-if="relayManager.relays.value.length > 0">
            <div
              v-for="relay in relayManager.relays.value"
              :key="relay.url"
              class="relay-item"
            >
              <v-icon 
                size="small"
                :color="getRelayStatusColor(relay.status)"
                :icon="getRelayStatusIcon(relay.status)"
              ></v-icon>
              
              <div class="relay-info">
                <div class="relay-url">{{ relay.url }}</div>
                <div class="relay-details">
                  <span v-if="relay.lastConnected">
                    <v-icon size="x-small">mdi-clock-outline</v-icon>
                    {{ formatRelativeTime(relay.lastConnected) }}
                  </span>
                  <span v-if="relay.latency !== null">
                    <v-icon size="x-small">mdi-speedometer</v-icon>
                    {{ relay.latency }}ms
                  </span>
                  <span>
                    <v-icon size="x-small">mdi-email-multiple-outline</v-icon>
                    {{ relay.eventsReceived }} events
                  </span>
                </div>
                <div v-if="relay.lastError" class="relay-error">
                  {{ relay.lastError }}
                </div>
              </div>
              
              <div class="relay-actions">
                <v-btn
                  size="small"
                  :icon="relay.enabled ? 'mdi-pause' : 'mdi-play'"
                  :color="relay.enabled ? 'warning' : 'success'"
                  variant="tonal"
                  @click="handleToggleRelay(relay.url)"
                ></v-btn>
                <v-btn
                  size="small"
                  icon="mdi-delete"
                  color="error"
                  variant="tonal"
                  @click="handleRemoveRelay(relay.url)"
                ></v-btn>
              </div>
            </div>
          </div>
          
          <v-alert
            v-if="relayManager.relays.value.length === 0"
            type="info"
            variant="tonal"
            class="mt-4"
          >
            No relays configured. Add your first relay above.
          </v-alert>
        </v-card-text>
        
        <v-divider></v-divider>
        
        <v-card-actions>
          <v-btn
            prepend-icon="mdi-refresh"
            @click="handleTestConnections"
            :loading="testingConnections"
          >
            Test Connections
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn @click="relayDialog.show = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Graph } from '@antv/g6'
import { useGraphStore } from '../stores/graph'
import { useEventFetcher } from '../composables/useEventFetcher'
import { useRelayManager } from '../composables/useRelayManager'
import { useNostr } from '../composables/useNostr'
import { storeToRefs } from 'pinia'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

const graphRef = ref<HTMLElement | null>(null)
let graph: Graph | null = null

const layoutMode = ref('circular')

// All layout options with tree/non-tree classification
const allLayoutOptions = [
  { label: 'Circular Layout', value: 'circular', requiresTree: false },
  { label: 'Concentric Layout', value: 'concentric', requiresTree: false },
  { label: 'D3 Force-Directed Layout', value: 'd3-force', requiresTree: false },
  { label: 'Force-directed Layout', value: 'force', requiresTree: false },
  { label: 'ForceAtlas2 Layout', value: 'force-atlas2', requiresTree: false },
  { label: 'Fruchterman Layout', value: 'fruchterman', requiresTree: false },
  { label: 'Grid Layout', value: 'grid', requiresTree: false },
  { label: 'MDS Layout', value: 'mds', requiresTree: false },
  { label: 'Radial Layout', value: 'radial', requiresTree: false },
  { label: 'Random Layout', value: 'random', requiresTree: false },
  { label: 'AntV Dagre Layout', value: 'dagre', requiresTree: true },
  { label: 'CompactBox Tree', value: 'compact-box', requiresTree: true },
  { label: 'Dendrogram Tree', value: 'dendrogram', requiresTree: true },
  { label: 'Mindmap Tree', value: 'mindmap', requiresTree: true },
  { label: 'Indented Tree', value: 'indented', requiresTree: true },
  { label: 'Fishbone Diagram', value: 'fishbone', requiresTree: true },
]

// Layout settings with defaults
const layoutSettings = ref({
  d3Force: {
    // Link force
    linkDistance: 150,
    linkStrength: 0.6,
    linkIterations: 1,
    // Many-body force (node repulsion/attraction)
    manyBodyStrength: -300,
    manyBodyTheta: 0.9,
    manyBodyDistanceMin: 1,
    manyBodyDistanceMax: 1000,
    // Center force
    centerStrength: 0.1,
    // Collision force
    collideRadius: 30,
    collideStrength: 0.8,
    collideIterations: 1,
    // Radial force
    radialStrength: 0,
    radialRadius: 200,
    // Iteration control
    alpha: 1,
    alphaMin: 0.001,
    alphaDecay: 0.028,
    velocityDecay: 0.4,
  },
  force: {
    nodeSize: 60,
    nodeSpacing: 20,
    preventOverlap: true,
  },
  circular: {
    radius: 600,
    startRadius: 300,
    endRadius: 900,
    divisions: 5,
    angleRatio: 1,
    clockwise: true,
    ordering: 'degree',
    startAngle: 0,
    endAngle: 6.28,
    nodeSize: 60,
    nodeSpacing: 10,
  },
  compactBox: {
    direction: 'LR',
    nodeWidth: 60,
    nodeHeight: 60,
    hGap: 120,
    vGap: 80,
  },
  dagre: {
    rankdir: 'LR',
    nodesep: 100,
    ranksep: 200,
  },
  concentric: {
    minNodeSpacing: 50,
    preventOverlap: true,
  },
  grid: {
    rows: 5,
    cols: 5,
    preventOverlap: true,
  },
  radial: {
    unitRadius: 100,
    preventOverlap: true,
  },
  dendrogram: {
    direction: 'LR',
    nodeSep: 50,
    rankSep: 100,
  },
  mindmap: {
    direction: 'H',
    hGap: 50,
    vGap: 50,
  },
})

const graphStore = useGraphStore()
const { nodeCount, edgeCount, graphData } = storeToRefs(graphStore)

// Check if the current graph structure is tree-compatible (acyclic)
const isTreeCompatible = computed(() => {
  if (!graphData.value || !graphData.value.edges || !graphData.value.nodes) {
    return false // Empty graph is not a tree
  }
  
  const edges = graphData.value.edges
  const nodes = graphData.value.nodes
  
  if (edges.length === 0 || nodes.length === 0) {
    return false
  }
  
  // Build adjacency list
  const adj = new Map<string, string[]>()
  const inDegree = new Map<string, number>()
  
  nodes.forEach(node => {
    adj.set(node.id, [])
    inDegree.set(node.id, 0)
  })
  
  edges.forEach(edge => {
    const neighbors = adj.get(edge.source) || []
    neighbors.push(edge.target)
    adj.set(edge.source, neighbors)
    inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1)
  })
  
  // For a tree: each node (except root) should have exactly one parent
  // and there should be no cycles
  const visited = new Set<string>()
  const recStack = new Set<string>()
  
  function hasCycle(nodeId: string): boolean {
    visited.add(nodeId)
    recStack.add(nodeId)
    
    const neighbors = adj.get(nodeId) || []
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) return true
      } else if (recStack.has(neighbor)) {
        return true // Cycle detected
      }
    }
    
    recStack.delete(nodeId)
    return false
  }
  
  // Check for cycles starting from nodes with 0 in-degree (potential roots)
  for (const node of nodes) {
    if (!visited.has(node.id)) {
      if (hasCycle(node.id)) {
        return false // Cycle found
      }
    }
  }
  
  return true // No cycles, tree-compatible
})

// Filter layout options based on graph structure
const layoutOptions = computed(() => {
  return allLayoutOptions.filter(option => {
    if (option.requiresTree) {
      return isTreeCompatible.value
    }
    return true
  })
})

const { fetchGlobalFeed, fetchInitialEvents, fetchByAuthor, expandAroundEvent, fetchUserGraph, isFetching } = useEventFetcher()
const { testAllRelayConnections, loadRelaysFromDB } = useNostr()

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

// Context menu state
const contextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  title: '',
  actions: [] as Array<{ label: string, icon: string, handler: () => void }>
})

// Search state
const searchQuery = ref('')
const searchResults = ref<Set<string>>(new Set())
const searchActive = ref(false)
const searchMode = ref<'AND' | 'OR'>('AND')
const isSearching = ref(false)

// Relay manager
const relayManager = useRelayManager()
const relayDialog = ref({ show: false })
const newRelayUrl = ref('')
const testingConnections = ref(false)

// Helper: Get border color for event kind
function getKindColor(kind: number): string {
  const colors: Record<number, string> = {
    0: '#3b82f6',     // Profile - blue
    1: '#10b981',     // Note - green
    3: '#f59e0b',     // Contacts - amber
    4: '#8b5cf6',     // DM - purple
    5: '#ef4444',     // Delete - red
    6: '#06b6d4',     // Repost - cyan
    7: '#ec4899',     // Reaction - pink
    9735: '#f59e0b',  // Zap - amber/gold
    30023: '#6366f1', // Article - indigo
  }
  return colors[kind] || '#6b7280' // gray default
}

// Helper: Extract tags from event
function extractTags(event: any): string[] {
  if (!event.tags) return []
  return event.tags
    .filter((tag: any) => tag[0] === 't' && tag[1])
    .map((tag: any) => tag[1])
}

// Helper: Extract mentions from event
function extractMentions(event: any): Array<{pubkey: string, relay?: string}> {
  if (!event.tags) return []
  return event.tags
    .filter((tag: any) => tag[0] === 'p' && tag[1])
    .map((tag: any) => ({ pubkey: tag[1], relay: tag[2] }))
}

// Helper: Check if event is a reply
function isReply(event: any): { isReply: boolean, replyTo?: string, root?: string } {
  if (!event.tags) return { isReply: false }
  
  const eTags = event.tags.filter((tag: any) => tag[0] === 'e' && tag[1])
  if (eTags.length === 0) return { isReply: false }
  
  // Find root and reply markers
  const rootTag = eTags.find((tag: any) => tag[3] === 'root')
  const replyTag = eTags.find((tag: any) => tag[3] === 'reply')
  
  return {
    isReply: true,
    root: rootTag ? rootTag[1] : eTags[0][1],
    replyTo: replyTag ? replyTag[1] : (eTags.length > 1 ? eTags[eTags.length - 1][1] : undefined)
  }
}

// Helper: Format relative time
function getRelativeTime(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp)
  
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`
  return new Date(timestamp * 1000).toLocaleDateString()
}

// Helper: Count engagement metrics for an event
function getEngagementMetrics(eventId: string): {
  replies: number
  reactions: number
  reposts: number
  zaps: number
} {
  const metrics = { replies: 0, reactions: 0, reposts: 0, zaps: 0 }
  
  // Count from all nodes in the graph
  graphStore.nodes.forEach(node => {
    const event = node.data?.event
    if (!event) return
    
    // Check if this event references the target event
    const eTags = event.tags?.filter((t: string[]) => t[0] === 'e') || []
    const referencesEvent = eTags.some((t: string[]) => t[1] === eventId)
    
    if (referencesEvent) {
      if (event.kind === 1) metrics.replies++
      else if (event.kind === 7) metrics.reactions++
      else if (event.kind === 6) metrics.reposts++
      else if (event.kind === 9735) metrics.zaps++
    }
  })
  
  return metrics
}

// Helper: Render HTML for event node
function renderEventNode(d: any): string {
  // Handle tag nodes
  if (d.data?.type === 'tag') {
    const tag = d.data?.tag || ''
    const nodeId = d.id || ''
    const tagColor = d.data?.color || '#f59e0b'
    
    return `
      <div class="node-circle tag-node" data-item-id="${nodeId}" data-tag="${tag}" style="background: ${tagColor}; border: 4px solid ${tagColor};">
        <span class="node-tag-label">#${tag}</span>
      </div>
    `
  }
  
  // Handle pubkey (author) nodes
  if (d.data?.type === 'pubkey') {
    const profile = d.data?.profile
    const expanded = !!d.data?.expanded
    
    // If collapsed, show compact profile circle
    if (!expanded) {
      const nodeId = d.id || ''
      const pubkey = d.data?.pubkey || ''
      
      if (profile?.picture) {
        // Show profile picture
        return `
          <div class="node-circle pubkey-node with-picture" data-item-id="${nodeId}" data-pubkey="${pubkey}" style="background: #fff;">
            <img src="${profile.picture}" class="profile-picture" alt="${profile.name || 'User'}" />
          </div>
        `
      } else {
        // Show default user icon
        return `
          <div class="node-circle pubkey-node" data-item-id="${nodeId}" data-pubkey="${pubkey}" style="background: #6366f1;">
            <span class="node-emoji">👤</span>
          </div>
        `
      }
    }
    
    // Expanded: show profile details if available
    if (profile) {
      const safe = (s: string) =>
        String(s || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
      
      const displayName = safe(profile.name || profile.display_name || 'Unknown User')
      const about = safe(profile.about || 'No bio available')
      const nip05 = safe(profile.nip05 || '')
      const pubkey = safe(d.data?.pubkey || '')
      const nodeId = safe(d.id || '')
      
      return `
        <div class="event-node expanded profile-card" data-item-id="${nodeId}">
          <div class="event-titlebar" data-role="titlebar">
            <div class="event-left">
              <span class="event-badge">👤 Profile</span>
              <span class="event-title">${displayName}</span>
            </div>
            <div class="event-close" data-role="close">×</div>
          </div>
          <div class="event-body">
            ${profile.picture ? `
              <div class="profile-picture-large">
                <img src="${profile.picture}" alt="${displayName}" />
              </div>
            ` : ''}
            <div class="event-meta">
              <div><strong>Name:</strong> ${displayName}</div>
              ${nip05 ? `<div><strong>NIP-05:</strong> ${nip05}</div>` : ''}
              <div><strong>Pubkey:</strong> ${pubkey.slice(0, 16)}...</div>
            </div>
            <div class="event-content profile-bio">${about}</div>
          </div>
        </div>
      `
    }
    
    // No profile data available
    const noProfNodeId = d.id || ''
    const noProfPubkey = d.data?.pubkey || ''
    return `
      <div class="node-circle pubkey-node" data-item-id="${noProfNodeId}" data-pubkey="${noProfPubkey}" style="background: #6366f1;">
        <span class="node-emoji">👤</span>
      </div>
    `
  }
  
  // Handle event nodes
  const event = d.data?.event
  if (!event) return '<div class="node-circle loading"><span>?</span></div>'
  
  const expanded = !!d.data?.expanded
  const kind = event.kind
  const typeLabel = getEventTypeLabel(kind)
  const kindColor = getKindColor(kind)
  
  // If collapsed, render as simple circle
  if (!expanded) {
    const emoji = typeLabel.split(' ')[0] // Get just the emoji
    
    return `
      <div class="node-circle kind-${kind}" style="background: ${kindColor}; border: 3px solid ${kindColor};">
        <span class="node-emoji">${emoji}</span>
      </div>
    `
  }
  
  // Expanded: render detailed card with all metadata
  const safe = (s: string) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  
  const nodeId = safe(d.id || '')
  const timestamp = getRelativeTime(event.created_at)
  const absoluteTime = new Date(event.created_at * 1000).toLocaleString()
  
  // Extract metadata
  const tags = extractTags(event)
  const mentions = extractMentions(event)
  const threadInfo = isReply(event)
  
  // Get engagement metrics
  const metrics = getEngagementMetrics(event.id)
  
  // Get author info (from graph data if available)
  const authorPubkey = safe(event.pubkey)
  const authorDisplay = authorPubkey.slice(0, 8) + '...'
  
  // Format content with markdown for kind 1 and 30023
  let bodyContent = ''
  if (kind === 1 || kind === 30023) {
    bodyContent = md.render(event.content)
  } else if (kind === 0) {
    try {
      const profile = JSON.parse(event.content)
      bodyContent = `<pre>${safe(JSON.stringify(profile, null, 2))}</pre>`
    } catch {
      bodyContent = safe(event.content)
    }
  } else {
    bodyContent = safe(event.content)
  }
  
  // Calculate dynamic height based on content
  const contentLength = event.content.length
  const baseHeight = 200
  const heightPerChar = 0.3
  const maxHeight = 600
  const minHeight = 200
  const dynamicHeight = Math.min(maxHeight, Math.max(minHeight, baseHeight + contentLength * heightPerChar))
  
  return `
    <div class="nostr-card" 
         data-item-id="${nodeId}" 
         data-kind="${kind}"
         data-author="${authorPubkey}"
         style="border-left: 4px solid ${kindColor}; min-height: ${Math.min(300, dynamicHeight)}px;">
      
      <!-- Card Header -->
      <div class="card-header">
        <div class="card-header-left">
          <span class="kind-badge" style="background: ${kindColor};">${typeLabel}</span>
          ${threadInfo.isReply ? '<span class="thread-indicator" title="Reply">↩️</span>' : ''}
          ${kind === 6 ? '<span class="thread-indicator" title="Repost">🔄</span>' : ''}
        </div>
        <button class="card-close" data-role="close" title="Close">×</button>
      </div>
      
      <!-- Author Info -->
      <div class="card-author" data-author-pubkey="${authorPubkey}">
        <div class="author-avatar" style="background: ${kindColor};">👤</div>
        <div class="author-info">
          <div class="author-name" title="${authorPubkey}">${authorDisplay}</div>
          <div class="card-timestamp" title="${absoluteTime}">${timestamp}</div>
        </div>
      </div>
      
      <!-- Content -->
      <div class="card-content markdown-content">
        ${bodyContent}
      </div>
      
      <!-- Tags -->
      ${tags.length > 0 ? `
        <div class="card-tags">
          ${tags.map(tag => `<span class="tag-badge" data-tag="${safe(tag)}">#${safe(tag)}</span>`).join('')}
        </div>
      ` : ''}
      
      <!-- Mentions -->
      ${mentions.length > 0 ? `
        <div class="card-mentions">
          <span class="mentions-label">Mentioned:</span>
          ${mentions.slice(0, 3).map(m => `<span class="mention-badge" data-mention="${m.pubkey}" title="${m.pubkey}">@${m.pubkey.slice(0, 8)}...</span>`).join('')}
          ${mentions.length > 3 ? `<span class="mention-more">+${mentions.length - 3} more</span>` : ''}
        </div>
      ` : ''}
      
      <!-- Footer with engagement metrics -->
      <div class="card-footer">
        <span class="footer-stat" title="Replies">💬 ${metrics.replies || 0}</span>
        <span class="footer-stat" title="Reactions">❤️ ${metrics.reactions || 0}</span>
        <span class="footer-stat" title="Reposts">🔄 ${metrics.reposts || 0}</span>
        <span class="footer-stat" title="Zaps">⚡ ${metrics.zaps || 0}</span>
      </div>
      
    </div>
  `
}

function getEventTypeLabel(kind: number): string {
  const labels: Record<number, string> = {
    0: '👤 Profile',
    1: '📝 Note',
    3: '👥 Contacts',
    4: '💬 DM',
    5: '🗑️ Delete',
    6: '🔄 Repost',
    7: '❤️ Reaction',
    9735: '⚡ Zap',
    30023: '📄 Article',
  }
  return labels[kind] || `Kind ${kind}`
}

// Helper: Get layout config based on layout type
function getLayoutConfig(type: string) {
  const settings = layoutSettings.value
  
  // Helper: Get actual node size - always use card size for layout spacing
  // (Visual rendering stays small when collapsed, but layout reserves full card space)
  const getNodeSize = (_node: any) => {
    return Math.max(400, 300) // Use max dimension for radius calculations (always card size)
  }
  
  const getNodeWidth = (_node: any) => {
    return 400 // Always reserve card width
  }
  
  const getNodeHeight = (_node: any) => {
    return 300 // Always reserve card height
  }
  
  switch (type) {
    case 'force':
      return {
        type: 'force',
        preventOverlap: settings.force.preventOverlap,
        nodeSize: getNodeSize,
        nodeSpacing: settings.force.nodeSpacing,
      }
      
    case 'd3-force':
      return {
        type: 'd3-force',
        link: {
          distance: settings.d3Force.linkDistance,
          strength: settings.d3Force.linkStrength,
          iterations: settings.d3Force.linkIterations,
        },
        manyBody: {
          strength: settings.d3Force.manyBodyStrength,
          theta: settings.d3Force.manyBodyTheta,
          distanceMin: settings.d3Force.manyBodyDistanceMin,
          distanceMax: settings.d3Force.manyBodyDistanceMax,
        },
        center: {
          strength: settings.d3Force.centerStrength,
        },
        collide: {
          radius: (node: any) => {
            const baseSize = getNodeSize(node)
            // Add collision radius offset to the actual node size
            return baseSize / 2 + settings.d3Force.collideRadius
          },
          strength: settings.d3Force.collideStrength,
          iterations: settings.d3Force.collideIterations,
        },
        radial: settings.d3Force.radialStrength > 0 ? {
          strength: settings.d3Force.radialStrength,
          radius: settings.d3Force.radialRadius,
        } : undefined,
        alpha: settings.d3Force.alpha,
        alphaMin: settings.d3Force.alphaMin,
        alphaDecay: settings.d3Force.alphaDecay,
        velocityDecay: settings.d3Force.velocityDecay,
      }
      
    case 'circular':
      return {
        type: 'circular',
        radius: settings.circular.radius,
        startRadius: settings.circular.startRadius,
        endRadius: settings.circular.endRadius,
        divisions: settings.circular.divisions,
        angleRatio: settings.circular.angleRatio,
        clockwise: settings.circular.clockwise,
        ordering: settings.circular.ordering,
        startAngle: settings.circular.startAngle,
        endAngle: settings.circular.endAngle,
        nodeSize: getNodeSize,
        nodeSpacing: settings.circular.nodeSpacing,
      }
      
    case 'compact-box':
      return {
        type: 'compact-box',
        direction: settings.compactBox.direction,
        getHeight: (node: any) => getNodeHeight(node),
        getWidth: (node: any) => getNodeWidth(node),
        getVGap: () => settings.compactBox.vGap,
        getHGap: () => settings.compactBox.hGap,
      }
      
    case 'dagre':
      return {
        type: 'dagre',
        rankdir: settings.dagre.rankdir,
        nodesep: settings.dagre.nodesep,
        ranksep: settings.dagre.ranksep,
      }
      
    case 'concentric':
      return {
        type: 'concentric',
        minNodeSpacing: settings.concentric.minNodeSpacing,
        preventOverlap: settings.concentric.preventOverlap,
        nodeSize: getNodeSize,
      }
      
    case 'grid':
      return {
        type: 'grid',
        rows: settings.grid.rows,
        cols: settings.grid.cols,
        preventOverlap: settings.grid.preventOverlap,
        nodeSize: getNodeSize,
      }
      
    case 'radial':
      return {
        type: 'radial',
        unitRadius: settings.radial.unitRadius,
        preventOverlap: settings.radial.preventOverlap,
        nodeSize: getNodeSize,
      }
      
    case 'dendrogram':
      return {
        type: 'dendrogram',
        direction: settings.dendrogram.direction,
        nodeSep: settings.dendrogram.nodeSep,
        rankSep: settings.dendrogram.rankSep,
      }
      
    case 'mindmap':
      return {
        type: 'mindmap',
        direction: settings.mindmap.direction,
        getHGap: () => settings.mindmap.hGap,
        getVGap: () => settings.mindmap.vGap,
      }
      
    case 'indented':
      return {
        type: 'indented',
        indent: 80,
      }
      
    case 'fruchterman':
      return {
        type: 'fruchterman',
        gravity: 5,
        speed: 5,
      }
      
    case 'force-atlas2':
      return {
        type: 'force-atlas2',
        kr: 100,
        kg: 1,
      }
      
    case 'mds':
      return {
        type: 'mds',
        linkDistance: 100,
      }
      
    case 'fishbone':
      return {
        type: 'fishbone',
        direction: 'LR',
      }
      
    case 'random':
      return {
        type: 'random',
      }
      
    default:
      return {
        type,
        preventOverlap: true,
      }
  }
}

// Apply layout settings
function applyLayoutSettings() {
  if (graph) {
    graph.setLayout(getLayoutConfig(layoutMode.value))
    graph.layout()
    
    setTimeout(() => {
      if (graph) {
        graph.stopLayout()
      }
    }, 4000)
  }
}

// Watch for tree compatibility changes and switch layout if needed
watch(isTreeCompatible, (isTree) => {
  const currentOption = allLayoutOptions.find(opt => opt.value === layoutMode.value)
  if (currentOption?.requiresTree && !isTree) {
    // Current layout requires tree but graph is not tree-compatible
    // Switch to a safe default layout
    layoutMode.value = 'circular'
    showMessage('Graph structure changed - switched to circular layout', 'info')
  }
})

// Context menu helper functions
function showContextMenu(x: number, y: number, title: string, actions: Array<{ label: string, icon: string, handler: () => void }>) {
  contextMenu.value = { show: true, x, y, title, actions }
}

// Helper: Create or get author node
function createAuthorNode(pubkey: string, profile?: any) {
  // Check if author node already exists
  const existingNode = graphStore.nodes.find((n: any) => n.id === pubkey)
  if (existingNode) {
    // Update profile if provided
    if (profile) {
      existingNode.data.profile = profile
      existingNode.label = `👤 ${profile.name || profile.display_name || pubkey.slice(0, 8)}`
    }
    return pubkey
  }
  
  // Create new author node
  const displayName = profile?.name || profile?.display_name || pubkey.slice(0, 8)
  const authorNode = {
    id: pubkey,
    label: `👤 ${displayName}`,
    data: {
      type: 'pubkey',
      pubkey: pubkey,
      profile: profile || null,
    }
  }
  
  graphStore.addNode(authorNode)
  return pubkey
}

// Helper: Connect events to author node
function connectEventsToAuthor(pubkey: string) {
  const edges: any[] = []
  
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    if (!event) return
    
    // Check if this event is by this author
    if (event.pubkey === pubkey) {
      // Create edge from event to author
      const edge = {
        source: event.id,
        target: pubkey,
        data: {
          type: 'authored-by',
        }
      }
      edges.push(edge)
    }
  })
  
  edges.forEach(edge => graphStore.addEdge(edge))
  return edges.length
}

// Helper: Create or get tag node
function createTagNode(tag: string) {
  const tagNodeId = `tag:${tag.toLowerCase()}`
  
  // Check if tag node already exists
  const existingNode = graphStore.nodes.find((n: any) => n.id === tagNodeId)
  if (existingNode) {
    return tagNodeId
  }
  
  // Create new tag node
  const tagNode = {
    id: tagNodeId,
    label: `#${tag}`,
    data: {
      type: 'tag',
      tag: tag,
      color: '#f59e0b',
    }
  }
  
  graphStore.addNode(tagNode)
  return tagNodeId
}

// Helper: Connect events with tag to tag node
function connectEventsToTag(tag: string, tagNodeId: string) {
  const edges: any[] = []
  
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    if (!event) return
    
    // Check if this event has the tag
    const hasTag = event.tags?.some((t: string[]) => 
      t[0] === 't' && t[1]?.toLowerCase() === tag.toLowerCase()
    )
    
    if (hasTag) {
      // Create edge from event to tag node
      const edge = {
        source: event.id,
        target: tagNodeId,
        data: {
          type: 'has-tag',
        }
      }
      edges.push(edge)
    }
  })
  
  // Add all edges
  edges.forEach(edge => graphStore.addEdge(edge))
  return edges.length
}

// Expansion functions
async function expandByTag(tag: string) {
  contextMenu.value.show = false
  showMessage(`Expanding posts with #${tag}...`, 'info')
  
  try {
    // Create tag node
    const tagNodeId = createTagNode(tag)
    
    // Fetch events with this t-tag
    const events = await fetchInitialEvents([
      { '#t': [tag.toLowerCase()], kinds: [1, 30023], limit: 50 }
    ], { timeout: 5000 })
    
    if (events.length > 0) {
      graphStore.updateWithEvents(events)
      
      // Connect all events (new and existing) to tag node
      const connectedCount = connectEventsToTag(tag, tagNodeId)
      
      showMessage(`Added ${events.length} posts with #${tag} (${connectedCount} connections)`, 'success')
    } else {
      // Still create connections to existing events
      const connectedCount = connectEventsToTag(tag, tagNodeId)
      showMessage(`No new posts found, but connected ${connectedCount} existing posts to #${tag}`, 'info')
    }
  } catch (error) {
    console.error('Failed to expand tag posts:', error)
    showMessage('Failed to expand tag posts', 'error')
  }
}

async function expandAuthorPosts(pubkey: string) {
  contextMenu.value.show = false
  showMessage(`Expanding posts by ${pubkey.slice(0, 8)}...`, 'info')
  
  try {
    const events = await fetchByAuthor(pubkey, 50)
    const notes = events.filter(e => e.kind === 1)
    
    if (notes.length > 0) {
      graphStore.updateWithEvents(notes)
      // Create author node and connect all events by this author
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`Added ${notes.length} posts from author (${connectedCount} connections)`, 'success')
    } else {
      // Still create author node even if no new posts
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`No new posts found, but connected ${connectedCount} existing posts`, 'info')
    }
  } catch (error) {
    console.error('Failed to expand author posts:', error)
    showMessage('Failed to expand author posts', 'error')
  }
}

async function expandAuthorArticles(pubkey: string) {
  contextMenu.value.show = false
  showMessage(`Expanding articles by ${pubkey.slice(0, 8)}...`, 'info')
  
  try {
    const events = await fetchInitialEvents([
      { authors: [pubkey], kinds: [30023], limit: 20 }
    ], { timeout: 5000 })
    
    if (events.length > 0) {
      graphStore.updateWithEvents(events)
      // Create author node and connect all events by this author
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`Added ${events.length} articles from author (${connectedCount} connections)`, 'success')
    } else {
      // Still create author node even if no new articles
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`No new articles found, but connected ${connectedCount} existing events`, 'info')
    }
  } catch (error) {
    console.error('Failed to expand author articles:', error)
    showMessage('Failed to expand author articles', 'error')
  }
}

async function expandAuthorProfile(pubkey: string) {
  contextMenu.value.show = false
  showMessage(`Fetching profile for ${pubkey.slice(0, 8)}...`, 'info')
  
  try {
    const events = await fetchInitialEvents([
      { authors: [pubkey], kinds: [0], limit: 1 }
    ], { timeout: 5000 })
    
    if (events.length > 0) {
      // Parse profile data
      let profile = null
      try {
        profile = JSON.parse(events[0].content)
      } catch (e) {
        console.warn('Failed to parse profile:', e)
      }
      
      // Create/update author node with profile data
      createAuthorNode(pubkey, profile)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`Profile loaded (${connectedCount} events connected)`, 'success')
    } else {
      // Create author node without profile
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`Profile not found, but connected ${connectedCount} events`, 'info')
    }
  } catch (error) {
    console.error('Failed to fetch author profile:', error)
    showMessage('Failed to fetch author profile', 'error')
  }
}

async function expandAuthorNetwork(pubkey: string) {
  contextMenu.value.show = false
  showMessage(`Expanding social network for ${pubkey.slice(0, 8)}...`, 'info')
  
  try {
    const { follows, events } = await fetchUserGraph(pubkey)
    
    if (events.length > 0) {
      graphStore.updateWithEvents(events)
      // Create author node and connect events
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`Added ${events.length} events from network (${follows.length} contacts, ${connectedCount} connections)`, 'success')
    } else {
      // Still create author node
      createAuthorNode(pubkey)
      const connectedCount = connectEventsToAuthor(pubkey)
      showMessage(`No new network data found, but connected ${connectedCount} events`, 'info')
    }
  } catch (error) {
    console.error('Failed to expand social network:', error)
    showMessage('Failed to expand social network', 'error')
  }
}

async function expandThread(eventId: string) {
  contextMenu.value.show = false
  showMessage('Expanding thread...', 'info')
  
  try {
    const { replies } = await expandAroundEvent(eventId)
    
    if (replies.length > 0) {
      graphStore.updateWithEvents(replies)
      showMessage(`Added ${replies.length} replies to thread`, 'success')
    } else {
      showMessage('No replies found', 'info')
    }
  } catch (error) {
    console.error('Failed to expand thread:', error)
    showMessage('Failed to expand thread', 'error')
  }
}

async function expandReactions(eventId: string) {
  contextMenu.value.show = false
  showMessage('Expanding reactions...', 'info')
  
  try {
    const events = await fetchInitialEvents([
      { '#e': [eventId], kinds: [7], limit: 100 }
    ], { timeout: 5000 })
    
    if (events.length > 0) {
      graphStore.updateWithEvents(events)
      showMessage(`Added ${events.length} reactions`, 'success')
    } else {
      showMessage('No reactions found', 'info')
    }
  } catch (error) {
    console.error('Failed to expand reactions:', error)
    showMessage('Failed to expand reactions', 'error')
  }
}

async function expandReposts(eventId: string) {
  contextMenu.value.show = false
  showMessage('Expanding reposts...', 'info')
  
  try {
    const events = await fetchInitialEvents([
      { '#e': [eventId], kinds: [6], limit: 50 }
    ], { timeout: 5000 })
    
    if (events.length > 0) {
      graphStore.updateWithEvents(events)
      showMessage(`Added ${events.length} reposts`, 'success')
    } else {
      showMessage('No reposts found', 'info')
    }
  } catch (error) {
    console.error('Failed to expand reposts:', error)
    showMessage('Failed to expand reposts', 'error')
  }
}

async function expandOriginalPost(eventId: string) {
  contextMenu.value.show = false
  showMessage('Finding original post...', 'info')
  
  try {
    // Get the current event to find what it references
    const currentNode = graphStore.nodes.find(n => n.id === eventId)
    if (!currentNode?.data?.event) {
      showMessage('Event not found in graph', 'warning')
      return
    }
    
    const event = currentNode.data.event
    const eTag = event.tags.find((t: string[]) => t[0] === 'e')
    
    if (eTag && eTag[1]) {
      const referencedId = eTag[1]
      const events = await fetchInitialEvents([
        { ids: [referencedId] }
      ], { timeout: 5000 })
      
      if (events.length > 0) {
        graphStore.updateWithEvents(events)
        showMessage('Original post added', 'success')
      } else {
        showMessage('Original post not found', 'info')
      }
    } else {
      showMessage('No referenced post found', 'warning')
    }
  } catch (error) {
    console.error('Failed to find original post:', error)
    showMessage('Failed to find original post', 'error')
  }
}

// Filter functions
function filterByTag(tag: string) {
  contextMenu.value.show = false
  showMessage(`Filtering to show only #${tag}`, 'info')
  
  if (!graph) return
  
  // Create tag node
  const tagNodeId = createTagNode(tag)
  
  // Connect all events with this tag to the tag node
  const connectedCount = connectEventsToTag(tag, tagNodeId)
  
  // Use visibility property to hide/show nodes
  const updates: any[] = []
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    const isTagNode = node.data?.type === 'tag'
    const hasTags = event?.tags?.some((t: string[]) => 
      t[0] === 't' && t[1]?.toLowerCase() === tag.toLowerCase()
    )
    
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: (hasTags || isTagNode) ? 'visible' : 'hidden'
      }
    })
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  showMessage(`Filtered to #${tag} (${connectedCount} connections)`, 'success')
}

function filterByAuthor(pubkey: string) {
  contextMenu.value.show = false
  showMessage(`Filtering to show only ${pubkey.slice(0, 8)}...`, 'info')
  
  if (!graph) return
  
  // Use visibility property to hide/show nodes
  const updates: any[] = []
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: event?.pubkey === pubkey ? 'visible' : 'hidden'
      }
    })
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  showMessage('Filtered to author', 'success')
}

function filterRelated(eventId: string) {
  contextMenu.value.show = false
  showMessage('Filtering to show related content...', 'info')
  
  if (!graph) return
  
  // Find all connected nodes (1 hop away)
  const connectedIds = new Set<string>([eventId])
  graphStore.edges.forEach((edge: any) => {
    if (edge.source === eventId) connectedIds.add(edge.target)
    if (edge.target === eventId) connectedIds.add(edge.source)
  })
  
  // Use visibility to hide unconnected nodes
  const updates: any[] = []
  graphStore.nodes.forEach((node: any) => {
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: connectedIds.has(node.id) ? 'visible' : 'hidden'
      }
    })
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  showMessage(`Showing ${connectedIds.size} related nodes`, 'success')
}

// Highlight functions
function highlightByTag(tag: string) {
  contextMenu.value.show = false
  showMessage(`Highlighting posts with #${tag}`, 'info')
  
  if (!graph) return
  
  // Add highlight style to matching nodes
  const updates: any[] = []
  
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    const hasTags = event?.tags?.some((t: string[]) => 
      t[0] === 't' && t[1]?.toLowerCase() === tag.toLowerCase()
    )
    
    if (hasTags) {
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: '#fbbf24',
          lineWidth: 4,
        }
      })
    } else {
      // Reset to default style
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: undefined,
          lineWidth: undefined,
        }
      })
    }
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  showMessage(`Highlighted #${tag}`, 'success')
}

function highlightByAuthor(pubkey: string) {
  contextMenu.value.show = false
  showMessage(`Highlighting content by ${pubkey.slice(0, 8)}...`, 'info')
  
  if (!graph) return
  
  // Add highlight style to author's nodes
  const updates: any[] = []
  
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    if (event?.pubkey === pubkey) {
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: '#8b5cf6',
          lineWidth: 4,
        }
      })
    } else {
      // Reset to default style
      updates.push({
        id: node.id,
        style: {
          ...node.style,
          stroke: undefined,
          lineWidth: undefined,
        }
      })
    }
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  showMessage('Highlighted author', 'success')
}

// Clear all filters - show all nodes
function clearFilters() {
  if (!graph) return
  
  // Don't clear search - it's independent
  // Only clear other filters (visibility from filterBy* functions)
  
  const updates: any[] = []
  graphStore.nodes.forEach((node: any) => {
    // If search is active, preserve search visibility state
    // Otherwise, make all nodes visible
    const visibility = searchActive.value 
      ? (searchResults.value.has(node.id) ? 'visible' : 'hidden')
      : 'visible'
    
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: visibility,
      }
    })
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  const message = searchActive.value 
    ? 'Filters cleared (search still active)' 
    : 'All filters cleared'
  showMessage(message, 'success')
}

// Reset all highlights - remove custom styles
function resetHighlights() {
  if (!graph) return
  
  // Don't clear search - only remove highlight styles
  // Search has its own clear button
  
  const updates: any[] = []
  
  graphStore.nodes.forEach((node: any) => {
    updates.push({
      id: node.id,
      style: {
        ...node.style,
        stroke: undefined,
        lineWidth: undefined,
      }
    })
  })
  
  if (updates.length > 0) {
    graph.updateNodeData(updates)
    graph.render()
  }
  
  showMessage('Highlights cleared', 'success')
}

// Search Functions
// ================

// Perform local search on current graph
function performSearch() {
  if (!graph || !searchQuery.value.trim()) {
    clearSearch()
    return
  }
  
  const query = searchQuery.value.toLowerCase().trim()
  const matchingNodeIds = new Set<string>()
  
  // Search through all nodes
  graphStore.nodes.forEach((node: any) => {
    const event = node.data?.event
    if (!event) {
      // Check if it's an author/tag node
      if (node.data?.type === 'pubkey') {
        const pubkey = node.data?.pubkey || ''
        const profile = node.data?.profile
        const name = profile?.name || profile?.display_name || ''
        
        if (pubkey.toLowerCase().includes(query) || 
            name.toLowerCase().includes(query)) {
          matchingNodeIds.add(node.id)
        }
      } else if (node.data?.type === 'tag') {
        const tag = node.data?.tag || ''
        if (tag.toLowerCase().includes(query)) {
          matchingNodeIds.add(node.id)
        }
      }
      return
    }
    
    let matches = false
    
    // Search event content
    if (event.content?.toLowerCase().includes(query)) {
      matches = true
    }
    
    // Search tags
    if (!matches && event.tags) {
      const hasMatchingTag = event.tags.some((t: string[]) => {
        if (t[0] === 't' && t[1]?.toLowerCase().includes(query)) {
          return true // Hashtag match
        }
        return t.some((val: string) => val?.toLowerCase().includes(query))
      })
      if (hasMatchingTag) matches = true
    }
    
    // Search author pubkey
    if (!matches && event.pubkey?.toLowerCase().includes(query)) {
      matches = true
    }
    
    // Search event ID
    if (!matches && event.id?.toLowerCase().includes(query)) {
      matches = true
    }
    
    // Search mentions (p-tags)
    if (!matches && event.tags) {
      const hasMatchingMention = event.tags.some((t: string[]) => 
        t[0] === 'p' && t[1]?.toLowerCase().includes(query)
      )
      if (hasMatchingMention) matches = true
    }
    
    if (matches) {
      matchingNodeIds.add(node.id)
    }
  })
  
  searchResults.value = matchingNodeIds
  searchActive.value = true
  applySearchResults()
  
  showMessage(`Found ${matchingNodeIds.size} matching ${matchingNodeIds.size === 1 ? 'node' : 'nodes'}`, 'success')
}

// Apply search results - hide non-matching nodes and edges
function applySearchResults() {
  if (!graph || !searchActive.value) return
  
  const nodeUpdates: any[] = []
  const edgeUpdates: any[] = []
  
  // Hide/show nodes based on search results
  graphStore.nodes.forEach((node: any) => {
    const isMatch = searchResults.value.has(node.id)
    
    nodeUpdates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: isMatch ? 'visible' : 'hidden',
        stroke: isMatch ? '#3b82f6' : undefined,
        lineWidth: isMatch ? 3 : undefined,
      }
    })
  })
  
  // Hide edges where either source or target is hidden
  graphStore.edges.forEach((edge: any) => {
    const sourceVisible = searchResults.value.has(edge.source)
    const targetVisible = searchResults.value.has(edge.target)
    const isVisible = sourceVisible && targetVisible
    
    edgeUpdates.push({
      id: edge.id || `${edge.source}-${edge.target}`,
      style: {
        ...edge.style,
        visibility: isVisible ? 'visible' : 'hidden',
      }
    })
  })
  
  if (nodeUpdates.length > 0) {
    graph.updateNodeData(nodeUpdates)
  }
  
  if (edgeUpdates.length > 0) {
    graph.updateEdgeData(edgeUpdates)
  }
  
  graph.render()
}

// Clear search
function clearSearch() {
  searchQuery.value = ''
  searchResults.value.clear()
  searchActive.value = false
  
  if (!graph) return
  
  // Show all nodes and edges, remove search highlighting
  const nodeUpdates: any[] = []
  const edgeUpdates: any[] = []
  
  graphStore.nodes.forEach((node: any) => {
    nodeUpdates.push({
      id: node.id,
      style: {
        ...node.style,
        visibility: 'visible',
        stroke: undefined,
        lineWidth: undefined,
      }
    })
  })
  
  graphStore.edges.forEach((edge: any) => {
    edgeUpdates.push({
      id: edge.id || `${edge.source}-${edge.target}`,
      style: {
        ...edge.style,
        visibility: 'visible',
      }
    })
  })
  
  if (nodeUpdates.length > 0) {
    graph.updateNodeData(nodeUpdates)
  }
  
  if (edgeUpdates.length > 0) {
    graph.updateEdgeData(edgeUpdates)
  }
  
  graph.render()
}

// Toggle search mode between AND/OR
function toggleSearchMode() {
  searchMode.value = searchMode.value === 'AND' ? 'OR' : 'AND'
  showMessage(`Search mode: ${searchMode.value}`, 'info')
  // Re-apply search if active
  if (searchActive.value) {
    performSearch()
  }
}

// Search Nostr relays for matching events
async function searchNostrRelays() {
  if (!searchQuery.value.trim()) {
    showMessage('Please enter a search query', 'warning')
    return
  }
  
  isSearching.value = true
  contextMenu.value.show = false
  
  try {
    const query = searchQuery.value.trim()
    
    // Fetch events that might contain the search query
    // We'll search by content using kind 1 (notes) and kind 30023 (articles)
    const events = await fetchInitialEvents([
      { kinds: [1, 30023], limit: 100 }
    ], { timeout: 10000 })
    
    // Filter events locally by search query
    const matchingEvents = events.filter(event => {
      const searchLower = query.toLowerCase()
      
      // Search content
      if (event.content?.toLowerCase().includes(searchLower)) return true
      
      // Search tags
      if (event.tags?.some((t: string[]) => 
        t.some((val: string) => val?.toLowerCase().includes(searchLower))
      )) return true
      
      return false
    })
    
    if (matchingEvents.length > 0) {
      graphStore.updateWithEvents(matchingEvents)
      showMessage(`Added ${matchingEvents.length} events from Nostr relays`, 'success')
      
      // Automatically perform local search to highlight new results
      setTimeout(() => performSearch(), 500)
    } else {
      showMessage('No matching events found on Nostr relays', 'info')
    }
  } catch (error) {
    console.error('Failed to search Nostr relays:', error)
    showMessage('Failed to search Nostr relays', 'error')
  } finally {
    isSearching.value = false
  }
}

// Start investigation - focus on single event
function startInvestigation(eventId: string) {
  contextMenu.value.show = false
  
  if (!graph) return
  
  // Find the selected node
  const selectedNode = graphStore.nodes.find((node: any) => node.id === eventId)
  
  if (!selectedNode) {
    showMessage('Event not found in graph', 'error')
    return
  }
  
  // Clear the graph and keep only the selected event node (no author node)
  graphStore.setGraphData({
    nodes: [selectedNode],
    edges: []
  })
  
  showMessage('Investigation started from this event. Use expansion options to build the graph.', 'success', 5000)
}

// Remove node from graph
function removeNode(nodeId: string) {
  contextMenu.value.show = false
  
  // Check how many nodes would remain
  const remainingCount = graphStore.nodes.length - 1
  
  if (remainingCount === 0) {
    showMessage('Cannot remove the last node from graph', 'warning')
    return
  }
  
  // Remove from graph store (also removes connected edges)
  graphStore.removeNode(nodeId)
  
  showMessage('Node removed from graph', 'success')
}

// Watch for settings changes and auto-apply
watch(layoutSettings, () => {
  applyLayoutSettings()
}, { deep: true })

onMounted(() => {
  if (!graphRef.value) return
  
  // Initialize G6 graph with HTML nodes
  graph = new Graph({
    container: graphRef.value,
    width: graphRef.value.offsetWidth,
    height: graphRef.value.offsetHeight,
    
    layout: getLayoutConfig(layoutMode.value),
    
    behaviors: [
      'drag-canvas',
      'zoom-canvas',
      'drag-element',
    ],
    
    node: {
      type: 'html',
      style: {
        size: (d: any) => {
          const expanded = d.data?.expanded
          return expanded ? [400, 300] : [60, 60]
        },
        dx: (d: any) => {
          const expanded = d.data?.expanded
          const width = expanded ? 400 : 60
          return -width / 2
        },
        dy: (d: any) => {
          const expanded = d.data?.expanded
          const height = expanded ? 300 : 60
          return -height / 2
        },
        innerHTML: (d: any) => renderEventNode(d),
      },
    },
    
    edge: {
      style: {
        stroke: '#999',
        lineWidth: 1.5,
        endArrow: true,
      },
    },
  })
  
  // Load initial data
  graph.setData(graphData.value)
  graph.render()
  
  // Auto-stop layout animation after initial render
  setTimeout(() => {
    if (graph) {
      graph.stopLayout()
    }
  }, 5000)
  
  // Double-click to expand/collapse node
  graph.on('node:dblclick', (evt: any) => {
    const nodeId = evt.target?.id || evt.item?.id
    if (!nodeId) return
    
    const nodeData = graph.getNodeData(nodeId)
    if (!nodeData) return
    
    // For pubkey nodes, only expand if they have profile data
    if (nodeData.data?.type === 'pubkey') {
      if (!nodeData.data?.profile) return
    }
    
    // For event nodes, only expand if there's event data
    if (nodeData.data?.type !== 'pubkey' && !nodeData.data?.event) return
    
    const expanded = !nodeData.data?.expanded
    const updated = {
      ...nodeData,
      data: {
        ...nodeData.data,
        expanded,
      },
      style: {
        ...nodeData.style,
        size: expanded ? [400, 300] : [60, 60],
        dx: expanded ? -200 : -30,
        dy: expanded ? -150 : -30,
      },
    }
    
    graph.updateNodeData([updated])
    graph.render()
    
    // No need to rerun layout - space is always reserved for card size
  })
  
  // Handle canvas click (deselect)
  graph.on('canvas:click', () => {
    graphStore.selectNode(null)
  })
  
  // Close button click (DOM event delegation)
  graphRef.value.addEventListener('click', (e: Event) => {
    const target = e.target as HTMLElement
    const closeBtn = target.closest('[data-role="close"]')
    if (!closeBtn) return
    
    const itemEl = closeBtn.closest('[data-item-id]')
    const nodeId = itemEl?.getAttribute('data-item-id')
    if (!nodeId) return
    
    const nodeData = graph.getNodeData(nodeId)
    if (!nodeData) return
    
    const updated = {
      ...nodeData,
      data: {
        ...nodeData.data,
        expanded: false,
      },
      style: {
        ...nodeData.style,
        size: [60, 60],
        dx: -30,
        dy: -30,
      },
    }
    
    graph.updateNodeData([updated])
    graph.render()
    
    // No need to rerun layout - space is always reserved for card size
  })
  
  // Right-click context menu (DOM event delegation)
  graphRef.value.addEventListener('contextmenu', (e: MouseEvent) => {
    e.preventDefault()
    
    const target = e.target as HTMLElement
    
    // Check if clicking on a pubkey node (author circle)
    const pubkeyNodeEl = target.closest('.pubkey-node[data-item-id][data-pubkey]')
    if (pubkeyNodeEl) {
      const nodeId = pubkeyNodeEl.getAttribute('data-item-id')
      const pubkey = pubkeyNodeEl.getAttribute('data-pubkey')
      
      if (nodeId && pubkey) {
        showContextMenu(e.clientX, e.clientY, `Author ${pubkey.slice(0, 8)}...`, [
          { label: 'Expand all posts by author', icon: 'mdi-post-outline', handler: () => expandAuthorPosts(pubkey) },
          { label: 'Expand blog articles (kind 30023)', icon: 'mdi-book-open', handler: () => expandAuthorArticles(pubkey) },
          { label: 'Expand author profile', icon: 'mdi-account-details', handler: () => expandAuthorProfile(pubkey) },
          { label: 'Show followers/following', icon: 'mdi-account-group', handler: () => expandAuthorNetwork(pubkey) },
          { label: 'Filter to show only this author', icon: 'mdi-filter', handler: () => filterByAuthor(pubkey) },
          { label: 'Remove this node', icon: 'mdi-delete', handler: () => removeNode(nodeId) },
        ])
        return
      }
    }
    
    // Check if clicking on a tag node (tag circle)
    const tagNodeEl = target.closest('.tag-node[data-item-id][data-tag]')
    if (tagNodeEl) {
      const nodeId = tagNodeEl.getAttribute('data-item-id')
      const tag = tagNodeEl.getAttribute('data-tag')
      
      if (nodeId && tag) {
        showContextMenu(e.clientX, e.clientY, `Tag: #${tag}`, [
          { label: 'Expand more posts with this tag', icon: 'mdi-tag-plus', handler: () => expandByTag(tag) },
          { label: 'Filter to show only this tag', icon: 'mdi-filter', handler: () => filterByTag(tag) },
          { label: 'Highlight posts with this tag', icon: 'mdi-marker', handler: () => highlightByTag(tag) },
          { label: 'Remove this tag node', icon: 'mdi-delete', handler: () => removeNode(nodeId) },
        ])
        return
      }
    }
    
    // Check if clicking on a tag
    const tagEl = target.closest('[data-tag]')
    if (tagEl) {
      const tag = tagEl.getAttribute('data-tag')
      if (tag) {
        // Get the node ID from the card
        const cardEl = tagEl.closest('[data-item-id]')
        const nodeId = cardEl?.getAttribute('data-item-id')
        
        const actions = [
          { label: 'Expand posts with this tag', icon: 'mdi-tag-plus', handler: () => expandByTag(tag) },
          { label: 'Filter to show only this tag', icon: 'mdi-filter', handler: () => filterByTag(tag) },
          { label: 'Highlight posts with this tag', icon: 'mdi-marker', handler: () => highlightByTag(tag) },
        ]
        
        if (nodeId) {
          actions.push({ label: 'Remove this node', icon: 'mdi-delete', handler: () => removeNode(nodeId) })
        }
        
        showContextMenu(e.clientX, e.clientY, `Tag: #${tag}`, actions)
        return
      }
    }
    
    // Check if clicking on a mention
    const mentionEl = target.closest('[data-mention]')
    if (mentionEl) {
      const pubkey = mentionEl.getAttribute('data-mention')
      if (pubkey) {
        // Get the node ID from the card
        const cardEl = mentionEl.closest('[data-item-id]')
        const nodeId = cardEl?.getAttribute('data-item-id')
        
        const actions = [
          { label: 'Expand user posts', icon: 'mdi-post', handler: () => expandAuthorPosts(pubkey) },
          { label: 'Expand user profile', icon: 'mdi-account', handler: () => expandAuthorProfile(pubkey) },
          { label: 'Filter to show only this user', icon: 'mdi-filter', handler: () => filterByAuthor(pubkey) },
          { label: 'Highlight user content', icon: 'mdi-marker', handler: () => highlightByAuthor(pubkey) },
        ]
        
        if (nodeId) {
          actions.push({ label: 'Remove this node', icon: 'mdi-delete', handler: () => removeNode(nodeId) })
        }
        
        showContextMenu(e.clientX, e.clientY, `User ${pubkey.slice(0, 8)}...`, actions)
        return
      }
    }
    
    // Check if clicking on author section
    const authorEl = target.closest('[data-author-pubkey]')
    if (authorEl) {
      const pubkey = authorEl.getAttribute('data-author-pubkey')
      if (pubkey) {
        // Get the node ID from the card
        const cardEl = authorEl.closest('[data-item-id]')
        const nodeId = cardEl?.getAttribute('data-item-id')
        
        const actions = [
          { label: 'Expand all posts by author', icon: 'mdi-post-outline', handler: () => expandAuthorPosts(pubkey) },
          { label: 'Expand blog articles (kind 30023)', icon: 'mdi-book-open', handler: () => expandAuthorArticles(pubkey) },
          { label: 'Expand author profile', icon: 'mdi-account-details', handler: () => expandAuthorProfile(pubkey) },
          { label: 'Show followers/following', icon: 'mdi-account-group', handler: () => expandAuthorNetwork(pubkey) },
          { label: 'Filter to show only this author', icon: 'mdi-filter', handler: () => filterByAuthor(pubkey) },
        ]
        
        if (nodeId) {
          actions.push({ label: 'Remove this node', icon: 'mdi-delete', handler: () => removeNode(nodeId) })
        }
        
        showContextMenu(e.clientX, e.clientY, `Author ${pubkey.slice(0, 8)}...`, actions)
        return
      }
    }
    
    // Check if clicking on a card (general note context menu)
    const cardEl = target.closest('[data-item-id][data-kind][data-author]')
    if (cardEl) {
      const kind = cardEl.getAttribute('data-kind')
      const author = cardEl.getAttribute('data-author')
      const itemId = cardEl.getAttribute('data-item-id')
      
      if (kind && author && itemId) {
        const kindNum = parseInt(kind)
        let title = 'Note Options'
        const actions: Array<{ label: string, icon: string, handler: () => void }> = []
        
        // Add kind-specific options
        if (kindNum === 6) { // Repost
          actions.push({ label: 'Show original post', icon: 'mdi-bookmark', handler: () => expandOriginalPost(itemId) })
        }
        
        if (kindNum === 1 || kindNum === 30023) { // Note or Article
          actions.push({ label: 'Show thread/replies', icon: 'mdi-comment-multiple', handler: () => expandThread(itemId) })
          actions.push({ label: 'Show reactions', icon: 'mdi-heart', handler: () => expandReactions(itemId) })
          actions.push({ label: 'Show reposts', icon: 'mdi-repeat', handler: () => expandReposts(itemId) })
        }
        
        // Always add author expand option
        actions.push({ label: 'Start investigation from here', icon: 'mdi-target', handler: () => startInvestigation(itemId) })
        actions.push({ label: 'Expand author profile', icon: 'mdi-account', handler: () => expandAuthorProfile(author) })
        actions.push({ label: 'Filter to show related', icon: 'mdi-filter', handler: () => filterRelated(itemId) })
        actions.push({ label: 'Remove this node', icon: 'mdi-delete', handler: () => removeNode(itemId) })
        
        showContextMenu(e.clientX, e.clientY, title, actions)
        return
      }
    }
  })
  
  // Handle window resize
  window.addEventListener('resize', handleResize)
  
  // Try loading from database first
  loadFromDb()
})

onUnmounted(() => {
  if (graph) {
    graph.destroy()
  }
  window.removeEventListener('resize', handleResize)
})

// Watch for layout changes
watch(layoutMode, (newLayout) => {
  if (graph) {
    graph.setLayout(getLayoutConfig(newLayout))
    graph.layout()
    
    // Stop layout animation after stabilization
    setTimeout(() => {
      if (graph) {
        graph.stopLayout()
      }
    }, 4000)
  }
})

// Watch for data changes
watch(graphData, (newData) => {
  if (graph) {
    graph.setData(newData)
    graph.render()
    // Auto-stop layout animation after data update
    setTimeout(() => {
      if (graph) {
        graph.stopLayout()
      }
    }, 4000)
  }
}, { deep: true })

// Watch for relay dialog open to refresh data
watch(() => relayDialog.value.show, async (isOpen) => {
  if (isOpen) {
    await relayManager.loadRelays()
    relayManager.updateStats()
  }
})

function handleResize() {
  if (graph && graphRef.value) {
    graph.setSize(
      graphRef.value.offsetWidth,
      graphRef.value.offsetHeight
    )
  }
}

function fitView() {
  if (graph) {
    graph.fitView()
  }
}

function stopAnimation() {
  if (graph) {
    graph.stopLayout()
    showMessage('Animation gestoppt', 'info')
  }
}

function refreshGraph() {
  if (graph) {
    graph.layout()
    // Auto-stop after reasonable time
    setTimeout(() => {
      if (graph) {
        graph.stopLayout()
      }
    }, 4000)
  }
}

// Fetch global feed from Nostr relays
async function fetchGlobal() {
  try {
    showMessage('Connecting to Nostr relays...', 'info', 5000)
    const events = await fetchGlobalFeed(20)
    
    if (events.length === 0) {
      showMessage('No events found. Relays may be slow or empty.', 'warning', 5000)
      return
    }
    
    // After fetching, reload from database to show new events
    await loadFromDb()
    fitView()
    
    showMessage(`Fetched ${events.length} events successfully!`, 'success')
  } catch (error) {
    console.error('Failed to fetch global feed:', error)
    showMessage('Failed to fetch events. Check console for details.', 'error', 5000)
  }
}

// Load graph from IndexedDB
async function loadFromDb() {
  try {
    await graphStore.loadFromDatabase()
    const count = graphStore.nodeCount
    
    if (count === 0) {
      showMessage('Database is empty. Try fetching events first.', 'info', 4000)
    } else {
      showMessage(`Loaded ${count} events from database`, 'success')
    }
    
    fitView()
  } catch (error) {
    console.error('Failed to load from database:', error)
    showMessage('Failed to load from database', 'error')
  }
}

// Clear all graph data
function clearAll() {
  graphStore.clearGraph()
  showMessage('Graph cleared', 'info')
}

// Relay Manager Functions
// ========================

// Handle adding a new relay
async function handleAddRelay() {
  if (!newRelayUrl.value.trim()) return
  
  const url = newRelayUrl.value.trim()
  console.log(`[GraphView] Adding relay: ${url}`)
  
  const success = await relayManager.addRelay(url)
  if (success) {
    console.log(`[GraphView] Relay added to database, reloading relay list...`)
    newRelayUrl.value = ''
    
    // Reload relay list in useNostr so it includes the new relay
    await loadRelaysFromDB()
    
    // Reload relay manager view  
    await relayManager.loadRelays()
    relayManager.updateStats()
    
    // Test the connection for the new relay
    console.log(`[GraphView] Testing connections for updated relay list...`)
    await testAllRelayConnections()
    
    // Reload relay manager view again to show test results
    await relayManager.loadRelays()
    relayManager.updateStats()
    
    showMessage('Relay added successfully', 'success')
  } else {
    console.error(`[GraphView] Failed to add relay: ${url}`)
  }
}

// Test all relay connections
async function handleTestConnections() {
  testingConnections.value = true
  try {
    // Reload relay list first to ensure we have latest from database
    await loadRelaysFromDB()
    await testAllRelayConnections()
    await relayManager.loadRelays()
    relayManager.updateStats()
    showMessage('Relay connections tested', 'success')
  } catch (error) {
    console.error('Failed to test relay connections:', error)
    showMessage('Failed to test connections', 'error')
  } finally {
    testingConnections.value = false
  }
}

// Handle toggling relay enabled/disabled
async function handleToggleRelay(url: string) {
  try {
    console.log(`[GraphView] Toggling relay: ${url}`)
    await relayManager.toggleRelay(url)
    
    // Reload relay list in useNostr to reflect the change
    await loadRelaysFromDB()
    
    // Reload relay manager view
    await relayManager.loadRelays()
    relayManager.updateStats()
    
    // Test connections for updated relay list
    console.log(`[GraphView] Testing connections after toggle...`)
    await testAllRelayConnections()
    
    // Reload relay manager view again to show test results
    await relayManager.loadRelays()
    relayManager.updateStats()
  } catch (error) {
    console.error('Failed to toggle relay:', error)
    showMessage('Failed to toggle relay', 'error')
  }
}

// Handle removing a relay
async function handleRemoveRelay(url: string) {
  try {
    console.log(`[GraphView] Removing relay: ${url}`)
    await relayManager.removeRelay(url)
    
    console.log(`[GraphView] Relay removed, reloading relay list...`)
    // Reload relay list in useNostr to remove the relay
    await loadRelaysFromDB()
    
    // Reload relay manager view
    await relayManager.loadRelays()
    relayManager.updateStats()
    
    showMessage('Relay removed', 'info')
  } catch (error) {
    console.error('Failed to remove relay:', error)
    showMessage('Failed to remove relay', 'error')
  }
}

// Get relay status color
function getRelayStatusColor(status: string): string {
  switch (status) {
    case 'connected':
      return 'success'
    case 'connecting':
      return 'info'
    case 'error':
      return 'error'
    case 'disconnected':
    default:
      return 'grey'
  }
}

// Get relay status icon
function getRelayStatusIcon(status: string): string {
  switch (status) {
    case 'connected':
      return 'mdi-check-circle'
    case 'connecting':
      return 'mdi-loading mdi-spin'
    case 'error':
      return 'mdi-alert-circle'
    case 'disconnected':
    default:
      return 'mdi-circle-outline'
  }
}

// Format relative time
function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

// Show notification message
function showMessage(message: string, color: string = 'success', timeout: number = 3000) {
  snackbar.value = {
    show: true,
    message,
    color,
    timeout,
  }
}

// Handle expand request (from external UI if needed)
async function handleExpand(eventId: string) {
  try {
    showMessage('Loading connected events...', 'info', 5000)
    await graphStore.expandNode(eventId)
    fitView()
    showMessage('Graph expanded successfully', 'success')
  } catch (error) {
    console.error('Failed to expand node:', error)
    showMessage('Failed to expand node', 'error')
  }
}
</script>

<style scoped>
.graph-container {
  position: relative;
  height: 100%;
  width: 100%;
}

.graph-canvas {
  width: 100%;
  height: 100%;
}

.graph-controls {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
}

.data-controls {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
}

.status-bar {
  position: absolute;
  bottom: 16px;
  left: 16px;
  z-index: 10;
  display: flex;
  gap: 8px;
}

/* Event node styles (injected into G6 HTML nodes) */
/* Collapsed node (square with rounded corners) */
:deep(.node-circle) {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 2px solid rgba(255, 255, 255, 0.8);
}

:deep(.node-circle:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
}

:deep(.node-circle.pubkey-node) {
  border: 2px solid rgba(99, 102, 241, 0.3);
}

:deep(.node-circle.pubkey-node.with-picture) {
  cursor: pointer;
  padding: 0;
  overflow: hidden;
  border: 2px solid rgba(99, 102, 241, 0.5);
}

:deep(.node-circle.pubkey-node:hover) {
  transform: scale(1.05);
  box-shadow: 0 3px 10px rgba(99, 102, 241, 0.3);
}

:deep(.node-circle.pubkey-node.with-picture:hover) {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

:deep(.profile-picture) {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

:deep(.node-circle.tag-node) {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-width: 4px;
  border-style: solid;
}

:deep(.node-circle.tag-node:hover) {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(245, 158, 11, 0.5);
}

:deep(.node-tag-label) {
  font-size: 32px;
  font-weight: 700;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  user-select: none;
  text-align: center;
  line-height: 1;
}

:deep(.node-circle.loading) {
  background: #ccc;
}

:deep(.node-emoji) {
  font-size: 28px;
  line-height: 1;
}

/* Window node (expanded state) */
:deep(.event-node) {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  border-radius: 12px;
  border: 2px solid rgba(0, 0, 0, 0.18);
  background: #fff;
  box-shadow: 0 12px 28px rgba(0, 0, 0, 0.14);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  font-family: system-ui, -apple-system, sans-serif;
}

:deep(.event-titlebar) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  background: linear-gradient(#fafafa, #f1f1f1);
  user-select: none;
  cursor: pointer;
}

:deep(.event-left) {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

:deep(.event-badge) {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.14);
  background: rgba(0, 0, 0, 0.03);
  white-space: nowrap;
  flex-shrink: 0;
}

:deep(.event-title) {
  font-weight: 600;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.event-close) {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(0, 0, 0, 0.2);
  background: #fff;
  cursor: pointer;
  line-height: 22px;
  text-align: center;
  font-weight: 800;
  font-size: 18px;
  user-select: none;
  flex-shrink: 0;
}

:deep(.event-close:hover) {
  background: #f5f5f5;
}

:deep(.event-preview) {
  padding: 12px;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.event-body) {
  flex: 1;
  overflow: auto;
  padding: 12px;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.event-meta) {
  font-size: 11px;
  color: #666;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.event-meta > div) {
  margin-bottom: 4px;
}

:deep(.event-content) {
  white-space: pre-wrap;
  word-wrap: break-word;
  color: #333;
}

:deep(.collapsed .event-body) {
  display: none;
}

/* Kind-specific colors */
:deep(.kind-0) {
  border-color: rgba(59, 109, 255, 0.4);
}

:deep(.kind-1) {
  border-color: rgba(35, 164, 85, 0.4);
}

:deep(.kind-3) {
  border-color: rgba(242, 165, 43, 0.4);
}

:deep(.kind-7) {
  border-color: rgba(255, 99, 132, 0.4);
}

/* Dark theme support */
.v-theme--dark :deep(.event-node) {
  background: rgba(30, 30, 30, 0.98);
  border-color: rgba(255, 255, 255, 0.2);
}

.v-theme--dark :deep(.event-titlebar) {
  background: linear-gradient(#2a2a2a, #1e1e1e);
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.v-theme--dark :deep(.event-content),
.v-theme--dark :deep(.event-preview) {
  color: #e0e0e0;
}

.v-theme--dark :deep(.event-meta) {
  color: #999;
}

/* Profile card specific styles */
:deep(.profile-card) {
  border-color: rgba(99, 102, 241, 0.4);
}

:deep(.profile-picture-large) {
  text-align: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

:deep(.profile-picture-large img) {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid rgba(99, 102, 241, 0.3);
}

:deep(.profile-bio) {
  font-style: italic;
  color: #555;
  white-space: pre-wrap;
}

.v-theme--dark :deep(.profile-bio) {
  color: #aaa;
}

/* New minimalistic card design */
:deep(.nostr-card) {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  padding: 0;
  width: 100%;
  max-width: 600px;
  min-width: 400px;
  box-sizing: border-box;
  font-family: system-ui, -apple-system, sans-serif;
  transition: box-shadow 0.2s;
}

:deep(.nostr-card:hover) {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

/* Card Header */
:deep(.card-header) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.card-header-left) {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.kind-badge) {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 4px;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

:deep(.thread-indicator) {
  font-size: 14px;
  opacity: 0.7;
}

:deep(.card-close) {
  background: transparent;
  border: none;
  font-size: 20px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

:deep(.card-close:hover) {
  background: #f3f4f6;
  color: #111827;
}

/* Author Section */
:deep(.card-author) {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

:deep(.card-author:hover) {
  background: #f9fafb;
}

:deep(.author-avatar) {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  color: white;
}

:deep(.author-info) {
  flex: 1;
  min-width: 0;
}

:deep(.author-name) {
  font-weight: 600;
  font-size: 14px;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

:deep(.card-timestamp) {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* Content Section */
:deep(.card-content) {
  padding: 12px;
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  max-height: 400px;
  overflow-y: auto;
  word-wrap: break-word;
}

:deep(.markdown-content) {
  white-space: pre-wrap;
}

:deep(.markdown-content p) {
  margin: 0 0 12px 0;
}

:deep(.markdown-content p:last-child) {
  margin-bottom: 0;
}

:deep(.markdown-content a) {
  color: #3b82f6;
  text-decoration: none;
}

:deep(.markdown-content a:hover) {
  text-decoration: underline;
}

:deep(.markdown-content pre) {
  background: #f3f4f6;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 12px;
}

/* Tags Section */
:deep(.card-tags) {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
}

:deep(.tag-badge) {
  background: #eff6ff;
  color: #1d4ed8;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.tag-badge:hover) {
  background: #dbeafe;
  transform: translateY(-1px);
}

/* Mentions Section */
:deep(.card-mentions) {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  font-size: 12px;
}

:deep(.mentions-label) {
  color: #6b7280;
  font-weight: 500;
}

:deep(.mention-badge) {
  background: #f3f4f6;
  color: #374151;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

:deep(.mention-badge:hover) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

:deep(.mention-more) {
  color: #6b7280;
  font-style: italic;
}

/* Footer Section */
:deep(.card-footer) {
  display: flex;
  gap: 16px;
  padding: 8px 12px;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
}

:deep(.footer-stat) {
  font-size: 12px;
  color: #6b7280;
  cursor: pointer;
  transition: color 0.2s;
}

:deep(.footer-stat:hover) {
  color: #111827;
}

/* Dark theme support for new cards */
.v-theme--dark :deep(.nostr-card) {
  background: #1f2937;
  border-color: #374151;
}

.v-theme--dark :deep(.card-header),
.v-theme--dark :deep(.card-tags),
.v-theme--dark :deep(.card-mentions),
.v-theme--dark :deep(.card-footer) {
  border-color: #374151;
}

.v-theme--dark :deep(.card-author:hover) {
  background: #111827;
}

.v-theme--dark :deep(.card-close) {
  color: #9ca3af;
}

.v-theme--dark :deep(.card-close:hover) {
  background: #374151;
  color: #f3f4f6;
}

.v-theme--dark :deep(.author-name),
.v-theme--dark :deep(.card-content) {
  color: #f3f4f6;
}

.v-theme--dark :deep(.card-timestamp),
.v-theme--dark :deep(.footer-stat),
.v-theme--dark :deep(.mentions-label) {
  color: #9ca3af;
}

.v-theme--dark :deep(.tag-badge) {
  background: #1e3a8a;
  color: #93c5fd;
}

.v-theme--dark :deep(.tag-badge:hover) {
  background: #1e40af;
}

.v-theme--dark :deep(.mention-badge) {
  background: #374151;
  color: #e5e7eb;
}

.v-theme--dark :deep(.mention-badge:hover) {
  background: #4b5563;
}

.v-theme--dark :deep(.markdown-content pre) {
  background: #111827;
  color: #e5e7eb;
}

.v-theme--dark :deep(.card-footer) {
  background: #111827;
}

/* Relay management styles */
.relay-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.relay-item:last-child {
  border-bottom: none;
}

.relay-info {
  flex: 1;
  min-width: 0;
}

.relay-url {
  font-weight: 500;
  font-size: 14px;
  word-break: break-all;
  margin-bottom: 4px;
}

.relay-details {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: rgba(0, 0, 0, 0.6);
}

.relay-details > span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.relay-error {
  color: #d32f2f;
  font-size: 12px;
  margin-top: 4px;
  padding: 4px 8px;
  background: rgba(211, 47, 47, 0.1);
  border-radius: 4px;
}

.relay-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.v-theme--dark .relay-item {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.v-theme--dark .relay-details {
  color: rgba(255, 255, 255, 0.6);
}

.v-theme--dark .relay-error {
  color: #ef5350;
  background: rgba(239, 83, 80, 0.15);
}
</style>

