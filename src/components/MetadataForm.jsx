export default function MetadataForm({ metadata, onChange }) {
  function update(field, value) {
    onChange({ ...metadata, [field]: value })
  }

  function handleTagsInput(raw) {
    // Parse comma-separated tags, strip leading # from each
    const tags = raw
      .split(',')
      .map(t => t.trim().replace(/^#/, ''))
      .filter(Boolean)
    onChange({ ...metadata, tagsRaw: raw, tags })
  }

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xs font-semibold text-neutral-500 uppercase tracking-widest">
        Article Metadata
      </h2>

      {/* Title — required */}
      <div className="space-y-1">
        <label htmlFor="meta-title" className="block text-sm text-neutral-400">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="meta-title"
          type="text"
          value={metadata.title}
          onChange={e => update('title', e.target.value)}
          placeholder="Article title"
          className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-purple-600 text-sm"
          aria-required="true"
        />
      </div>

      {/* Summary / subtitle */}
      <div className="space-y-1">
        <label htmlFor="meta-summary" className="block text-sm text-neutral-400">
          Summary / Subtitle
        </label>
        <input
          id="meta-summary"
          type="text"
          value={metadata.summary}
          onChange={e => update('summary', e.target.value)}
          placeholder="Optional subtitle or summary"
          className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-purple-600 text-sm"
        />
      </div>

      {/* Cover image URL */}
      <div className="space-y-1">
        <label htmlFor="meta-image" className="block text-sm text-neutral-400">
          Cover Image URL
        </label>
        <input
          id="meta-image"
          type="url"
          value={metadata.image}
          onChange={e => update('image', e.target.value)}
          placeholder="https://nostr.build/..."
          className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-purple-600 text-sm font-mono"
        />
      </div>

      {/* Tags / hashtags */}
      <div className="space-y-1">
        <label htmlFor="meta-tags" className="block text-sm text-neutral-400">
          Tags
        </label>
        <input
          id="meta-tags"
          type="text"
          value={metadata.tagsRaw}
          onChange={e => handleTagsInput(e.target.value)}
          placeholder="writing, nostr, essay"
          className="w-full px-3 py-2 rounded bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-purple-600 text-sm"
        />
        <p className="text-xs text-neutral-600">Comma-separated. # is optional.</p>
      </div>

    </div>
  )
}
