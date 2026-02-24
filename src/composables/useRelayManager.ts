import { ref, onMounted } from 'vue'
import {
  getAllRelays,
  getEnabledRelays,
  addRelay as dbAddRelay,
  removeRelay as dbRemoveRelay,
  updateRelayStatus,
  updateRelayLatency,
  toggleRelayEnabled,
  initializeDefaultRelays,
  type RelayInfo,
} from '@/db/relays'

export function useRelayManager() {
  const relays = ref<RelayInfo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Load relays from database
   */
  async function loadRelays() {
    loading.value = true
    error.value = null

    try {
      // Initialize defaults if needed
      await initializeDefaultRelays()

      // Load all relays
      const allRelays = await getAllRelays()
      relays.value = allRelays.sort((a, b) => a.addedAt - b.addedAt)
    } catch (err) {
      console.error('Failed to load relays:', err)
      error.value = 'Failed to load relays'
    } finally {
      loading.value = false
    }
  }

  /**
   * Get only enabled relay URLs
   */
  async function getEnabledRelayUrls(): Promise<string[]> {
    const enabled = await getEnabledRelays()
    return enabled.map((r) => r.url)
  }

  /**
   * Add a new relay
   */
  async function addRelay(url: string): Promise<boolean> {
    try {
      // Validate URL
      if (
        !url.trim() ||
        (!url.startsWith('ws://') && !url.startsWith('wss://'))
      ) {
        error.value = 'Invalid relay URL. Must start with ws:// or wss://'
        return false
      }

      // Check if already exists
      if (relays.value.some((r) => r.url === url)) {
        error.value = 'Relay already exists'
        return false
      }

      await dbAddRelay(url)
      await loadRelays()
      return true
    } catch (err) {
      console.error('Failed to add relay:', err)
      error.value = 'Failed to add relay'
      return false
    }
  }

  /**
   * Remove a relay
   */
  async function removeRelay(url: string): Promise<void> {
    try {
      await dbRemoveRelay(url)
      await loadRelays()
    } catch (err) {
      console.error('Failed to remove relay:', err)
      error.value = 'Failed to remove relay'
    }
  }

  /**
   * Toggle relay enabled/disabled
   */
  async function toggleRelay(url: string): Promise<void> {
    try {
      await toggleRelayEnabled(url)
      await loadRelays()
    } catch (err) {
      console.error('Failed to toggle relay:', err)
      error.value = 'Failed to toggle relay'
    }
  }

  /**
   * Update relay connection status
   */
  async function setRelayStatus(
    url: string,
    status: RelayInfo['status'],
    errorMsg?: string,
  ): Promise<void> {
    try {
      await updateRelayStatus(url, status, errorMsg)
      await loadRelays()
    } catch (err) {
      console.error('Failed to update relay status:', err)
    }
  }

  /**
   * Update relay latency measurement
   */
  async function setRelayLatency(url: string, latency: number): Promise<void> {
    try {
      await updateRelayLatency(url, latency)
      await loadRelays()
    } catch (err) {
      console.error('Failed to update relay latency:', err)
    }
  }

  /**
   * Get stats about relays
   */
  const stats = ref({
    total: 0,
    enabled: 0,
    connected: 0,
    errors: 0,
  })

  function updateStats() {
    stats.value = {
      total: relays.value.length,
      enabled: relays.value.filter((r) => r.enabled).length,
      connected: relays.value.filter((r) => r.status === 'connected').length,
      errors: relays.value.filter((r) => r.status === 'error').length,
    }
  }

  // Load relays on mount
  onMounted(async () => {
    await loadRelays()
    updateStats()
  })

  return {
    relays,
    loading,
    error,
    stats,
    loadRelays,
    getEnabledRelayUrls,
    addRelay,
    removeRelay,
    toggleRelay,
    setRelayStatus,
    setRelayLatency,
    updateStats,
  }
}
