/**
 * Cloudflare Pages Function: POST /api/boost
 *
 * This is the backend half of the V4V 2.0 Donation Boostagram standard.
 * It enables the one thing the client-side flow cannot do:
 *   setting description_hash = sha256(kind_30078_event_id) in the BOLT11 invoice,
 *   creating a cryptographic bidirectional link between the payment and its metadata.
 *
 * Full flow (requires a Lightning API that supports custom description_hash):
 *   1. Generate random preimage → payment_hash = sha256(preimage)
 *   2. Generate burner Nostr keypair
 *   3. Publish kind 30078 with d = payment_hash → get event_id
 *   4. description_hash = sha256(event_id hex string, encoded as UTF-8)
 *   5. Create BOLT11 invoice with this payment_hash AND description_hash
 *   6. Return { invoice, event_id, verify_url }
 *
 * Lightning API options (pick one and implement below):
 *   - Alby API (OAuth): https://api.getalby.com — supports description_hash
 *   - LNbits: self-hosted, full invoice control
 *   - Strike API: https://developer.strike.me
 *   - OpenNode: https://developers.opennode.com
 *
 * Environment variables needed (set in Cloudflare Pages dashboard):
 *   LIGHTNING_API_KEY   — API key for your chosen Lightning provider
 *   LIGHTNING_PROVIDER  — 'alby' | 'lnbits' | 'strike' | 'opennode'
 *   LNBITS_URL          — base URL if using LNbits (e.g. https://legend.lnbits.com)
 *
 * Until this is implemented, the widget falls back to full client-side mode
 * (LNURL-pay, no custom description_hash). Set BACKEND_API_URL in
 * src/widget/index.js to activate once ready.
 */

export async function onRequestPost(context) {
  // TODO: implement
  // For now, return 501 so the widget knows to fall back to client-side mode
  return new Response(
    JSON.stringify({ error: 'Backend not yet implemented — widget will use client-side fallback.' }),
    {
      status: 501,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  )
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

/*
 * Implementation template (fill in once you choose a Lightning provider):
 *
 * import { generateSecretKey, getPublicKey, finalizeEvent, SimplePool } from 'nostr-tools'
 *
 * const NOSTR_RELAYS = [
 *   'wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.nostr.band',
 *   'wss://relay.primal.net', 'wss://purplepag.es',
 * ]
 *
 * async function sha256hex(str) {
 *   const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
 *   return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('')
 * }
 *
 * export async function onRequestPost(context) {
 *   const { npub, amount_msats, message, donor_npub } = await context.request.json()
 *
 *   // 1. Generate preimage + payment_hash
 *   const preimage = crypto.getRandomValues(new Uint8Array(32))
 *   const paymentHash = await sha256hex(Array.from(preimage).map(b=>b.toString(16).padStart(2,'0')).join(''))
 *
 *   // 2. Resolve lud16 (or look up from kind 0)
 *   const lud16 = await resolveFromKind0(npub)  // implement separately
 *
 *   // 3. Publish kind 30078
 *   const burnerSk = generateSecretKey()
 *   const event = finalizeEvent({
 *     kind: 30078,
 *     created_at: Math.floor(Date.now() / 1000),
 *     content: message || '',
 *     tags: [
 *       ['d', paymentHash],
 *       ['app', 'nostrmd', '1.0.0'],
 *       ['type', 'donation_boostagram'],
 *       ['sender', donor_npub || 'anonymous'],
 *       ['recipient', lud16],
 *       ['amount', String(amount_msats)],
 *       ['url', context.request.headers.get('origin') || ''],
 *     ],
 *   }, burnerSk)
 *   // publish to relays...
 *   const eventId = event.id
 *
 *   // 4. Compute description_hash = sha256(event_id)
 *   const descriptionHash = await sha256hex(eventId)
 *
 *   // 5. Create invoice via Lightning API with this payment_hash + description_hash
 *   // (implementation depends on provider)
 *   const { invoice, verify_url } = await createInvoice({
 *     preimage,
 *     amount_msats,
 *     description_hash: descriptionHash,
 *     api_key: context.env.LIGHTNING_API_KEY,
 *   })
 *
 *   return Response.json({ invoice, event_id: eventId, verify_url })
 * }
 */
