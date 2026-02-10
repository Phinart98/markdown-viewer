import { useEffect } from 'react'

export function useKeyboardShortcuts({
  onOpen,
  onSave,
  onToggleEdit,
  onToggleToc,
  onToggleTheme,
  onFind,
  onPrint,
  onCloseTab
}) {
  useEffect(() => {
    const handler = (e) => {
      const ctrl = e.ctrlKey || e.metaKey

      if (ctrl && e.key === 'o') {
        e.preventDefault()
        onOpen?.()
      } else if (ctrl && e.key === 's') {
        e.preventDefault()
        onSave?.()
      } else if (ctrl && e.key === 'e') {
        e.preventDefault()
        onToggleEdit?.()
      } else if (ctrl && e.shiftKey && e.key === 'T') {
        e.preventDefault()
        onToggleToc?.()
      } else if (ctrl && e.shiftKey && e.key === 'D') {
        e.preventDefault()
        onToggleTheme?.()
      } else if (ctrl && e.key === 'f') {
        e.preventDefault()
        onFind?.()
      } else if (ctrl && e.key === 'p') {
        e.preventDefault()
        onPrint?.()
      } else if (ctrl && e.key === 'w') {
        e.preventDefault()
        onCloseTab?.()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onOpen, onSave, onToggleEdit, onToggleToc, onToggleTheme, onFind, onPrint, onCloseTab])
}
