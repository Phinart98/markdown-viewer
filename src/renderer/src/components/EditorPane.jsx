import { useRef, useEffect, useCallback } from 'react'

export default function EditorPane({ content, onChange }) {
  const textareaRef = useRef(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [])

  const handleInput = useCallback((e) => {
    onChange(e.target.value)
  }, [onChange])

  const handleKeyDown = useCallback((e) => {
    // Handle Tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = textareaRef.current
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const value = textarea.value
      const newValue = value.substring(0, start) + '  ' + value.substring(end)
      onChange(newValue)
      // Restore cursor position
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      })
    }
  }, [onChange])

  return (
    <div className="editor-pane">
      <textarea
        ref={textareaRef}
        className="editor-textarea"
        value={content}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        spellCheck={false}
      />
    </div>
  )
}
