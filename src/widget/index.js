/**
 * NostrMD Boost Widget — embeddable lightning boost button
 * V4V 2.0 Donation Boostagram standard (nostrmd.com)
 *
 * Usage:
 *   <script src="https://nostrmd.com/boost.js"></script>
 *   <div class="nostrmd-boost" data-npub="npub1..."></div>
 *
 * The widget reads data-npub, fetches that pubkey's kind 0 profile from Nostr
 * to get their lud16 lightning address, then presents a boost button.
 * The entire flow (kind 30078 publish, LNURL invoice, payment polling) runs
 * client-side. When the nostrmd backend API is live, set BACKEND_API_URL below
 * and the widget will offload to it (enabling description_hash linking).
 *
 * Backend API seam (POST /api/boost):
 *   Request:  { npub, amount_msats, message, donor_npub }
 *   Response: { invoice, event_id, verify_url }
 * Set BACKEND_API_URL to a non-null string to activate.
 */

import { generateSecretKey, getPublicKey, finalizeEvent, SimplePool } from 'nostr-tools'
import { nip19 } from 'nostr-tools'
import {
  bolt11PaymentHash,
  generateBurnerKeypair,
  publishDonationBoostagram,
  fetchLnurlMeta,
  fetchLnurlInvoice,
  pollVerify,
  FALLBACK_LUD16,
  resolveRecipientLud16,
} from '../lib/boostagram.js'

// Set to your backend URL when ready, e.g. 'https://nostrmd.com/api/boost'
const BACKEND_API_URL = null

const PRESETS = [21, 100, 500, 1000, 5000]
const POLL_INTERVAL_MS = 2500

// ─── Styles ──────────────────────────────────────────────────────────────────
const STYLES = `
  .nmd-btn {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 8px 16px; border-radius: 6px;
    background: #d97706; color: #fff;
    border: none; cursor: pointer; font-size: 14px; font-weight: 600;
    font-family: system-ui, sans-serif;
    transition: background 0.15s;
  }
  .nmd-btn:hover { background: #b45309; }
  .nmd-btn:disabled { opacity: 0.5; cursor: default; }
  .nmd-btn-secondary {
    display: block; width: 100%; padding: 8px;
    background: transparent; border: 1px solid #404040;
    border-radius: 6px; color: #a3a3a3; cursor: pointer;
    font-size: 12px; font-family: monospace;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: border-color 0.15s, color 0.15s;
  }
  .nmd-btn-secondary:hover { border-color: #737373; color: #e5e5e5; }
  .nmd-notice { font-size: 12px; color: #737373; font-family: system-ui, sans-serif; }
  .nmd-backdrop {
    position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 9998;
  }
  .nmd-modal-wrap {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center; padding: 24px;
  }
  .nmd-modal {
    background: #171717; border: 1px solid #262626; border-radius: 12px;
    width: 100%; max-width: 360px; font-family: system-ui, sans-serif;
  }
  .nmd-modal-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 24px; border-bottom: 1px solid #262626;
  }
  .nmd-modal-header h2 { margin: 0; font-size: 14px; font-weight: 600; color: #e5e5e5; }
  .nmd-close {
    background: none; border: none; color: #737373; cursor: pointer;
    font-size: 18px; line-height: 1; padding: 0;
  }
  .nmd-close:hover { color: #d4d4d4; }
  .nmd-modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
  .nmd-label { display: block; font-size: 12px; color: #a3a3a3; margin-bottom: 6px; }
  .nmd-presets { display: flex; gap: 6px; }
  .nmd-preset {
    flex: 1; padding: 6px 4px; border-radius: 4px;
    border: 1px solid #404040; background: transparent;
    color: #737373; font-size: 12px; cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .nmd-preset:hover { border-color: #525252; color: #d4d4d4; }
  .nmd-preset.active { border-color: #d97706; color: #fbbf24; background: rgba(217,119,6,0.1); }
  .nmd-input {
    width: 100%; padding: 8px 12px; background: #262626;
    border: 1px solid #404040; border-radius: 6px;
    color: #e5e5e5; font-size: 14px; box-sizing: border-box;
    outline: none; font-family: system-ui, sans-serif;
  }
  .nmd-input:focus { border-color: #737373; }
  .nmd-error { font-size: 12px; color: #f87171; }
  .nmd-qr-wrap { display: flex; justify-content: center; padding: 8px 0; }
  .nmd-qr-wrap img { border-radius: 8px; }
  .nmd-center { text-align: center; }
  .nmd-pulse {
    display: inline-block; width: 8px; height: 8px;
    border-radius: 50%; background: #d97706;
    animation: nmdPulse 1.5s ease-in-out infinite;
  }
  .nmd-success {
    display: flex; flex-direction: column; align-items: center;
    gap: 16px; padding: 16px 0; text-align: center;
  }
  .nmd-success-icon {
    width: 56px; height: 56px; border-radius: 50%;
    background: rgba(20,83,45,0.5); border: 1px solid #15803d;
    display: flex; align-items: center; justify-content: center;
    font-size: 24px; color: #4ade80;
  }
  .nmd-receipt { font-size: 11px; color: #404040; font-family: monospace; word-break: break-all; }
  @keyframes nmdPulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`

