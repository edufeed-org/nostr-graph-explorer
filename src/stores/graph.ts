import { defineStore } from 'pinia'
import type { GraphData } from '@antv/g6'
import type { Event as NostrEvent } from 'nostr-tools'
import { getAllEvents, getEventReferences, getEventsByKind } from '../db'
import {
  eventsToGraph,
  filterEvents as filterEventsUtil,
} from '../composables/useGraphProjection'

export interface GraphNode {
  id: string
  label: string
  data: any
}

export interface GraphEdge {
  source: string
  target: string
  data?: any
}

export const useGraphStore = defineStore('graph', {
  state: () => ({
    nodes: [] as GraphNode[],
    edges: [] as GraphEdge[],
    selectedNodeId: null as string | null,
    filters: {
      kinds: [] as number[],
      authors: [] as string[],
      timeRange: [0, Date.now()] as [number, number],
    },
  }),

  getters: {
    graphData(): GraphData {
      return {
        nodes: this.nodes,
        edges: this.edges,
      }
    },

    nodeCount(): number {
      return this.nodes.length
    },

    edgeCount(): number {
      return this.edges.length
    },

    selectedNode(): GraphNode | undefined {
      return this.nodes.find((n) => n.id === this.selectedNodeId)
    },
  },

  actions: {
    setGraphData(data: GraphData) {
      this.nodes = data.nodes as GraphNode[]
      this.edges = data.edges as GraphEdge[]
    },

    addNode(node: GraphNode) {
      const exists = this.nodes.find((n) => n.id === node.id)
      if (!exists) {
        this.nodes.push(node)
      }
    },

    addEdge(edge: GraphEdge) {
      const exists = this.edges.find(
        (e) => e.source === edge.source && e.target === edge.target,
      )
      if (!exists) {
        this.edges.push(edge)
      }
    },

    removeNode(nodeId: string) {
      this.nodes = this.nodes.filter((n) => n.id !== nodeId)
      this.edges = this.edges.filter(
        (e) => e.source !== nodeId && e.target !== nodeId,
      )
    },

    selectNode(nodeId: string | null) {
      this.selectedNodeId = nodeId
    },

    clearGraph() {
      this.nodes = []
      this.edges = []
      this.selectedNodeId = null
    },

    /**
     * Load all events from IndexedDB and project to graph
     */
    async loadFromDatabase() {
      const events = await getAllEvents()

      // Apply current filters
      const filtered = filterEventsUtil(events, {
        kinds: this.filters.kinds.length > 0 ? this.filters.kinds : undefined,
        authors:
          this.filters.authors.length > 0 ? this.filters.authors : undefined,
        timeRange: this.filters.timeRange,
      })

      const { nodes, edges } = eventsToGraph(filtered)
      this.nodes = nodes
      this.edges = edges
    },

    /**
     * Load specific event kinds from database
     */
    async loadByKind(kinds: number[]) {
      const events = await getEventsByKind(kinds[0]) // TODO: Support multiple kinds
      const { nodes, edges } = eventsToGraph(events)
      this.nodes = nodes
      this.edges = edges
    },

    /**
     * Expand a node by loading its connected events
     */
    async expandNode(nodeId: string) {
      // Get events that reference this node
      const references = await getEventReferences(nodeId)

      if (references.length > 0) {
        const { nodes, edges } = eventsToGraph(references)

        // Add new nodes and edges
        nodes.forEach((node) => this.addNode(node))
        edges.forEach((edge) => this.addEdge(edge))
      }
    },

    /**
     * Apply filters and reload graph
     */
    async applyFilters() {
      await this.loadFromDatabase()
    },

    /**
     * Update graph with new events (for live subscriptions)
     */
    updateWithEvents(events: NostrEvent[]) {
      const { nodes, edges } = eventsToGraph(events)
      nodes.forEach((node) => this.addNode(node))
      edges.forEach((edge) => this.addEdge(edge))
    },
  },
})
