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

// Checks if a URL uses a safe protocol (http/https only).
// Blocks javascript:, data:, vbscript:, etc.
export function isSafeUrl(url) {
  if (!url) return true
  try {
    const parsed = new URL(url)
    return ['http:', 'https:'].includes(parsed.protocol)
  } catch {
    return false
  }
}

// Escapes characters that have special meaning in markdown link syntax
function escapeMarkdownLink(str) {
  return (str || '').replace(/[[\]()]/g, '\\$&')
}

// Builds the "Originally published at" attribution line injected into content.
// Escapes user input to prevent markdown injection via sourceName/sourceUrl.
export function buildAttributionLine(sourceName, sourceUrl, publishedAt) {
  const dateStr = publishedAt
    ? new Date(publishedAt * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : ''
  const safeName = escapeMarkdownLink(sourceName)
  const sourceLink = sourceUrl && isSafeUrl(sourceUrl)
    ? `[${safeName}](${escapeMarkdownLink(sourceUrl)})`
    : safeName
  return `*Originally published at ${sourceLink}${dateStr ? ` on ${dateStr}` : ''}*\n\n`
}
