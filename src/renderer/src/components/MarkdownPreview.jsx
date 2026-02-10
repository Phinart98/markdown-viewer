import { useMemo, useRef, useEffect } from 'react'
import DOMPurify from 'dompurify'
import { useMarkdownPipeline } from '../hooks/useMarkdownPipeline'

const purify = DOMPurify(window)
purify.addHook('uponSanitizeAttribute', (node, data) => {
  // Allow style attribute only for Shiki code block elements (pre and its children)
  if (data.attrName === 'style' && (node.tagName === 'PRE' || node.closest?.('pre'))) {
    data.forceKeepAttr = true
  }
})

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function highlightHtml(html, query) {
  if (!query) return { html, matchCount: 0 }

  const regex = new RegExp(escapeRegExp(query), 'gi')
  let count = 0

  // Split HTML into tags, entities, and text segments — only highlight text
  const parts = html.split(/(<[^>]*>|&[#\w]+;)/)
  const highlighted = parts.map(part => {
    if (!part || part.startsWith('<') || part.startsWith('&')) return part
    return part.replace(regex, (match) => {
      count++
      return `<mark class="search-highlight">${escapeHtml(match)}</mark>`
    })
  }).join('')

  return { html: highlighted, matchCount: count }
}

export default function MarkdownPreview({ content, filePath, searchQuery, activeSearchIndex, onMatchCount }) {
  const containerRef = useRef(null)
  const { render, ready } = useMarkdownPipeline()
  const prevCountRef = useRef(0)

  const baseHtml = useMemo(() => {
    if (!ready) return '<p class="loading-text">Loading renderer...</p>'
    const basePath = filePath ? filePath.replace(/[\\/][^\\/]+$/, '') : ''
    const raw = render(content, basePath)
    return purify.sanitize(raw, {
      ADD_TAGS: ['math', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'munderover', 'mover', 'munder', 'mtable', 'mtr', 'mtd', 'mtext', 'mspace', 'msqrt', 'semantics', 'annotation'],
      ADD_ATTR: ['data-external', 'data-theme', 'target', 'rel', 'xmlns', 'mathvariant', 'accent', 'accentunder', 'columnalign', 'columnspacing', 'columnlines', 'rowspacing', 'rowlines', 'frame', 'framespacing', 'encoding'],
      ALLOW_DATA_ATTR: true
    })
  }, [content, filePath, render, ready])

  const { html, matchCount } = useMemo(() => {
    return highlightHtml(baseHtml, searchQuery)
  }, [baseHtml, searchQuery])

  // Report match count to parent (only when it changes)
  useEffect(() => {
    if (prevCountRef.current !== matchCount) {
      prevCountRef.current = matchCount
      onMatchCount?.(matchCount)
    }
  }, [matchCount, onMatchCount])

  // Scroll to and highlight the active match
  useEffect(() => {
    if (!containerRef.current || !searchQuery) return
    const marks = containerRef.current.querySelectorAll('mark.search-highlight')
    marks.forEach((m, i) => {
      m.classList.toggle('search-active', i === activeSearchIndex)
    })
    if (marks[activeSearchIndex]) {
      marks[activeSearchIndex].scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [activeSearchIndex, html, searchQuery])

  // Handle external link clicks
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleClick = (e) => {
      const anchor = e.target.closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        e.preventDefault()
        window.api?.openExternal?.(href)
      }
    }

    container.addEventListener('click', handleClick)
    return () => container.removeEventListener('click', handleClick)
  }, [])

  return (
    <div
      ref={containerRef}
      className="markdown-preview markdown-body"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
