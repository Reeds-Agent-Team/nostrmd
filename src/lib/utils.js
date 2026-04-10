// Generates a URL-safe slug from a title string.
// Falls back to a UUID if title is empty.
export function titleToSlug(title) {
  const slug = (title || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return slug || crypto.randomUUID()
}

// Converts a Date object to a Unix timestamp in seconds
export function toUnixTimestamp(date) {
  return Math.floor(date.getTime() / 1000)
}

// Truncates an npub for display: "npub1abc...xyz4"
export function truncateNpub(npub) {
  if (!npub || npub.length < 12) return npub
  return `${npub.slice(0, 8)}...${npub.slice(-4)}`
}

// Builds the "Originally published at" attribution line injected into content
export function buildAttributionLine(sourceName, sourceUrl, publishedAt) {
  const dateStr = publishedAt
    ? new Date(publishedAt * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const sourceLink = sourceUrl
    ? `[${sourceName}](${sourceUrl})`
    : sourceName
  return `*Originally published at ${sourceLink}${dateStr ? ` on ${dateStr}` : ''}*\n\n`
}
