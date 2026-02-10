import { useState } from 'react'

export default function FrontMatterBanner({ data }) {
  const [expanded, setExpanded] = useState(false)

  if (!data) return null

  return (
    <div className="front-matter-banner">
      <button
        className="front-matter-toggle"
        onClick={() => setExpanded(e => !e)}
      >
        <svg
          width="12" height="12" viewBox="0 0 16 16" fill="currentColor"
          style={{ transform: expanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}
        >
          <path d="M6.22 3.22a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L9.94 8 6.22 4.28a.75.75 0 010-1.06z"/>
        </svg>
        <span>Front Matter</span>
      </button>
      {expanded && (
        <table className="front-matter-table">
          <tbody>
            {Object.entries(data).map(([key, value]) => (
              <tr key={key}>
                <td className="fm-key">{key}</td>
                <td className="fm-value">
                  {Array.isArray(value) ? value.join(', ') : String(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
