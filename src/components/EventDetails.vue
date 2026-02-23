<template>
  <v-navigation-drawer
    :model-value="!!event"
    location="right"
    temporary
    width="500"
    @update:model-value="(val) => !val && $emit('close')"
  >
    <template v-if="event">
      <!-- Header -->
      <v-toolbar color="primary" density="compact">
        <v-toolbar-title>
          {{ getEventTypeLabel(event.kind) }}
        </v-toolbar-title>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" @click="$emit('close')"></v-btn>
      </v-toolbar>

      <v-card flat>
        <v-card-text>
          <!-- Event Content -->
          <div class="mb-4">
            <v-chip size="small" color="primary" class="mb-2">
              Kind {{ event.kind }}
            </v-chip>
            
            <div v-if="event.kind === 1" class="event-content">
              <div v-html="renderMarkdown(event.content)"></div>
            </div>
            
            <div v-else-if="event.kind === 0" class="event-content">
              <pre>{{ formatJSON(event.content) }}</pre>
            </div>
            
            <div v-else class="event-content">
              <pre>{{ event.content }}</pre>
            </div>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Author -->
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-1">Author</div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-account</v-icon>
              <code class="text-body-2">{{ formatPubkey(event.pubkey) }}</code>
              <v-btn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                class="ml-2"
                @click="copyToClipboard(event.pubkey)"
              ></v-btn>
            </div>
            <div v-if="npub" class="mt-1">
              <code class="text-caption">{{ npub }}</code>
            </div>
          </div>

          <!-- Timestamp -->
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-1">Posted</div>
            <div class="d-flex align-center">
              <v-icon size="small" class="mr-2">mdi-clock-outline</v-icon>
              <span class="text-body-2">{{ formatTimestamp(event.created_at) }}</span>
            </div>
          </div>

          <!-- Event ID -->
          <div class="mb-4">
            <div class="text-caption text-medium-emphasis mb-1">Event ID</div>
            <div class="d-flex align-center">
              <code class="text-body-2">{{ formatEventId(event.id) }}</code>
              <v-btn
                icon="mdi-content-copy"
                size="x-small"
                variant="text"
                class="ml-2"
                @click="copyToClipboard(event.id)"
              ></v-btn>
            </div>
          </div>

          <!-- Tags -->
          <div v-if="event.tags.length > 0" class="mb-4">
            <div class="text-caption text-medium-emphasis mb-1">
              Tags ({{ event.tags.length }})
            </div>
            <v-expansion-panels variant="accordion">
              <v-expansion-panel>
                <v-expansion-panel-title>
                  View Tags
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div v-for="(tag, index) in event.tags" :key="index" class="mb-2">
                    <v-chip size="small" label>
                      {{ tag[0] }}
                    </v-chip>
                    <span class="ml-2 text-body-2">
                      {{ tag.slice(1).join(', ') }}
                    </span>
                  </div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>

          <v-divider class="my-4"></v-divider>

          <!-- Actions -->
          <div class="d-flex flex-column ga-2">
            <v-btn
              prepend-icon="mdi-pencil"
              variant="outlined"
              @click="$emit('annotate')"
            >
              Add Annotation
            </v-btn>
            
            <v-btn
              prepend-icon="mdi-graph-outline"
              variant="outlined"
              @click="$emit('expand')"
            >
              Expand Graph
            </v-btn>
            
            <v-btn
              prepend-icon="mdi-open-in-new"
              variant="outlined"
              @click="openInNostrClient"
            >
              Open in Nostr Client
            </v-btn>
            
            <v-btn
              prepend-icon="mdi-code-json"
              variant="outlined"
              @click="showRawJSON = !showRawJSON"
            >
              {{ showRawJSON ? 'Hide' : 'Show' }} Raw JSON
            </v-btn>
          </div>

          <!-- Raw JSON -->
          <div v-if="showRawJSON" class="mt-4">
            <v-card variant="outlined">
              <v-card-text>
                <pre class="raw-json">{{ JSON.stringify(event, null, 2) }}</pre>
              </v-card-text>
            </v-card>
          </div>
        </v-card-text>
      </v-card>
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Event as NostrEvent } from 'nostr-tools'
import { npubEncode } from 'nostr-tools/nip19'
import MarkdownIt from 'markdown-it'

const props = defineProps<{
  event: NostrEvent | null
}>()

const emit = defineEmits<{
  close: []
  annotate: []
  expand: []
}>()

const showRawJSON = ref(false)
const md = new MarkdownIt()

const npub = computed(() => {
  if (!props.event) return ''
  try {
    return npubEncode(props.event.pubkey)
  } catch {
    return ''
  }
})

function getEventTypeLabel(kind: number): string {
  const kindLabels: Record<number, string> = {
    0: '👤 Profile Metadata',
    1: '📝 Text Note',
    3: '👥 Contact List',
    4: '💬 Direct Message',
    5: '🗑️ Event Deletion',
    6: '🔄 Repost',
    7: '❤️ Reaction',
    9735: '⚡ Zap Receipt',
    30023: '📄 Long-form Article',
  }
  return kindLabels[kind] || `Event (kind ${kind})`
}

function formatPubkey(pubkey: string): string {
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-8)}`
}

function formatEventId(id: string): string {
  return `${id.slice(0, 12)}...${id.slice(-12)}`
}

function formatTimestamp(timestamp: number): string {
  const date = new Date(timestamp * 1000)
  const now = Date.now()
  const diff = now - date.getTime()
  
  // Less than a minute
  if (diff < 60000) return 'just now'
  
  // Less than an hour
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000)
    return `${mins} minute${mins > 1 ? 's' : ''} ago`
  }
  
  // Less than a day
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000)
    return `${hours} hour${hours > 1 ? 's' : ''} ago`
  }
  
  // Less than a week
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000)
    return `${days} day${days > 1 ? 's' : ''} ago`
  }
  
  // Full date
  return date.toLocaleString()
}

function renderMarkdown(content: string): string {
  return md.render(content)
}

function formatJSON(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2)
  } catch {
    return json
  }
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text)
  // TODO: Show snackbar notification
}

function openInNostrClient() {
  if (!props.event) return
  
  // Try to open in common Nostr clients
  const noteId = props.event.id
  
  // Default to njump.me (universal Nostr link)
  window.open(`https://njump.me/${noteId}`, '_blank')
}
</script>

<style scoped>
.event-content {
  padding: 12px;
  background-color: rgb(var(--v-theme-surface-variant));
  border-radius: 4px;
  max-height: 400px;
  overflow-y: auto;
}

.event-content pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  margin: 0;
  font-size: 0.875rem;
}

.event-content :deep(p) {
  margin-bottom: 0.5rem;
}

.event-content :deep(a) {
  color: rgb(var(--v-theme-primary));
  text-decoration: underline;
}

.raw-json {
  font-size: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  margin: 0;
}

code {
  background-color: rgb(var(--v-theme-surface-variant));
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 0.875rem;
}
</style>
