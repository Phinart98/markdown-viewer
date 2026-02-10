export default function Toolbar({
  editMode,
  onToggleEdit,
  showToc,
  onToggleToc,
  theme,
  onToggleTheme
}) {
  return (
    <div className="toolbar">
      <div className="toolbar-spacer" />

      <button
        className={`toolbar-btn ${showToc ? 'active' : ''}`}
        onClick={onToggleToc}
        title="Toggle Table of Contents (Ctrl+Shift+T)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 4a1 1 0 100-2 1 1 0 000 2zm3.75-1.5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm0 5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zm0 5a.75.75 0 000 1.5h8.5a.75.75 0 000-1.5h-8.5zM3 8a1 1 0 11-2 0 1 1 0 012 0zm-1 6a1 1 0 100-2 1 1 0 000 2z"/>
        </svg>
      </button>

      <button
        className={`toolbar-btn ${editMode ? 'active' : ''}`}
        onClick={onToggleEdit}
        title="Toggle Edit Mode (Ctrl+E)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.013 1.427a1.75 1.75 0 012.474 0l1.086 1.086a1.75 1.75 0 010 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 01-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61zM12.26 2.68a.25.25 0 00-.354 0L3.296 11.29a.25.25 0 00-.064.108l-.558 1.953 1.953-.558a.249.249 0 00.108-.064l8.61-8.61a.25.25 0 000-.354L12.26 2.68z"/>
        </svg>
      </button>

      <button
        className="toolbar-btn"
        onClick={onToggleTheme}
        title="Toggle Theme (Ctrl+Shift+D)"
      >
        {theme === 'dark' ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M8 12a4 4 0 100-8 4 4 0 000 8zm0 1a5 5 0 110-10 5 5 0 010 10zm.5-12.5a.5.5 0 11-1 0V2a.5.5 0 011 0V.5zm0 13a.5.5 0 11-1 0V14a.5.5 0 011 0v1.5zm4.743-11.243a.5.5 0 11-.707.707l-1.06 1.06a.5.5 0 01-.708-.706l1.06-1.06a.5.5 0 01.707 0zM3.732 12.268a.5.5 0 11-.707.707l-1.06-1.06a.5.5 0 11.707-.708l1.06 1.06zM16 8.5a.5.5 0 010-1h-1.5a.5.5 0 010 1H16zM2 8.5a.5.5 0 010-1H.5a.5.5 0 010 1H2zm11.268 3.768a.5.5 0 01-.707-.707l1.06-1.06a.5.5 0 11.708.707l-1.06 1.06zM3.025 3.025a.5.5 0 01-.707-.707L1.258 1.258a.5.5 0 01.707-.707l1.06 1.06a.5.5 0 010 .707z"/>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.2 1a.5.5 0 01.3.8 5.998 5.998 0 007.7 7.7.5.5 0 01.7.5A7 7 0 111.8 3.3a.5.5 0 01.5-.3H6.2z"/>
          </svg>
        )}
      </button>
    </div>
  )
}
