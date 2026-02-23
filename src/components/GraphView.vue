<template>
  <v-container fluid class="graph-container pa-0">
    <div ref="graphRef" class="graph-canvas"></div>
    
    <!-- Graph controls -->
    <div class="graph-controls">
      <v-card class="pa-2" style="min-width: 280px; max-height: 90vh; overflow-y: auto;">
        <v-select
          v-model="layoutMode"
          :items="layoutOptions"
          item-title="label"
          item-value="value"
          label="Layout"
          density="compact"
          hide-details
        ></v-select>
        
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

          <v-tooltip text="Using 6 Nostr relays" location="end">
            <template #activator="{ props }">
              <v-chip
                v-bind="props"
                size="small"
                variant="tonal"
                prepend-icon="mdi-server-network"
              >
                6 Relays
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
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Graph } from '@antv/g6'
import { useGraphStore } from '@/stores/graph'
import { useEventFetcher } from '@/composables/useEventFetcher'
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

const { fetchGlobalFeed, isFetching } = useEventFetcher()

const snackbar = ref({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
})

// Helper: Render HTML for event node
function renderEventNode(d: any): string {
  // Handle pubkey (author) nodes
  if (d.data?.type === 'pubkey') {
    const profile = d.data?.profile
    const expanded = !!d.data?.expanded
    
    // If collapsed, show compact profile circle
    if (!expanded) {
      if (profile?.picture) {
        // Show profile picture
        return `
          <div class="node-circle pubkey-node with-picture" style="background: #fff;">
            <img src="${profile.picture}" class="profile-picture" alt="${profile.name || 'User'}" />
          </div>
        `
      } else {
        // Show default user icon
        return `
          <div class="node-circle pubkey-node" style="background: #6366f1;">
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
    return `
      <div class="node-circle pubkey-node" style="background: #6366f1;">
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
  
  // If collapsed, render as simple circle
  if (!expanded) {
    const kindColors: Record<number, string> = {
      0: '#3b6dff',
      1: '#23a455',
      3: '#f2a52b',
      7: '#ff6384',
    }
    const color = kindColors[kind] || '#1976d2'
    const emoji = typeLabel.split(' ')[0] // Get just the emoji
    
    return `
      <div class="node-circle kind-${kind}" style="background: ${color};">
        <span class="node-emoji">${emoji}</span>
      </div>
    `
  }
  
  // Expanded: render as window
  const safe = (s: string) =>
    String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
  
  const cls = `event-node expanded kind-${kind}`
  
  // Format content
  let bodyContent = ''
  if (kind === 1) {
    // Render markdown for notes
    bodyContent = safe(md.render(event.content).replace(/<[^>]*>/g, ''))
  } else if (kind === 0) {
    // Format profile JSON
    try {
      const profile = JSON.parse(event.content)
      bodyContent = safe(JSON.stringify(profile, null, 2))
    } catch {
      bodyContent = safe(event.content)
    }
  } else {
    bodyContent = safe(event.content)
  }
  
  const timestamp = new Date(event.created_at * 1000).toLocaleString()
  const nodeId = safe(d.id || '')
  
  return `
    <div class="${cls}" data-item-id="${nodeId}">
      <div class="event-titlebar" data-role="titlebar">
        <div class="event-left">
          <span class="event-badge">${typeLabel}</span>
          <span class="event-title">${safe(event.id.slice(0, 8))}...</span>
        </div>
        <div class="event-close" data-role="close">×</div>
      </div>
      <div class="event-body">
        <div class="event-meta">
          <div><strong>Author:</strong> ${safe(event.pubkey.slice(0, 16))}...</div>
          <div><strong>Time:</strong> ${timestamp}</div>
          <div><strong>Kind:</strong> ${kind}</div>
        </div>
        <div class="event-content">${bodyContent}</div>
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
  
  // Helper: Get actual node size based on expanded state
  const getNodeSize = (node: any) => {
    const expanded = node.data?.expanded
    if (expanded) {
      return Math.max(400, 300) // Use max dimension for radius calculations
    }
    return 60
  }
  
  const getNodeWidth = (node: any) => {
    return node.data?.expanded ? 400 : 60
  }
  
  const getNodeHeight = (node: any) => {
    return node.data?.expanded ? 300 : 60
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
    
    // Rerun layout with updated node sizes
    applyLayoutSettings()
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
    
    // Rerun layout with updated node sizes
    applyLayoutSettings()
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
/* Circular node (collapsed state) */
:deep(.node-circle) {
  width: 60px;
  height: 60px;
  border-radius: 50%;
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
</style>
