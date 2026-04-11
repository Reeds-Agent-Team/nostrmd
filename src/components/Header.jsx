import { truncateNpub } from '../lib/utils.js'
import { resetNDK } from '../lib/ndk.js'

export default function Header({ user, onLogout, onOpenArticles, onOpenHelp }) {
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
    </header>
  )
}
