import { useState, useEffect, useCallback, useRef } from 'react'
import { initializePipeline, createMarkdownRenderer } from '../lib/markdown-pipeline'

export function useMarkdownPipeline() {
  const [ready, setReady] = useState(false)
  const mdRef = useRef(null)

  useEffect(() => {
    initializePipeline().then(() => {
      mdRef.current = createMarkdownRenderer()
      setReady(true)
    }).catch(err => {
      console.error('Markdown pipeline initialization failed:', err)
      setReady(true)
    })
  }, [])

  const render = useCallback((content, basePath = '') => {
    if (!mdRef.current) return '<p>Loading...</p>'
    return mdRef.current.render(content, { basePath })
  }, [])

  return { render, ready }
}
