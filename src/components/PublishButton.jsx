import { useState } from 'react'
import { publishArticle } from '../lib/publish.js'

// Publish states
const STATE = {
  IDLE: 'idle',
  PUBLISHING: 'publishing',
  SUCCESS: 'success',
  ERROR: 'error',
}

export default function PublishButton({ content, metadata, source, user, onPublishAnother }) {
  const [state, setState] = useState(STATE.IDLE)
  const [result, setResult] = useState(null) // { nevent, relays }
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)

  const canPublish = !!metadata.title.trim() && !!content.trim()

  async function handlePublish() {
    if (!canPublish) return
    setState(STATE.PUBLISHING)
    setError('')
    try {
      const res = await publishArticle({ content, metadata, source })
      setResult(res)
      setState(STATE.SUCCESS)
    } catch (err) {
      setError(err.message || 'Publish failed.')
      setState(STATE.ERROR)
    }
  }

  async function handleCopyEventId() {
    if (!result?.nevent) return
    try {
      await navigator.clipboard.writeText(result.nevent)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }

  function handlePublishAnother() {
    setState(STATE.IDLE)
    setResult(null)
    setError('')
    onPublishAnother()
  }

  // Success state
  if (state === STATE.SUCCESS && result) {
    return (
      <div className="space-y-3">
        <div className="px-3 py-2 rounded bg-green-950 border border-green-800 text-green-400 text-sm">
          Published successfully.
        </div>

        {/* Relay list */}
        <div className="space-y-1">
          <p className="text-xs text-neutral-600">Published to:</p>
          {result.relays.map(r => (
            <p key={r} className="text-xs text-neutral-500 font-mono truncate">{r}</p>
          ))}
        </div>

        {/* View on njump.me */}
        <a
          href={`https://njump.me/${result.nevent}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center py-2 px-4 rounded bg-purple-700 hover:bg-purple-600 text-white text-sm transition-colors"
        >
          View on njump.me →
        </a>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopyEventId}
            className="flex-1 py-2 px-3 rounded border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 text-xs transition-colors"
          >
            {copied ? 'Copied!' : 'Copy Event ID'}
          </button>
          <button
            onClick={handlePublishAnother}
            className="flex-1 py-2 px-3 rounded border border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:border-neutral-500 text-xs transition-colors"
          >
            Publish Another
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {/* Validation hint */}
      {!canPublish && (
        <p className="text-xs text-neutral-600">
          {!metadata.title.trim() ? 'A title is required.' : 'Add some content to publish.'}
        </p>
      )}

      {/* Error display */}
      {state === STATE.ERROR && error && (
        <p className="text-xs text-red-400" role="alert">{error}</p>
      )}

      <button
        onClick={handlePublish}
        disabled={!canPublish || state === STATE.PUBLISHING}
        className="w-full py-3 px-4 rounded bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm transition-colors"
        aria-label="Sign and publish article to Nostr"
      >
        {state === STATE.PUBLISHING ? 'Publishing...' : 'Publish to Nostr'}
      </button>
    </div>
  )
}
