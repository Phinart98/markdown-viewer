export default function TableOfContents({ headings }) {
  if (!headings || headings.length === 0) {
    return (
      <nav className="toc-sidebar">
        <div className="toc-header">
          <span className="toc-title">Contents</span>
        </div>
        <p className="toc-empty">No headings found</p>
      </nav>
    )
  }

  const handleClick = (slug) => {
    const el = document.getElementById(slug)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <nav className="toc-sidebar">
      <div className="toc-header">
        <span className="toc-title">Contents</span>
      </div>
      <ul className="toc-list">
        {headings.map((h, i) => (
          <li
            key={`${h.slug}-${i}`}
            className={`toc-item toc-level-${h.level}`}
          >
            <a onClick={() => handleClick(h.slug)} title={h.text}>
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
