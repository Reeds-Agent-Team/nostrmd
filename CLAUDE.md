# NostrMD — Claude Project Brief

## What This Is
Single-purpose web app for publishing long-form Nostr notes (NIP-23 Kind 30023). No feed, no social features. Designed for writers migrating content from other platforms (Substack, Medium, etc.) into Nostr with accurate metadata and backdating.

## Tech Stack
- React + Vite
- NDK (`@nostr-dev-kit/ndk`) — relay management, signing, NIP-07
- `@uiw/react-md-editor` — split-pane markdown editor
- Tailwind CSS
- No backend. Fully client-side.

## Do NOT Build (ever)
- Social feed, timeline, article browsing
- Notifications, DMs, zaps, reactions
- Kind 0 profile editor
- Account creation flow
- User search or discovery
- Any server-side storage

## Auth
- NIP-07 via `NDKNip07Signer` (detect `window.nostr`)
- nsec direct input via `NDKPrivateKeySigner` — **in memory only, never written to any storage**
- Post-login header: avatar, display name, truncated npub, logout button

## Core Flow (single page)
1. Markdown input — file upload tab OR paste/type tab
2. Metadata fields: title (required), summary, published_at (date picker), created_at (advanced toggle), cover image URL, tags
3. "Originally published at" source injector — prepends italicized line to content before signing
4. Publish — constructs NIP-23 event, signs, publishes to Kind 10002 relay list (fallback to hardcoded defaults)

## NIP-23 Event Structure
```json
{
  "kind": 30023,
  "created_at": <unix now>,
  "content": "...",
  "tags": [
    ["d", "<slug-or-uuid>"],
    ["title", "..."],
    ["summary", "..."],
    ["published_at", "<unix timestamp>"],
    ["image", "..."],
    ["t", "tag1"],
    ["t", "tag2"]
  ]
}
```
`d` tag: slug from title (lowercase, hyphenated) or UUID if no title.

## Relay Fallbacks (if no Kind 10002 found)
- wss://relay.damus.io
- wss://nos.lol
- wss://relay.nostr.band
- wss://relay.primal.net
- wss://purplepag.es

## UI Guidelines
- Single page, no routing beyond login state
- Dark mode preferred (not a hard requirement — don't let it block anything)
- Desktop-first, mobile not a priority for MVP
- No popups, wizards, or intrusive tooltips
- Proper labels on all inputs, keyboard navigable

## Component Structure
```
src/
  main.jsx
  App.jsx
  components/
    LoginScreen.jsx
    Editor.jsx
    MetadataForm.jsx
    OriginalSourceField.jsx
    PublishButton.jsx
  lib/
    ndk.js          # NDK singleton
    publish.js      # Event construction + publishing
    utils.js        # Slug gen, date formatting
  styles/
    index.css
```

## Working Rules (from custom-prompt.md)
- Context Window = RAM (volatile). Filesystem = Disk (persistent). Anything important gets written to disk.
- Read `.claude/plan.md` before making major decisions.
- Update `.claude/progress.md` throughout each session.
- Log all errors in `.claude/progress.md`.
- 3-strike error protocol: diagnose → alternative approach → broader rethink → escalate to user.
- Never repeat a failed action. Mutate the approach.
- Comments where logic isn't obvious (NDK wiring, nsec handling, event construction). No boilerplate docstrings.

## Build Phases
See `.claude/plan.md` for current phase status.
