<template>
  <div v-if="event" :style="containerStyle" @mousedown="startDrag">
    <v-card class="event-card elevation-8" width="400">
    <!-- Header with drag handle and close button -->
    <v-card-title class="d-flex align-center pa-2 drag-handle">
      <v-icon size="small" class="mr-2">mdi-drag</v-icon>
      <span class="text-subtitle-2">{{ getEventTypeLabel(event.kind) }}</span>
      <v-spacer></v-spacer>
      <v-btn
        icon="mdi-close"
        size="x-small"
        variant="text"
        @click.stop="$emit('close')"
      ></v-btn>
    </v-card-title>

    <v-divider></v-divider>

    <!-- Content -->
    <v-card-text class="pa-3">
      <!-- Event content -->
      <div class="mb-3">
        <div v-if="event.kind === 1" class="text-body-2" v-html="renderMarkdown(event.content)"></div>
        <div v-else-if="event.kind === 0" class="text-body-2">
          <pre class="profile-content">{{ formatJSON(event.content) }}</pre>
        </div>
        <div v-else class="text-body-2 text-medium-emphasis">
          {{ event.content.slice(0, 200) }}{{ event.content.length > 200 ? '...' : '' }}
        </div>
      </div>

      <!-- Metadata -->
      <v-divider class="my-2"></v-divider>
      
      <div class="text-caption">
        <div class="mb-1">
          <strong>Author:</strong>
          <span class="text-mono">{{ formatPubkey(event.pubkey) }}</span>
        </div>
        <div class="mb-1">
          <strong>Time:</strong> {{ formatTimestamp(event.created_at) }}
        </div>
        <div>
          <strong>Kind:</strong> {{ event.kind }}
        </div>
      </div>
    </v-card-text>

    <v-divider></v-divider>

    <!-- Actions -->
    <v-card-actions class="pa-2">
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-graph"
        @click="$emit('expand')"
      >
        Expand
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-open-in-new"
        @click="openInNostrClient"
      >
        Open
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn
        size="small"
        variant="text"
        icon="mdi-code-json"
        @click="showRaw = !showRaw"
      ></v-btn>
    </v-card-actions>

    <!-- Raw JSON (collapsible) -->
    <v-expand-transition>
      <div v-if="showRaw">
        <v-divider></v-divider>
        <v-card-text class="pa-3">
          <pre class="raw-json text-caption">{{ formatJSON(event) }}</pre>
        </v-card-text>
      </div>
    </v-expand-transition>
    </v-card>
  </div></template>
<script setup lang="ts">
import { ref, computed } from 'vue'
import { type Event as NostrEvent } from 'nostr-tools'
import { npubEncode } from 'nostr-tools/nip19'
import MarkdownIt from 'markdown-it'

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
})

interface Props {
  event: NostrEvent
  initialX?: number
  initialY?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialX: 100,
  initialY: 100,
})

const emit = defineEmits<{
  close: []
  expand: []
  moved: [x: number, y: number]
}>()

const showRaw = ref(false)
const position = ref({ x: props.initialX, y: props.initialY })
const isDragging = ref(false)
const dragOffset = ref({ x: 0, y: 0 })

const containerStyle = computed(() => ({
  position: 'fixed',
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  zIndex: isDragging.value ? 1000 : 100,
  cursor: isDragging.value ? 'grabbing' : 'default',
}))

function startDrag(e: MouseEvent) {
  // Only drag from the title bar area
  const target = e.target as HTMLElement
  if (!target.closest('.drag-handle')) return

  isDragging.value = true
  dragOffset.value = {
    x: e.clientX - position.value.x,
    y: e.clientY - position.value.y,
  }

  const onMouseMove = (e: MouseEvent) => {
    if (isDragging.value) {
      position.value = {
        x: e.clientX - dragOffset.value.x,
        y: e.clientY - dragOffset.value.y,
      }
    }
  }

  const onMouseUp = () => {
    isDragging.value = false
    emit('moved', position.value.x, position.value.y)
    window.removeEventListener('mousemove', onMouseMove)
    window.removeEventListener('mouseup', onMouseUp)
  }

  window.addEventListener('mousemove', onMouseMove)
  window.addEventListener('mouseup', onMouseUp)
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

function formatPubkey(pubkey: string): string {
  try {
    const npub = npubEncode(pubkey)
    return npub.slice(0, 12) + '...' + npub.slice(-6)
  } catch {
    return pubkey.slice(0, 8) + '...' + pubkey.slice(-4)
  }
}

function formatTimestamp(timestamp: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`

  const date = new Date(timestamp * 1000)
  return date.toLocaleDateString()
}

function renderMarkdown(content: string): string {
  return md.render(content)
}

function formatJSON(data: any): string {
  return JSON.stringify(data, null, 2)
}

function openInNostrClient() {
  const url = `https://njump.me/${props.event.id}`
  window.open(url, '_blank')
}
</script>

<style scoped>
.event-card {
  max-height: 80vh;
  overflow-y: auto;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
}

.drag-handle {
  cursor: grab;
  user-select: none;
}

.drag-handle:active {
  cursor: grabbing;
}

.text-mono {
  font-family: monospace;
  font-size: 0.85em;
}

.profile-content {
  font-size: 0.8em;
  overflow-x: auto;
}

.raw-json {
  font-size: 0.75em;
  overflow-x: auto;
  max-height: 300px;
}

/* Dark theme support */
.v-theme--dark .event-card {
  background: rgba(30, 30, 30, 0.98);
}
</style>
