import { useState, useCallback, useRef, useEffect } from 'react'

export default function SplitPane({ children }) {
  const [splitPos, setSplitPos] = useState(50) // percentage
  const dragging = useRef(false)
  const containerRef = useRef(null)

  const handleMouseDown = useCallback((e) => {
    e.preventDefault()
    dragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragging.current || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const pct = ((e.clientX - rect.left) / rect.width) * 100
      setSplitPos(Math.min(80, Math.max(20, pct)))
    }

    const handleMouseUp = () => {
      dragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [])

  const [left, right] = Array.isArray(children) ? children : [children, null]

  return (
    <div className="split-pane" ref={containerRef}>
      <div className="split-left" style={{ width: `${splitPos}%` }}>
        {left}
      </div>
      <div className="split-handle" onMouseDown={handleMouseDown} />
      <div className="split-right" style={{ width: `${100 - splitPos}%` }}>
        {right}
      </div>
    </div>
  )
}
