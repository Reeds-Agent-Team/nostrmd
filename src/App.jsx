import { useState } from 'react'
import LoginScreen from './components/LoginScreen.jsx'
import Header from './components/Header.jsx'
import Editor from './components/Editor.jsx'
import MetadataForm from './components/MetadataForm.jsx'
import OriginalSourceField from './components/OriginalSourceField.jsx'
import PublishButton from './components/PublishButton.jsx'
import ArticleDrawer from './components/ArticleDrawer.jsx'

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

  function handleLogout() {
    setUser(null)
    setContent('')
    setMetadata(defaultMetadata())
    setSource(defaultSource())
    setDrawerOpen(false)
  }

  // Called when user clicks an article in the drawer
  function handleLoadArticle({ content: loadedContent, metadata: loadedMetadata }) {
    setContent(loadedContent)
    setMetadata(loadedMetadata)
    setSource(defaultSource())
    setActiveTab('write') // switch to write tab so the loaded content is visible
  }

  function handlePublishAnother() {
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
          <Header user={user} onLogout={handleLogout} onOpenArticles={() => setDrawerOpen(true)} />

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
              />
            </div>

            {/* Sidebar: metadata + source + publish */}
            <div className="w-80 flex flex-col overflow-y-auto bg-neutral-950">
              <MetadataForm metadata={metadata} onChange={setMetadata} />
              <OriginalSourceField
                source={source}
                onChange={setSource}
                metadata={metadata}
                onMetadataChange={setMetadata}
              />
              <div className="p-4 mt-auto border-t border-neutral-800">
                <PublishButton
                  content={content}
                  metadata={metadata}
                  source={source}
                  user={user}
                  onPublishAnother={handlePublishAnother}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
