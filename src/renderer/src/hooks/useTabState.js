import { useState, useEffect, useCallback, useRef } from 'react'
import { extractFrontMatter } from '../lib/front-matter'
import { extractHeadings } from '../lib/toc-extractor'
import { calculateStats } from '../lib/stats'

let nextId = 1

function deriveTabData(content) {
  const { data: frontMatter, content: body } = extractFrontMatter(content)
  return {
    frontMatter,
    headings: extractHeadings(body),
    stats: calculateStats(body)
  }
}

function getFileName(filePath) {
  return filePath.split(/[\\/]/).pop()
}

export function useTabState() {
  const [tabs, setTabs] = useState([])
  const [activeTabId, setActiveTabId] = useState(null)
  const scrollPositions = useRef({})
  const tabsRef = useRef(tabs)
  tabsRef.current = tabs

  const activeTab = tabs.find(t => t.id === activeTabId) || null

  // Save scroll position of current tab
  const saveScrollPosition = useCallback(() => {
    if (activeTabId) {
      const pane = document.querySelector('.content-pane')
      if (pane) {
        scrollPositions.current[activeTabId] = pane.scrollTop
      }
    }
  }, [activeTabId])

  // Restore scroll position for a tab
  const restoreScrollPosition = useCallback((tabId) => {
    requestAnimationFrame(() => {
      const pane = document.querySelector('.content-pane')
      if (pane) {
        pane.scrollTop = scrollPositions.current[tabId] || 0
      }
    })
  }, [])

  const addTab = useCallback((data) => {
    // Check for duplicate before updating state
    const existing = tabsRef.current.find(t => t.filePath === data.filePath)
    if (existing) {
      setActiveTabId(existing.id)
      return
    }

    const derived = deriveTabData(data.content)
    const tab = {
      id: nextId++,
      filePath: data.filePath,
      content: data.content,
      savedContent: data.content,
      ...derived
    }

    window.api?.setTitle(`${getFileName(data.filePath)} - Markdown Viewer`)
    window.api?.watchFile?.(data.filePath)

    setTabs(prev => [...prev, tab])
    setActiveTabId(tab.id)
  }, [])

  const closeTab = useCallback((tabId) => {
    const prev = tabsRef.current
    const idx = prev.findIndex(t => t.id === tabId)
    if (idx === -1) return

    const closingTab = prev[idx]
    window.api?.unwatchFile?.(closingTab.filePath)
    delete scrollPositions.current[tabId]

    const next = prev.filter(t => t.id !== tabId)
    setTabs(next)

    setActiveTabId(currentActive => {
      if (currentActive !== tabId) return currentActive
      if (next.length === 0) {
        window.api?.setTitle('Markdown Viewer')
        return null
      }
      const newActive = next[Math.min(idx, next.length - 1)]
      window.api?.setTitle(`${getFileName(newActive.filePath)} - Markdown Viewer`)
      return newActive.id
    })
  }, [])

  const switchTab = useCallback((tabId) => {
    saveScrollPosition()
    setActiveTabId(tabId)
    // Update title from ref (no setTabs side-effect needed)
    const tab = tabsRef.current.find(t => t.id === tabId)
    if (tab) {
      const dirty = tab.content !== tab.savedContent ? ' *' : ''
      window.api?.setTitle(`${getFileName(tab.filePath)}${dirty} - Markdown Viewer`)
    }
    restoreScrollPosition(tabId)
  }, [saveScrollPosition, restoreScrollPosition])

  const updateActiveContent = useCallback((newContent) => {
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t
      const derived = deriveTabData(newContent)
      return { ...t, content: newContent, ...derived }
    }))
  }, [activeTabId])

  const openFile = useCallback(async (filePathOrEvent) => {
    if (!window.api) return
    try {
      let data
      if (typeof filePathOrEvent === 'string') {
        data = await window.api.readFile(filePathOrEvent)
      } else {
        data = await window.api.openFileDialog()
      }
      if (data) addTab(data)
    } catch (err) {
      console.error('Failed to open file:', err)
    }
  }, [addTab])

  const saveFile = useCallback(async () => {
    if (!activeTab || !window.api?.saveFile) return
    if (activeTab.content === activeTab.savedContent) return
    try {
      await window.api.saveFile(activeTab.filePath, activeTab.content)
      setTabs(prev => prev.map(t => {
        if (t.id !== activeTabId) return t
        return { ...t, savedContent: t.content }
      }))
      window.api?.setTitle(`${getFileName(activeTab.filePath)} - Markdown Viewer`)
    } catch (err) {
      console.error('Failed to save file:', err)
    }
  }, [activeTab, activeTabId])

  // Listen for file opened from main process (CLI, second instance)
  useEffect(() => {
    if (!window.api?.onFileOpened) return
    return window.api.onFileOpened((data) => addTab(data))
  }, [addTab])

  // Listen for external file changes
  useEffect(() => {
    if (!window.api?.onFileChanged) return
    return window.api.onFileChanged((data) => {
      setTabs(prev => prev.map(t => {
        if (t.filePath !== data.filePath) return t
        // Don't overwrite dirty tabs
        if (t.content !== t.savedContent) return t
        const derived = deriveTabData(data.content)
        return { ...t, content: data.content, savedContent: data.content, ...derived }
      }))
    })
  }, [])

  return {
    tabs,
    activeTab,
    activeTabId,
    switchTab,
    closeTab,
    openFile,
    saveFile,
    updateActiveContent
  }
}
