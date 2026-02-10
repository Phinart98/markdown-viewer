export default function TabBar({ tabs, activeTabId, onSwitch, onClose, onOpen }) {
  const handleMouseDown = (e, tabId) => {
    // Middle-click to close
    if (e.button === 1) {
      e.preventDefault()
      onClose(tabId)
    }
  }

  return (
    <div className="tab-bar">
      {tabs.map(tab => {
        const fileName = tab.filePath.split(/[\\/]/).pop()
        const isDirty = tab.content !== tab.savedContent
        const isActive = tab.id === activeTabId

        return (
          <div
            key={tab.id}
            className={`tab ${isActive ? 'tab-active' : ''}`}
            onClick={() => onSwitch(tab.id)}
            onMouseDown={(e) => handleMouseDown(e, tab.id)}
            title={tab.filePath}
          >
            {isDirty && <span className="tab-dirty" />}
            <span className="tab-name">{fileName}</span>
            <button
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation()
                onClose(tab.id)
              }}
              title="Close tab"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                <path d="M9.354 3.354a.5.5 0 00-.708-.708L6 5.293 3.354 2.646a.5.5 0 10-.708.708L5.293 6 2.646 8.646a.5.5 0 00.708.708L6 6.707l2.646 2.647a.5.5 0 00.708-.708L6.707 6l2.647-2.646z"/>
              </svg>
            </button>
          </div>
        )
      })}
      <button
        className="tab-new"
        onClick={onOpen}
        title="Open file (Ctrl+O)"
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 2a.75.75 0 01.75.75v4.5h4.5a.75.75 0 010 1.5h-4.5v4.5a.75.75 0 01-1.5 0v-4.5h-4.5a.75.75 0 010-1.5h4.5v-4.5A.75.75 0 018 2z"/>
        </svg>
      </button>
    </div>
  )
}
