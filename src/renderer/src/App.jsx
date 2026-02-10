import { useState, useEffect, useCallback } from 'react'
import { useTabState } from './hooks/useTabState'
import { useTheme } from './hooks/useTheme'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'
import { useSearch } from './hooks/useSearch'
import TabBar from './components/TabBar'
import Toolbar from './components/Toolbar'
import StatusBar from './components/StatusBar'
import MarkdownPreview from './components/MarkdownPreview'
import TableOfContents from './components/TableOfContents'
import EditorPane from './components/EditorPane'
import SplitPane from './components/SplitPane'
import DropZone from './components/DropZone'
import SearchBar from './components/SearchBar'
import WelcomeScreen from './components/WelcomeScreen'
import FrontMatterBanner from './components/FrontMatterBanner'

export default function App() {
  const [showToc, setShowToc] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const { theme, toggleTheme } = useTheme()
  const {
    tabs, activeTab, activeTabId,
    switchTab, closeTab, openFile, saveFile, updateActiveContent
  } = useTabState()
  const {
    searchActive, searchQuery, matchInfo,
    activeIndex, setMatchCount,
    openSearch, closeSearch, doSearch, findNext, findPrev
  } = useSearch()

  const handlePrint = useCallback(async () => {
    const previewEl = document.querySelector('.markdown-preview')
    if (!previewEl) return

    const clone = previewEl.cloneNode(true)

    // Resolve Shiki syntax highlighting: read computed colors from live DOM
    // and bake them into the clone as direct inline styles
    const originalShikiSpans = previewEl.querySelectorAll('pre.shiki span')
    const cloneShikiSpans = clone.querySelectorAll('pre.shiki span')
    originalShikiSpans.forEach((origSpan, i) => {
      if (cloneShikiSpans[i]) {
        const computed = window.getComputedStyle(origSpan)
        cloneShikiSpans[i].style.color = computed.color
      }
    })

    // Also resolve pre.shiki background colors
    const originalPres = previewEl.querySelectorAll('pre.shiki')
    const clonePres = clone.querySelectorAll('pre.shiki')
    originalPres.forEach((origPre, i) => {
      if (clonePres[i]) {
        const computed = window.getComputedStyle(origPre)
        clonePres[i].style.backgroundColor = computed.backgroundColor
      }
    })

    await window.api?.printToPdf?.(clone.innerHTML)
  }, [])

  const handleCloseTab = useCallback(() => {
    if (activeTabId) closeTab(activeTabId)
  }, [activeTabId, closeTab])

  useKeyboardShortcuts({
    onOpen: () => openFile(),
    onSave: saveFile,
    onToggleEdit: () => setEditMode(e => !e),
    onToggleToc: () => setShowToc(t => !t),
    onToggleTheme: toggleTheme,
    onFind: openSearch,
    onPrint: handlePrint,
    onCloseTab: handleCloseTab
  })

  // Listen for menu actions from main process
  useEffect(() => {
    if (!window.api?.onMenuAction) return
    const unsubs = [
      window.api.onMenuAction('open-file', () => openFile()),
      window.api.onMenuAction('save', saveFile),
      window.api.onMenuAction('toggle-edit', () => setEditMode(e => !e)),
      window.api.onMenuAction('toggle-toc', () => setShowToc(t => !t)),
      window.api.onMenuAction('toggle-theme', toggleTheme),
      window.api.onMenuAction('find', openSearch),
      window.api.onMenuAction('print', handlePrint),
      window.api.onMenuAction('close-tab', handleCloseTab)
    ]
    return () => unsubs.forEach(fn => fn?.())
  }, [openFile, saveFile, toggleTheme, openSearch, handlePrint, handleCloseTab])

  const handleFileDrop = useCallback((path) => {
    openFile(path)
  }, [openFile])

  return (
    <DropZone onFile={handleFileDrop}>
      <div className="app-container">
        <TabBar
          tabs={tabs}
          activeTabId={activeTabId}
          onSwitch={switchTab}
          onClose={closeTab}
          onOpen={() => openFile()}
        />
        {!activeTab ? (
          <WelcomeScreen onOpen={openFile} />
        ) : (
          <>
            <Toolbar
              editMode={editMode}
              onToggleEdit={() => setEditMode(e => !e)}
              showToc={showToc}
              onToggleToc={() => setShowToc(t => !t)}
              theme={theme}
              onToggleTheme={toggleTheme}
            />
            <div className="main-content">
              {showToc && <TableOfContents headings={activeTab.headings} />}
              <div className="content-pane">
                {activeTab.frontMatter && <FrontMatterBanner data={activeTab.frontMatter} />}
                {editMode ? (
                  <SplitPane>
                    <EditorPane content={activeTab.content} onChange={updateActiveContent} />
                    <MarkdownPreview
                      content={activeTab.content}
                      filePath={activeTab.filePath}
                      searchQuery={searchActive ? searchQuery : ''}
                      activeSearchIndex={activeIndex}
                      onMatchCount={setMatchCount}
                    />
                  </SplitPane>
                ) : (
                  <MarkdownPreview
                    content={activeTab.content}
                    filePath={activeTab.filePath}
                    searchQuery={searchActive ? searchQuery : ''}
                    activeSearchIndex={activeIndex}
                    onMatchCount={setMatchCount}
                  />
                )}
              </div>
            </div>
            {searchActive && (
              <SearchBar
                query={searchQuery}
                onChange={doSearch}
                onNext={findNext}
                onPrev={findPrev}
                onClose={closeSearch}
                matchInfo={matchInfo}
              />
            )}
            <StatusBar filePath={activeTab.filePath} stats={activeTab.stats} editMode={editMode} />
          </>
        )}
      </div>
    </DropZone>
  )
}
