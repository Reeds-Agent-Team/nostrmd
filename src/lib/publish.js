import { NDKEvent } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { getNDK, FALLBACK_RELAYS } from './ndk.js'
import { titleToSlug, toUnixTimestamp, buildAttributionLine } from './utils.js'

/**
 * Constructs and publishes a NIP-23 Kind 30023 event.
 *
 * @param {object} params
 * @param {string} params.content - Raw markdown content from the editor
 * @param {object} params.metadata - Title, summary, publishedAtDate, createdAtOverride, image, tags
 * @param {object} params.source - name and url for the "originally published at" attribution
 * @returns {Promise<{nevent: string, relays: string[]}>}
 */
export async function publishArticle({ content, metadata, source }) {
  const ndk = getNDK()

  // Prepend attribution line if source name is provided
  let finalContent = content
  if (source.name) {
    const publishedAtUnix = metadata.publishedAtDate
      ? toUnixTimestamp(new Date(metadata.publishedAtDate))
      : null
    const attribution = buildAttributionLine(source.name, source.url, publishedAtUnix)
    finalContent = attribution + content
  }

  // Determine created_at: use override if set, otherwise current time
  const createdAt = metadata.createdAtOverride
    ? toUnixTimestamp(new Date(metadata.createdAtOverride))
    : Math.floor(Date.now() / 1000)

  // published_at: use the user-supplied date if set, otherwise fall back to createdAt
  const publishedAt = metadata.publishedAtDate
    ? String(toUnixTimestamp(new Date(metadata.publishedAtDate)))
    : String(createdAt)

  // Build tags array
  const tags = [
    ['d', titleToSlug(metadata.title)],
    ['title', metadata.title],
    ['published_at', publishedAt],
  ]
  if (metadata.summary) tags.push(['summary', metadata.summary])
  if (metadata.image) tags.push(['image', metadata.image])
  metadata.tags?.forEach(t => { if (t) tags.push(['t', t]) })

  // Construct the NDK event
  const event = new NDKEvent(ndk)
  event.kind = 30023
  event.content = finalContent
  event.created_at = createdAt
  event.tags = tags

  // Determine relay set — try to use the user's Kind 10002 relay list via NDK,
  // fall back to hardcoded defaults if NDK hasn't loaded one
  let relayUrls = FALLBACK_RELAYS
  try {
    const relayList = await ndk.activeUser?.relayList()
    const writeRelays = relayList?.writeRelayUrls
    if (writeRelays?.length) relayUrls = writeRelays
  } catch {
    // Non-fatal — fallback relays will be used
  }

  // Sign and publish
  await event.sign()
  await event.publish()

  // Build nevent for the success link
  const nevent = nip19.neventEncode({
    id: event.id,
    relays: relayUrls.slice(0, 3), // keep the encoded nevent compact
    author: event.pubkey,
  })

  return { nevent, relays: relayUrls }
}
