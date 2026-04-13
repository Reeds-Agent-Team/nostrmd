import JSZip from 'jszip'
import { marked } from 'marked'
import { titleToSlug, isSafeUrl, parseDateString } from './utils.js'

// Convert markdown to XHTML-compatible HTML for epub content
function mdToXhtml(markdown) {
  const html = marked.parse(markdown || '')
  // Epub content must be valid XHTML — fix self-closing void elements
  return html
    .replace(/<br>/gi, '<br/>')
    .replace(/<hr>/gi, '<hr/>')
    .replace(/<img([^>]*?)(?<!\/)>/gi, '<img$1/>')
    .replace(/<input([^>]*?)(?<!\/)>/gi, '<input$1/>')
}

// Minimal XML character escaping for metadata fields
function esc(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function containerXml() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
}

function contentOpf({ bookId, title, author, lang, date, modified }) {
  const creatorTag = author ? `\n    <dc:creator>${esc(author)}</dc:creator>` : ''
  return `<?xml version="1.0" encoding="UTF-8"?>
<package version="3.0" unique-identifier="book-id" xmlns="http://www.idpf.org/2007/opf">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">urn:uuid:${bookId}</dc:identifier>
    <dc:title>${esc(title)}</dc:title>${creatorTag}
    <dc:language>${esc(lang)}</dc:language>
    <dc:date>${esc(date)}</dc:date>
    <meta property="dcterms:modified">${esc(modified)}</meta>
  </metadata>
  <manifest>
    <item id="nav"     href="nav.xhtml"     media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx"     href="toc.ncx"       media-type="application/x-dtbncx+xml"/>
    <item id="content" href="content.xhtml" media-type="application/xhtml+xml"/>
    <item id="style"   href="style.css"     media-type="text/css"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="content"/>
  </spine>
</package>`
}

function tocNcx({ bookId, title }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx version="2005-1" xmlns="http://www.daisy.org/z3986/2005/ncx/">
  <head>
    <meta name="dtb:uid" content="urn:uuid:${bookId}"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${esc(title)}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>${esc(title)}</text></navLabel>
      <content src="content.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`
}

function navXhtml({ title }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>${esc(title)}</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <ol><li><a href="content.xhtml">${esc(title)}</a></li></ol>
  </nav>
</body>
</html>`
}

// Minimal epub stylesheet — readable on most ereaders
function styleCss() {
  return `body {
  font-family: Georgia, serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em 1.5em;
  color: #1a1a1a;
}
h1 { font-size: 1.8em; line-height: 1.2; margin-bottom: 0.3em; }
h2 { font-size: 1.4em; margin-top: 1.5em; }
h3 { font-size: 1.2em; margin-top: 1.2em; }
p  { margin: 0.8em 0; }
blockquote {
  border-left: 3px solid #ccc;
  margin: 1em 0;
  padding-left: 1em;
  color: #555;
  font-style: italic;
}
code {
  font-family: monospace;
  font-size: 0.9em;
  background: #f4f4f4;
  padding: 0.1em 0.3em;
  border-radius: 3px;
}
pre {
  background: #f4f4f4;
  padding: 1em;
  overflow-x: auto;
  border-radius: 4px;
}
pre code { background: none; padding: 0; }
img { max-width: 100%; height: auto; }
a { color: #333; }
hr { border: none; border-top: 1px solid #ccc; margin: 1.5em 0; }
.subtitle  { font-size: 1.1em; color: #555; margin-top: 0.2em; font-style: italic; }
.meta      { font-size: 0.85em; color: #777; margin: 0.5em 0 1.5em; }
.source    { font-size: 0.9em; color: #555; font-style: italic; margin-bottom: 1.5em; }`
}

function contentXhtml({ title, metadata, source, bodyHtml }) {
  const dateStr = metadata.publishedAtDate
    ? parseDateString(metadata.publishedAtDate).toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : ''

  const coverImg = metadata.image && isSafeUrl(metadata.image)
    ? `<img src="${esc(metadata.image)}" alt="Cover"/>`
    : ''

  const subtitle = metadata.summary
    ? `<p class="subtitle">${esc(metadata.summary)}</p>`
    : ''

  const dateLine = dateStr
    ? `<p class="meta">${esc(dateStr)}</p>`
    : ''

  let sourceLine = ''
  if (source?.name) {
    const nameEsc = esc(source.name)
    const urlEsc = source.url && isSafeUrl(source.url) ? esc(source.url) : ''
    sourceLine = urlEsc
      ? `<p class="source">Originally published at <a href="${urlEsc}">${nameEsc}</a>${dateStr ? ` on ${esc(dateStr)}` : ''}</p>`
      : `<p class="source">Originally published at ${nameEsc}${dateStr ? ` on ${esc(dateStr)}` : ''}</p>`
  }

  const divider = (title || metadata.summary || source?.name) ? '<hr/>' : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <title>${esc(title)}</title>
  <meta charset="UTF-8"/>
  <link rel="stylesheet" type="text/css" href="style.css"/>
</head>
<body>
  ${coverImg}
  <h1>${esc(title)}</h1>
  ${subtitle}
  ${dateLine}
  ${sourceLine}
  ${divider}
  ${bodyHtml}
</body>
</html>`
}

// Simple UUID v4 — crypto.randomUUID() requires HTTPS; Math.random() is fine for epub book IDs
function uuid4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16)
  })
}

export async function exportEpub(content, metadata, source, author = '') {
  const zip = new JSZip()

  const bookId = uuid4()
  const title = metadata.title || 'Untitled'
  const lang = 'en'
  const date = metadata.publishedAtDate || new Date().toISOString().split('T')[0]
  const modified = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const slug = titleToSlug(title) || 'nostrmd-export'

  const bodyHtml = mdToXhtml(content)

  // mimetype must be first and stored uncompressed — epub spec requirement
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })
  zip.file('META-INF/container.xml', containerXml())
  zip.file('OEBPS/content.opf', contentOpf({ bookId, title, author, lang, date, modified }))
  zip.file('OEBPS/toc.ncx', tocNcx({ bookId, title }))
  zip.file('OEBPS/nav.xhtml', navXhtml({ title }))
  zip.file('OEBPS/style.css', styleCss())
  zip.file('OEBPS/content.xhtml', contentXhtml({ title, metadata, source, bodyHtml }))

  const blob = await zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' })

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = slug + '.epub'
  a.click()
  URL.revokeObjectURL(url)
}
