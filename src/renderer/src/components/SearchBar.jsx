import { useRef, useEffect } from 'react'

export default function SearchBar({ query, onChange, onNext, onPrev, onClose, matchInfo }) {
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'Enter') {
      if (e.shiftKey) {
        onPrev()
      } else {
        onNext()
      }
    }
  }

  return (
    <div className="search-bar">
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Find in document..."
        className="search-input"
      />
      {matchInfo && (
        <span className="search-match-info">
          {matchInfo.activeMatchOrdinal}/{matchInfo.matches}
        </span>
      )}
      <button className="search-btn" onClick={onPrev} title="Previous (Shift+Enter)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.22 9.78a.75.75 0 010-1.06l4.25-4.25a.75.75 0 011.06 0l4.25 4.25a.75.75 0 01-1.06 1.06L8 6.06 4.28 9.78a.75.75 0 01-1.06 0z"/>
        </svg>
      </button>
      <button className="search-btn" onClick={onNext} title="Next (Enter)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M12.78 6.22a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06 0L3.22 7.28a.75.75 0 011.06-1.06L8 9.94l3.72-3.72a.75.75 0 011.06 0z"/>
        </svg>
      </button>
      <button className="search-btn" onClick={onClose} title="Close (Esc)">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M3.72 3.72a.75.75 0 011.06 0L8 6.94l3.22-3.22a.75.75 0 111.06 1.06L9.06 8l3.22 3.22a.75.75 0 11-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 01-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 010-1.06z"/>
        </svg>
      </button>
    </div>
  )
}
