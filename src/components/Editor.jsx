import { useRef } from 'react'
import MDEditor from '@uiw/react-md-editor'
import { isSafeUrl } from '../lib/utils.js'

export default function Editor({ content, onChange, activeTab, onTabChange, metadata, source, onClear }) {
  const fileInputRef = useRef(null)

  function handleFileUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      onChange(ev.target.result || '')
      e.target.value = ''
    }
    reader.readAsText(file)
  }

  return (
    <div className="flex flex-col h-full" data-color-mode="dark">
      {/* Tab switcher */}
      <div className="flex items-center gap-1 px-4 pt-4 pb-2 border-b border-neutral-800">
        <button
          onClick={() => { onTabChange('upload'); fileInputRef.current?.click() }}
          className={`px-4 py-1.5 rounded text-sm transition-colors ${
            activeTab === 'upload'
              ? 'bg-neutral-800 text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
          aria-pressed={activeTab === 'upload'}
        >
          Upload .md file
        </button>
        <button
          onClick={() => onTabChange('write')}
          className={`px-4 py-1.5 rounded text-sm transition-colors ${
            activeTab === 'write'
              ? 'bg-neutral-800 text-neutral-100'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
          aria-pressed={activeTab === 'write'}
        >
          Write / Paste
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown,text/markdown,text/plain"
          onChange={handleFileUpload}
          className="hidden"
          aria-hidden="true"
        />

        {/* Clear button — only shown when there's something to clear */}
        {(content || metadata?.title) && (
          <button
            onClick={onClear}
            className="ml-auto px-3 py-1.5 text-sm rounded border border-neutral-700 text-neutral-500 hover:text-red-400 hover:border-red-900 transition-colors"
            aria-label="Clear editor and reset all fields"
          >
            Clear
          </button>
        )}
      </div>

      {/* Editor + preview split */}
      <div className="flex flex-1 overflow-hidden">

        {/* Left: raw markdown editor, no built-in preview */}
        <div className="w-1/2 overflow-hidden border-r border-neutral-800">
          <MDEditor
            value={content}
            onChange={val => onChange(val || '')}
            height="100%"
            visibleDragbar={false}
            preview="edit"
            hideToolbar={false}
            className="h-full"
          />
        </div>

        {/* Right: custom preview with metadata header */}
        <div className="w-1/2 overflow-y-auto bg-neutral-950 px-8 py-6">

          {/* Cover image — 16:9, only render if URL uses http/https */}
          {metadata?.image && isSafeUrl(metadata.image) && (
            <div className="w-full aspect-video mb-6 rounded-lg overflow-hidden border border-neutral-800">
              <img
                src={metadata.image}
                alt="Cover"
                className="w-full h-full object-cover"
                onError={e => { e.target.parentElement.style.display = 'none' }}
              />
            </div>
          )}

          {/* Title */}
          {metadata?.title && (
            <h1 className="text-2xl font-bold text-neutral-100 leading-tight mb-2 font-sans">
              {metadata.title}
            </h1>
          )}

          {/* Subtitle / summary */}
          {metadata?.summary && (
            <p className="text-base text-neutral-400 leading-relaxed mb-3 font-sans">
              {metadata.summary}
            </p>
          )}

          {/* Attribution line — rendered as JSX so the link is a real hyperlink */}
          {source?.name && (
            <p className="text-sm text-neutral-500 italic mb-4 font-sans">
              Originally published at{' '}
              {source.url && isSafeUrl(source.url)
                ? <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline hover:text-neutral-300">{source.name}</a>
                : source.name
              }
              {metadata?.publishedAtDate && (
                <> on {new Date(metadata.publishedAtDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</>
              )}
            </p>
          )}

          {/* Divider between header and body */}
          {(metadata?.title || metadata?.summary || source?.name) && (
            <hr className="border-neutral-800 mb-6" />
          )}

          {/* Rendered markdown body */}
          <div className="prose prose-invert prose-sm max-w-none font-sans">
            <MDEditor.Markdown
              source={content}
              style={{ backgroundColor: 'transparent', color: 'inherit' }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
