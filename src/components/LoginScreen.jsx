import { useState, useEffect } from 'react'
import { NDKNip07Signer, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk'
import { nip19 } from 'nostr-tools'
import { getNDK } from '../lib/ndk.js'

export default function LoginScreen({ onLogin }) {
  const [nsecValue, setNsecValue] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasExtension, setHasExtension] = useState(false)

  useEffect(() => {
    // Some extensions (nos2x) inject window.nostr after the page renders.
    // Poll briefly to catch late injections.
    if (window.nostr) { setHasExtension(true); return }
    const interval = setInterval(() => {
      if (window.nostr) { setHasExtension(true); clearInterval(interval) }
    }, 100)
    const timeout = setTimeout(() => clearInterval(interval), 3000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  // Fetch Kind 0 profile with a timeout so a slow relay doesn't block login
  async function fetchUserProfile(ndk, pubkey) {
    const user = ndk.getUser({ pubkey })
    try {
      await Promise.race([
        user.fetchProfile(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
      ])
    } catch {
      // Profile fetch failure is non-fatal — user still logs in without avatar/name
    }
    return user
  }

  async function loginWithExtension() {
    setError('')
    setLoading(true)
    try {
      const signer = new NDKNip07Signer()
      const ndk = getNDK()
      ndk.signer = signer

      // blockUntilReady resolves once the extension returns the pubkey
      await signer.blockUntilReady()

      // Fire relay connections in the background — login doesn't need to wait for them
      ndk.connect().catch(() => {})

      const pubkey = await signer.user()
      const user = await fetchUserProfile(ndk, pubkey.pubkey)
      onLogin(user)
    } catch (err) {
      setError('Extension login failed: ' + (err.message || 'unknown error'))
    } finally {
      setLoading(false)
    }
  }

  async function loginWithNsec() {
    setError('')
    if (!nsecValue.trim()) {
      setError('Please enter your nsec key.')
      return
    }
    setLoading(true)
    try {
      // Decode nsec → raw private key hex
      const decoded = nip19.decode(nsecValue.trim())
      if (decoded.type !== 'nsec') {
        throw new Error('Input is not a valid nsec key.')
      }
      const privkeyHex = decoded.data

      const signer = new NDKPrivateKeySigner(privkeyHex)
      const ndk = getNDK()
      ndk.signer = signer

      // Fire relay connections in the background
      ndk.connect().catch(() => {})

      const ndkUser = await signer.user()
      const user = await fetchUserProfile(ndk, ndkUser.pubkey)
      onLogin(user)
    } catch (err) {
      setError(err.message || 'Invalid nsec key.')
    } finally {
      setLoading(false)
      // Clear the input field — key should not linger in the DOM
      setNsecValue('')
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="w-full max-w-md space-y-8">

        {/* Logo / title */}
        <div className="text-center">
          <img src="/nostrmd.png" alt="NostrMD" className="h-16 mx-auto mb-2" />
          <p className="mt-2 text-neutral-500 text-sm">Long-form publishing for Nostr</p>
        </div>

        {/* NIP-07 extension login */}
        <div className="space-y-3">
          <button
            onClick={loginWithExtension}
            disabled={loading || !hasExtension}
            className="w-full py-3 px-4 rounded-lg bg-purple-700 hover:bg-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors"
            aria-label="Login with Nostr browser extension"
          >
            {loading ? 'Connecting...' : 'Login with Extension'}
          </button>
          {!hasExtension && (
            <p className="text-xs text-neutral-500 text-center">
              No extension detected. Install Alby, nos2x, or Nostore to use this option.
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-neutral-800" />
          <span className="text-xs text-neutral-600">or</span>
          <div className="flex-1 h-px bg-neutral-800" />
        </div>

        {/* nsec direct input */}
        <div className="space-y-3">
          <div className="space-y-1">
            <label htmlFor="nsec-input" className="block text-sm text-neutral-400">
              Private key (nsec)
            </label>
            <input
              id="nsec-input"
              type="password"
              value={nsecValue}
              onChange={e => setNsecValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loginWithNsec()}
              placeholder="nsec1..."
              autoComplete="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-lg bg-neutral-900 border border-neutral-700 text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-purple-600 font-mono text-sm"
              aria-label="Nostr private key input"
            />
          </div>

          {/* Security warning */}
          <p className="text-xs text-amber-500/80 leading-relaxed">
            Your key is held in memory only and will be cleared when you close or refresh this page.
            It is never written to storage.
          </p>

          <button
            onClick={loginWithNsec}
            disabled={loading || !nsecValue.trim()}
            className="w-full py-3 px-4 rounded-lg bg-neutral-800 hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-100 font-medium transition-colors border border-neutral-700"
            aria-label="Login with nsec private key"
          >
            {loading ? 'Connecting...' : 'Login with Key'}
          </button>
        </div>

        {/* Error display */}
        {error && (
          <p className="text-sm text-red-400 text-center" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  )
}
