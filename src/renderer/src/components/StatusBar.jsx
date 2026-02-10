export default function StatusBar({ filePath, stats, editMode }) {
  return (
    <div className="statusbar">
      <span className="statusbar-path" title={filePath}>
        {filePath || 'No file open'}
      </span>
      <div className="statusbar-spacer" />
      {stats && (
        <>
          <span className="statusbar-item">{stats.words.toLocaleString()} words</span>
          <span className="statusbar-divider" />
          <span className="statusbar-item">{stats.readTime}</span>
          {editMode && (
            <>
              <span className="statusbar-divider" />
              <span className="statusbar-item">{stats.chars.toLocaleString()} chars</span>
            </>
          )}
        </>
      )}
    </div>
  )
}