function injectStyles() {
  if (document.getElementById('nmd-styles')) return
  const style = document.createElement('style')
  style.id = 'nmd-styles'
  style.textContent = STYLES
  document.head.appendChild(style)
}

// ─── QR code via public API (no bundled dep needed for widget) ────────────────
function qrImageUrl(data) {
  return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(data)}&size=200x200&margin=10`
}

// ─── Modal ────────────────────────────────────────────────────────────────────
function createModal(lud16, ownerNpub) {
  let amount = '21'
  let message = ''
  let invoice = ''
  let eventId = ''
  let verifyUrl = null
  let lnurlMeta = null
  let stopPoll = null
  let copied = false

  const backdrop = document.createElement('div')
  backdrop.className = 'nmd-backdrop'

  const wrap = document.createElement('div')
  wrap.className = 'nmd-modal-wrap'

  const modal = document.createElement('div')
  modal.className = 'nmd-modal'
  modal.setAttribute('role', 'dialog')
  modal.setAttribute('aria-label', 'Send a Boost')

  function close() {
    if (stopPoll) { stopPoll(); stopPoll = null }
    backdrop.remove()
    wrap.remove()
    document.removeEventListener('keydown', escListener)
  }
  function escListener(e) { if (e.key === 'Escape') close() }
  document.addEventListener('keydown', escListener)

  backdrop.addEventListener('click', close)

  function render(view) {
    modal.innerHTML = ''

    // Header
    const header = document.createElement('div')
    header.className = 'nmd-modal-header'
    header.innerHTML = `<h2>⚡ Send a Boost</h2>`
    const closeBtn = document.createElement('button')
    closeBtn.className = 'nmd-close'
    closeBtn.textContent = '✕'
    closeBtn.setAttribute('aria-label', 'Close')
    closeBtn.addEventListener('click', close)
    header.appendChild(closeBtn)
    modal.appendChild(header)

    const body = document.createElement('div')
    body.className = 'nmd-modal-body'

    if (view === 'form') renderForm(body)
    if (view === 'qr') renderQR(body)
    if (view === 'paid') renderPaid(body)

    modal.appendChild(body)
  }

  function renderForm(body) {
    const desc = document.createElement('p')
    desc.className = 'nmd-notice'
    desc.textContent = `Boost via ${lud16}`
    body.appendChild(desc)

    // Amount
    const amtWrap = document.createElement('div')
    const amtLabel = document.createElement('label')
    amtLabel.className = 'nmd-label'
    amtLabel.textContent = 'Amount (sats)'
    amtWrap.appendChild(amtLabel)

    const presetRow = document.createElement('div')
    presetRow.className = 'nmd-presets'
    PRESETS.forEach(p => {
      const btn = document.createElement('button')
      btn.className = 'nmd-preset' + (amount === String(p) ? ' active' : '')
      btn.textContent = p.toLocaleString()
      btn.addEventListener('click', () => { amount = String(p); render('form') })
      presetRow.appendChild(btn)
    })
    amtWrap.appendChild(presetRow)

    const amtInput = document.createElement('input')
    amtInput.className = 'nmd-input'
    amtInput.type = 'number'
    amtInput.min = '1'
    amtInput.value = amount
    amtInput.placeholder = 'Custom'
    amtInput.style.marginTop = '8px'
    amtInput.addEventListener('input', e => { amount = e.target.value })
    amtWrap.appendChild(amtInput)
    body.appendChild(amtWrap)

    // Message
    const msgWrap = document.createElement('div')
    const msgLabel = document.createElement('label')
    msgLabel.className = 'nmd-label'
    msgLabel.textContent = 'Message (optional)'
    msgWrap.appendChild(msgLabel)
    const msgInput = document.createElement('input')
    msgInput.className = 'nmd-input'
    msgInput.type = 'text'
    msgInput.value = message
    msgInput.maxLength = 140
    msgInput.placeholder = 'Leave a note'
    msgInput.addEventListener('input', e => { message = e.target.value })
    msgWrap.appendChild(msgInput)
    body.appendChild(msgWrap)

    const errEl = document.createElement('p')
    errEl.className = 'nmd-error'
    errEl.id = 'nmd-form-err'
    body.appendChild(errEl)

    const boostBtn = document.createElement('button')
    boostBtn.className = 'nmd-btn'
    boostBtn.style.width = '100%'
    boostBtn.style.justifyContent = 'center'
    boostBtn.textContent = lnurlMeta ? 'Boost ⚡' : 'Connecting…'
    boostBtn.disabled = !lnurlMeta
    boostBtn.addEventListener('click', () => handleBoost(errEl, boostBtn))
    body.appendChild(boostBtn)
  }

  function renderQR(body) {
    const sats = parseInt(amount, 10)

    const img = document.createElement('img')
    img.src = qrImageUrl(`lightning:${invoice.toUpperCase()}`)
    img.alt = 'Lightning invoice QR code'
    img.width = 200
    img.height = 200
    img.style.borderRadius = '8px'
    const qrWrap = document.createElement('div')
    qrWrap.className = 'nmd-qr-wrap'
    qrWrap.appendChild(img)
    body.appendChild(qrWrap)

    const hint = document.createElement('p')
    hint.className = 'nmd-notice nmd-center'
    hint.textContent = `Scan with any lightning wallet · ${sats.toLocaleString()} sats`
    body.appendChild(hint)

    if (verifyUrl) {
      const waiting = document.createElement('p')
      waiting.className = 'nmd-notice nmd-center'
      waiting.innerHTML = `<span class="nmd-pulse"></span> Waiting for payment…`
      waiting.style.display = 'flex'
      waiting.style.alignItems = 'center'
      waiting.style.justifyContent = 'center'
      waiting.style.gap = '8px'
      body.appendChild(waiting)
    }

    const copyBtn = document.createElement('button')
    copyBtn.className = 'nmd-btn-secondary'
    copyBtn.title = invoice
    copyBtn.textContent = invoice.slice(0, 32) + '…'
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(invoice).then(() => {
        copyBtn.textContent = '✓ Copied'
        setTimeout(() => { copyBtn.textContent = invoice.slice(0, 32) + '…' }, 2000)
      })
    })
    body.appendChild(copyBtn)

    const backBtn = document.createElement('button')
    backBtn.style.cssText = 'width:100%;background:none;border:none;color:#525252;cursor:pointer;font-size:12px;padding:4px;'
    backBtn.textContent = '← Different amount'
    backBtn.addEventListener('click', () => {
      if (stopPoll) { stopPoll(); stopPoll = null }
      invoice = ''; verifyUrl = null
      render('form')
    })
    body.appendChild(backBtn)
  }

  function renderPaid(body) {
    const sats = parseInt(amount, 10)
    const success = document.createElement('div')
    success.className = 'nmd-success'
    success.innerHTML = `
      <div class="nmd-success-icon">✓</div>
      <div>
        <p style="margin:0;font-size:16px;font-weight:600;color:#4ade80">${sats.toLocaleString()} sats received!</p>
        <p style="margin:4px 0 0;font-size:12px;color:#737373">Thanks for the boost ⚡</p>
      </div>
      ${eventId ? `<p class="nmd-receipt">receipt: ${eventId.slice(0, 16)}…</p>` : ''}
    `
    const closeBtn2 = document.createElement('button')
    closeBtn2.className = 'nmd-btn'
    closeBtn2.style.background = '#166534'
    closeBtn2.textContent = 'Close'
    closeBtn2.addEventListener('click', close)
    success.appendChild(closeBtn2)
    body.appendChild(success)
  }

  async function handleBoost(errEl, boostBtn) {
    errEl.textContent = ''
    const sats = parseInt(amount, 10)
    if (!sats || sats < 1) { errEl.textContent = 'Enter a valid amount.'; return }

    const minSats = Math.ceil((lnurlMeta.minSendable || 1000) / 1000)
    const maxSats = Math.floor((lnurlMeta.maxSendable || 1_000_000_000) / 1000)
    if (sats < minSats || sats > maxSats) {
      errEl.textContent = `Amount must be between ${minSats.toLocaleString()} and ${maxSats.toLocaleString()} sats.`
      return
    }

    boostBtn.disabled = true
    boostBtn.textContent = 'Preparing…'

    try {
      // If a backend API is configured, delegate to it
      if (BACKEND_API_URL) {
        const res = await fetch(BACKEND_API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            npub: ownerNpub,
            amount_msats: sats * 1000,
            message: message.trim(),
            donor_npub: '',  // widget has no login session — anonymous boost
          }),
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Backend error')
        invoice = data.invoice
        eventId = data.event_id || ''
        verifyUrl = data.verify_url || null
      } else {
        // Full client-side flow
        const commentParts = ['[nostrmd boost]']
        if (message.trim()) commentParts.push(message.trim())
        const comment = commentParts.join(' — ')
        const maxLen = lnurlMeta.commentAllowed || 0
        const trimmedComment = maxLen > 0 ? comment.slice(0, maxLen) : comment

        const { pr, verify } = await fetchLnurlInvoice(lnurlMeta.callback, sats * 1000, trimmedComment)
        const paymentHash = bolt11PaymentHash(pr) || crypto.randomUUID().replace(/-/g, '')
        const { sk: burnerSk } = generateBurnerKeypair()
        const { eventId: eid } = await publishDonationBoostagram({
          burnerSk,
          paymentHash,
          donorNpub: '',  // widget has no login session
          recipientLud16: lud16,
          amountMsats: sats * 1000,
          message: message.trim(),
          pageUrl: window.location.href,
        })
        invoice = pr
        eventId = eid
        verifyUrl = verify
      }

      render('qr')

      // Start payment polling
      if (verifyUrl) {
        stopPoll = pollVerify(verifyUrl, POLL_INTERVAL_MS, () => {
          stopPoll = null
          render('paid')
        })
      }
    } catch (e) {
      errEl.textContent = e.message
      boostBtn.disabled = false
      boostBtn.textContent = 'Boost ⚡'
    }
  }

  // Initialize: fetch LNURL meta
  fetchLnurlMeta(lud16).then(meta => {
    lnurlMeta = meta
    // Re-render form if currently shown to enable button
    const boostBtn = modal.querySelector('button[disabled]')
    if (boostBtn) { boostBtn.disabled = false; boostBtn.textContent = 'Boost ⚡' }
  }).catch(() => {})

  render('form')

  wrap.appendChild(modal)
  document.body.appendChild(backdrop)
  document.body.appendChild(wrap)
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
async function initWidget(container) {
  const ownerNpub = container.getAttribute('data-npub')
  if (!ownerNpub) {
    container.innerHTML = '<span style="font-size:12px;color:#737373;font-family:system-ui,sans-serif">nostrmd-boost: missing data-npub</span>'
    return
  }

  // Show loading state
  container.innerHTML = '<span style="font-size:12px;color:#737373;font-family:system-ui,sans-serif">⚡…</span>'

  let lud16
  try {
    lud16 = await resolveRecipientLud16(ownerNpub)
  } catch {
    lud16 = null
  }

  if (!lud16) {
    container.innerHTML = '<span style="font-size:12px;color:#737373;font-family:system-ui,sans-serif">Lightning address not configured on this Nostr profile.</span>'
    return
  }

  // Render boost button
  container.innerHTML = ''
  const btn = document.createElement('button')
  btn.className = 'nmd-btn'
  btn.innerHTML = '⚡ Boost'
  btn.setAttribute('aria-label', 'Send a lightning boost')
  btn.addEventListener('click', () => createModal(lud16, ownerNpub))
  container.appendChild(btn)
}

function bootstrap() {
  injectStyles()
  const containers = document.querySelectorAll('.nostrmd-boost')
  containers.forEach(initWidget)
}

// Run on DOMContentLoaded or immediately if already loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap)
} else {
  bootstrap()
}

// Also expose as global for manual init
window.NostrMDBoost = { init: bootstrap, initWidget }
