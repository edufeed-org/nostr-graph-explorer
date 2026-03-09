import { nip19 } from 'nostr-tools'

type NostrFilter = {
  ids?: string[]
  authors?: string[]
  kinds?: number[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[] | any
}

const DEFAULT_KINDS = [1, 30023]

const KIND_ALIASES: Record<string, number[]> = {
  // ─────────────────────────────
  // SOCIAL CORE
  // ─────────────────────────────
  post: [1],
  note: [1],
  text: [1],

  blog: [30023], // Long-form content (NIP-23)
  longform: [30023],

  reply: [1], // technisch kind 1 (client filter nötig)
  thread: [1], // client logic

  repost: [6],
  reaction: [7],
  like: [7],

  highlight: [9802],

  // ─────────────────────────────
  // PROFILE / IDENTITY
  // ─────────────────────────────
  profile: [0],
  metadata: [0],

  contacts: [3],
  followlist: [3],

  relays: [10002], // relay list
  mutelist: [10000],
  pinlist: [10001],

  // ─────────────────────────────
  // MESSAGING
  // ─────────────────────────────
  dm: [4, 1059], // legacy + NIP-17
  private: [4, 1059],

  chat: [42], // public chat message

  // ─────────────────────────────
  // EVENTS / CALENDAR (NIP-52)
  // ─────────────────────────────
  event: [31922, 31923],
  calendar: [31922, 31923],
  meeting: [31922, 31923],

  live: [30311], // Live Event (NIP-53)

  // ─────────────────────────────
  // MEDIA / FILES
  // ─────────────────────────────
  file: [1063],
  media: [1063], // often file metadata
  image: [1063],
  video: [1063],

  // ─────────────────────────────
  // MARKETPLACE (NIP-15)
  // ─────────────────────────────
  product: [30017],
  listing: [30018],
  shop: [30017, 30018],

  // ─────────────────────────────
  // DEVELOPMENT / GIT
  // ─────────────────────────────
  issue: [1311],
  patch: [1617],
  repo: [30617],

  // ─────────────────────────────
  // MODERATION / REPORTING
  // ─────────────────────────────
  report: [1984],
  moderation: [1984],

  // ─────────────────────────────
  // ADDRESSABLE GENERIC
  // ─────────────────────────────
  document: [30000], // generic addressable
}

function parseDateToUnix(input: string): number | undefined {
  if (/^\d+$/.test(input)) return Number(input)

  const match = input.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return undefined

  const [, y, m, d] = match
  return Math.floor(Date.UTC(+y, +m - 1, +d) / 1000)
}

function decodeAuthor(value: string): string {
  try {
    const decoded = nip19.decode(value)
    if (decoded.type === 'npub') return decoded.data as string
    if (decoded.type === 'nprofile') return (decoded.data as any).pubkey
  } catch {}
  return value
}

function decodeEventId(value: string): string | null {
  try {
    const decoded = nip19.decode(value)
    if (decoded.type === 'note') return decoded.data as string
    if (decoded.type === 'nevent') return (decoded.data as any).id
  } catch {}
  return null
}

function decodeNaddr(value: string): {
  kind: number
  pubkey: string
  identifier: string
  relays?: string[]
} | null {
  try {
    const decoded = nip19.decode(value)
    if (decoded.type === 'naddr') {
      const data = decoded.data as {
        identifier: string
        pubkey: string
        kind: number
        relays?: string[]
      }
      return {
        kind: data.kind,
        pubkey: data.pubkey,
        identifier: data.identifier,
        relays: data.relays,
      }
    }
  } catch {}
  return null
}

function isNostrIdentifier(value: string): boolean {
  // Check if it looks like a nostr bech32 identifier
  return /^(npub|nprofile|note|nevent|naddr)[a-z0-9]{59,}$/i.test(value)
}

export function parseNostrQuery(q: string): NostrFilter {
  const filter: NostrFilter = {}
  const searchParts: string[] = []

  const tokens = q.match(/"[^"]*"|\S+/g) || []

  for (const token of tokens) {
    const match = token.match(/^([^:]+):(.+)$/)

    if (!match) {
      // Token without "field:" prefix
      const cleanToken = token.replace(/^"|"$/g, '')

      // Check if it's a nostr identifier (npub, nprofile, note, nevent, etc.)
      if (isNostrIdentifier(cleanToken)) {
        // Try to decode as author (npub/nprofile)
        const authorPubkey = decodeAuthor(cleanToken)
        if (authorPubkey !== cleanToken) {
          // Successfully decoded as npub/nprofile
          filter.authors ??= []
          filter.authors.push(authorPubkey)
          continue
        }

        // Try to decode as event ID (note/nevent)
        const eventId = decodeEventId(cleanToken)
        if (eventId) {
          filter.ids ??= []
          filter.ids.push(eventId)
          continue
        }

        // Try to decode as naddr (addressable event)
        const naddr = decodeNaddr(cleanToken)
        if (naddr) {
          filter.kinds = [naddr.kind]
          filter.authors ??= []
          filter.authors.push(naddr.pubkey)
          filter['#d'] ??= []
          filter['#d'].push(naddr.identifier)
          if (naddr.relays?.length) {
            ;(filter as any)._relays = naddr.relays
          }
          continue
        }
      }

      // Not a nostr identifier, add to search text
      searchParts.push(cleanToken)
      continue
    }

    const [, fieldRaw, raw] = match
    const field = fieldRaw.toLowerCase()
    const values = raw
      .split(',')
      .map((v) => v.replace(/^"|"$/g, '').toLowerCase())

    switch (field) {
      case 'kind':
        filter.kinds ??= []

        values.forEach((v) => {
          if (/^\d+$/.test(v)) {
            filter.kinds!.push(Number(v))
          } else if (KIND_ALIASES[v]) {
            filter.kinds!.push(...KIND_ALIASES[v])
          }
        })

        break

      case 'from':
      case 'author':
        filter.authors ??= []
        values.forEach((v) => filter.authors!.push(decodeAuthor(v)))
        break

      case 'id':
        filter.ids ??= []
        values.forEach((v) => {
          // Try to decode note/nevent, otherwise use as-is
          const eventId = decodeEventId(v)
          filter.ids!.push(eventId || v)
        })
        break

      case '#t':
      case 'tag':
        filter['#t'] ??= []
        values.forEach((v) => filter['#t'].push(v))
        break

      case '#p':
        filter['#p'] ??= []
        values.forEach((v) => filter['#p'].push(decodeAuthor(v)))
        break

      case '#e':
        filter['#e'] ??= []
        values.forEach((v) => filter['#e'].push(v))
        break

      case 'since':
        const since = parseDateToUnix(values[0])
        if (since) filter.since = since
        break

      case 'until':
        const until = parseDateToUnix(values[0])
        if (until) filter.until = until
        break

      case 'limit':
        if (/^\d+$/.test(values[0])) filter.limit = Number(values[0])
        else filter.limit = 100
        break

      default:
        searchParts.push(token)
    }
  }

  // Default kinds wenn keine angegeben
  if (!filter.kinds || filter.kinds.length === 0) {
    filter.kinds = [...DEFAULT_KINDS]
  }

  // Dedupe arrays
  for (const key in filter) {
    if (Array.isArray((filter as any)[key])) {
      ;(filter as any)[key] = [...new Set((filter as any)[key])]
    }
  }

  if (searchParts.length) {
    filter.search = searchParts.join(' ').trim()
  }

  console.log('Parsed filter:', filter)

  return filter
}
