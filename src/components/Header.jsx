import { useState } from 'react'
import { truncateNpub } from '../lib/utils.js'
import { resetNDK } from '../lib/ndk.js'
import BoostModal from './BoostModal.jsx'

const GITHUB_URL = 'https://github.com/Reeds-Agent-Team/nostrmd'

// GitHub mark SVG (official, trimmed)
function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" fill="currentColor" aria-hidden="true">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52
        -.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2
        -3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82
        .64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08
        2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01
        1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

export default function Header({ user, onLogout, onOpenArticles, onOpenHelp, readOnly }) {
  const [boostOpen, setBoostOpen] = useState(false)
  const profile = user?.profile
  const npub = user?.npub || ''

  function handleLogout() {
    // Wipe the NDK singleton so a fresh instance is created on next login
    resetNDK()
    onLogout()
  }

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 bg-neutral-950">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {profile?.image ? (
          <img
            src={profile.image}
            alt={profile.displayName || 'avatar'}
            className="w-8 h-8 rounded-full object-cover bg-neutral-800"
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-500 text-xs">
            ?
          </div>
        )}

        {/* Name + npub */}
        <div className="leading-tight">
          <p className="text-sm font-medium text-neutral-100">
            {profile?.displayName || profile?.name || 'Anonymous'}
          </p>
          <p className="text-xs text-neutral-500 font-mono">{truncateNpub(npub)}</p>
        </div>
      </div>

      {/* Logo centered */}
      <img src="/nostrmd.png" alt="NostrMD" className="h-7 absolute left-1/2 -translate-x-1/2" />

      <div className="flex items-center gap-2">
        {/* My Articles drawer toggle */}
        <button
          onClick={onOpenArticles}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-3 py-1.5 rounded border border-neutral-800 hover:border-neutral-600"
          aria-label="View my published articles"
        >
          My Articles
        </button>

        {/* Boost */}
        <button
          onClick={() => setBoostOpen(true)}
          className="text-xs text-amber-600 hover:text-amber-400 transition-colors px-3 py-1.5 rounded border border-amber-900 hover:border-amber-700"
          aria-label="Send a lightning boost to support NostrMD"
        >
          ⚡
        </button>

        {/* GitHub */}
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-neutral-500 hover:text-neutral-300 transition-colors px-3 py-1.5 rounded border border-neutral-800 hover:border-neutral-600 flex items-center"
          aria-label="NostrMD on GitHub"
        >
          <GitHubIcon />
        </a>

        {/* Help */}
        <button
          onClick={onOpenHelp}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-3 py-1.5 rounded border border-neutral-800 hover:border-neutral-600"
          aria-label="How to use NostrMD"
        >
          ?
        </button>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="text-xs text-neutral-500 hover:text-neutral-300 transition-colors px-3 py-1.5 rounded border border-neutral-800 hover:border-neutral-600"
          aria-label="Logout"
        >
          Logout
        </button>
      </div>

      {/* Boost modal */}
      {boostOpen && <BoostModal user={user} onClose={() => setBoostOpen(false)} readOnly={readOnly} />}
    </header>
  )
}
