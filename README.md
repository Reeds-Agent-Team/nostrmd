# NostrMD

A focused long-form publishing tool for Nostr. NostrMD does one thing: helps you write, format, and publish NIP-23 Kind 30023 articles to the Nostr network — with accurate metadata, proper backdating, and original source attribution.

No feed. No social features. No distractions.

**[nostrmd.xyz](https://nostrmd.xyz)**

---

## What It's For

NostrMD is built for writers who want to move their existing work onto Nostr — from Substack, Medium, personal blogs, or anywhere else — without losing the original publication date, source attribution, or article metadata.

It's also a backup and restore tool. Every article you've published as a long-form Nostr note can be downloaded as a local `.md` file with all metadata preserved, and re-published from that file later if needed.

---

## The Workflow

### Migrating Old Articles

The intended workflow for migrating existing content to Nostr:

1. **Scrape your old articles** — use an AI agent or tool to pull your existing content and format it as `.md` files. The agent never touches your Nostr keys.
2. **Handle images manually** — download any images from your old articles and upload them to a media host (e.g. [nostr.build](https://nostr.build)). Paste the returned URLs into your `.md` file or into the Cover Image field in NostrMD.
3. **Upload and review** — open NostrMD, upload the `.md` file, and review the live preview. Fill in the metadata fields.
4. **Set the original source** — add the platform name, original URL, and original publication date. NostrMD will prepend a properly formatted attribution line to your content and set the correct `published_at` timestamp so NIP-23 clients display the right date.
5. **Publish** — sign with your Nostr key (via browser extension or nsec) and publish to your relay list.

### Writing New Articles

NostrMD also works as a straightforward long-form editor. Write or paste markdown directly, fill in your metadata, and publish.

---

## Features

### Publishing
- **Markdown file upload** — drag in a `.md` file and it loads instantly into the editor
- **Write / paste mode** — start from a blank editor
- **Live split-pane preview** — see your rendered article, cover image, title, subtitle, and attribution line update in real time as you type
- **NIP-23 compliant** — publishes proper Kind 30023 events with `title`, `summary`, `published_at`, `image`, `t`, `d`, and `client` tags
- **Relay-aware** — reads your Kind 10002 relay list and publishes to your write relays; falls back to a curated set of well-known long-form relays if none are found

### Metadata
- **Title and subtitle** — maps to NIP-23 `title` and `summary` tags
- **Cover image** — paste any image URL; preview renders at 16:9 in real time
- **Tags / hashtags** — comma-separated, `#` optional
- **Original Publication Date** — sets the `published_at` tag so clients like Habla and Highlighter display the correct historical date

### Original Source Attribution
- **Platform name** — e.g. "Substack", "Medium", "My Blog"
- **Original URL** — optional link back to the source
- When filled in, NostrMD prepends an italicized attribution line to your content before signing:
  *Originally published at [Platform](URL) on Month Day, Year*

### Article History & Backup
- **My Articles** — load all of your previously published Kind 30023 events directly from your relay list. Click any article to load it back into the editor with all metadata restored.
- **Export .md** — download any article (loaded from relays or freshly written) as a `.md` file with YAML frontmatter containing all metadata:

```markdown
---
title: Article Title
summary: Subtitle or summary
published_at: 2023-03-10
image: https://nostr.build/cover.jpg
tags: [writing, nostr, essay]
source_name: Substack
source_url: https://yourname.substack.com/p/article
---

Article body...
```

Uploading one of these exported files back into NostrMD auto-populates all fields exactly as they were — title, date, tags, source, everything. This makes NostrMD both a publishing tool and a **local backup system** for your Nostr long-form content. If relays stop hosting your work, your exported `.md` files are a complete, portable archive.

### Authentication
- **NIP-07 browser extension** — works with Alby, nos2x, Nostore, and any NIP-07 compatible extension. Your key never leaves the extension.
- **nsec direct input** — paste your `nsec1...` key directly. It is held in memory only and never written to storage or localStorage. Cleared on logout or page refresh.

---

## Tech Stack

- [React](https://react.dev) + [Vite](https://vitejs.dev)
- [NDK](https://github.com/nostr-dev-kit/ndk) — relay management, signing, NIP-07
- [@uiw/react-md-editor](https://github.com/uiwjs/react-md-editor) — markdown editor and preview
- [Tailwind CSS](https://tailwindcss.com)
- No backend — fully client-side

---

## Running Locally

```bash
git clone https://github.com/Reeds-Agent-Team/nostrmd.git
cd nostrmd
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## License

MIT
