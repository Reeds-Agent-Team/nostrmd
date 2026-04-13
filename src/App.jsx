import { useState, useEffect } from 'react'
import LoginScreen from './components/LoginScreen.jsx'
import Header from './components/Header.jsx'
import Editor from './components/Editor.jsx'
import MetadataForm from './components/MetadataForm.jsx'
import OriginalSourceField from './components/OriginalSourceField.jsx'
import PublishButton from './components/PublishButton.jsx'
import ArticleDrawer from './components/ArticleDrawer.jsx'
import HelpModal from './components/HelpModal.jsx'
import DraftBanner from './components/DraftBanner.jsx'
import { useDraft } from './lib/useDraft.js'

// Default state shapes — keeps component props clean
function defaultMetadata() {
  return {
    title: '',
    summary: '',
    publishedAtDate: '',
    image: '',
    tagsRaw: '',
    tags: [],
  }
}

function defaultSource() {
  return { name: '', url: '' }
}

export default function App() {
  const [user, setUser] = useState(null)
  const [content, setContent] = useState('')
  const [activeTab, setActiveTab] = useState('upload')
  const [metadata, setMetadata] = useState(defaultMetadata())
  const [source, setSource] = useState(defaultSource())
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [pendingDraft, setPendingDraft] = useState(null)

  const readOnly = !!user?.readOnly
  const { saveDraft, loadDraft, clearDraft } = useDraft(user?.pubkey)

  // On login, check for a saved draft (not applicable in read-only mode)
  useEffect(() => {
    if (!user || readOnly) return
    const draft = loadDraft()
    if (draft) setPendingDraft(draft)
  }, [user])

  // Auto-save whenever content, metadata, or source changes (not in read-only mode)
  useEffect(() => {
    if (!user || readOnly) return
    saveDraft(content, metadata, source)
  }, [content, metadata, source])

  function handleLogout() {
    setUser(null)
    setContent('')
    setMetadata(defaultMetadata())
    setSource(defaultSource())
    setDrawerOpen(false)
    setPendingDraft(null)
  }

  function handleRestoreDraft() {
    if (!pendingDraft) return
    setContent(pendingDraft.content || '')
    setMetadata(pendingDraft.metadata || defaultMetadata())
    setSource(pendingDraft.source || defaultSource())
    setActiveTab('write')
    setPendingDraft(null)
  }

  function handleDiscardDraft() {
    clearDraft()
    setPendingDraft(null)
  }

  // Called when user clicks an article in the drawer
  function handleLoadArticle({ content: loadedContent, metadata: loadedMetadata }) {
    setContent(loadedContent)
    setMetadata(loadedMetadata)
    setSource(defaultSource())
    setActiveTab('write') // switch to write tab so the loaded content is visible
  }

  function handlePublishSuccess() {
    clearDraft()
  }

  function handlePublishAnother() {
    clearDraft()
    setContent('')
    setMetadata(defaultMetadata())
    setSource(defaultSource())
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-mono">
      {!user ? (
        <LoginScreen onLogin={setUser} />
      ) : (
        <div className="flex flex-col h-screen">
          <Header user={user} onLogout={handleLogout} onOpenArticles={() => setDrawerOpen(true)} onOpenHelp={() => setHelpOpen(true)} readOnly={readOnly} />

          {/* Draft restore banner — shown once after login if a saved draft exists */}
          {pendingDraft && (
            <DraftBanner
              draft={pendingDraft}
              onRestore={handleRestoreDraft}
              onDiscard={handleDiscardDraft}
            />
          )}

          {/* Help modal */}
          {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}

          {/* Article drawer — rendered when open */}
          {drawerOpen && (
            <ArticleDrawer
              user={user}
              onLoad={handleLoadArticle}
              onClose={() => setDrawerOpen(false)}
            />
          )}

          {/* Main layout: editor left, sidebar right */}
          <div className="flex flex-1 overflow-hidden">

            {/* Editor — takes remaining width */}
            <div className="flex-1 flex flex-col overflow-hidden border-r border-neutral-800">
              <Editor
                content={content}
                onChange={setContent}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                metadata={metadata}
                source={source}
                onClear={handlePublishAnother}
                onFileLoad={handleLoadArticle}
                readOnly={readOnly}
                user={user}
              />
            </div>

            {/* Sidebar: metadata + source + publish */}
            <div className="w-80 flex flex-col overflow-y-auto bg-neutral-950">
              <MetadataForm metadata={metadata} onChange={setMetadata} readOnly={readOnly} />
              <OriginalSourceField
                source={source}
                onChange={setSource}
                metadata={metadata}
                onMetadataChange={setMetadata}
                readOnly={readOnly}
              />
              <div className="p-4 mt-auto border-t border-neutral-800">
                <PublishButton
                  content={content}
                  metadata={metadata}
                  source={source}
                  user={user}
                  onPublishAnother={handlePublishAnother}
                  onPublishSuccess={handlePublishSuccess}
                  readOnly={readOnly}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
