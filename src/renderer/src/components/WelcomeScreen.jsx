import { useState, useEffect } from 'react'
import { api } from '../lib/api'

export default function WelcomeScreen({ onOpen }) {
  const [recentFiles, setRecentFiles] = useState([])

  useEffect(() => {
    api.getRecentFiles().then(files => setRecentFiles(files || []))
  }, [])

  return (
    <div className="welcome">
      <div className="welcome-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14,2 14,8 20,8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10,9 9,9 8,9" />
        </svg>
      </div>
      <h1>Markdown Viewer</h1>
      <p>Open a Markdown file to preview it beautifully</p>
      <button className="welcome-btn" onClick={() => onOpen()}>
        Open File
      </button>
      <span className="welcome-hint">or drag and drop a .md file</span>

      {recentFiles.length > 0 && (
        <div className="recent-files">
          <h3>Recent Files</h3>
          <ul>
            {recentFiles.map((file, i) => (
              <li key={i}>
                <a onClick={() => onOpen(file)} title={file}>
                  {file.split(/[\\/]/).pop()}
                </a>
                <span className="recent-path">{file}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
