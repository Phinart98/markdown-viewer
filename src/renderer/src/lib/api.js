/**
 * Tauri API shim — mirrors the window.api interface from the Electron preload.
 * All components import from here instead of using window.api directly.
 */
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow'
import { watch, readTextFile } from '@tauri-apps/plugin-fs'
import { openUrl, revealItemInDir } from '@tauri-apps/plugin-opener'

// Active file watchers: path → unwatch function
const watchers = new Map()

// Listeners registered via onFileChanged
const fileChangedListeners = new Set()

export const api = {
  // ── File operations ──────────────────────────────────

  openFileDialog: () => invoke('open_file'),

  readFile: (path) => invoke('read_file', { path }),

  saveFile: (path, content) => invoke('save_file', { path, content }),

  saveFileAs: (content) => invoke('save_file_as', { content }),

  // ── File watching ─────────────────────────────────────

  watchFile: async (filePath) => {
    if (watchers.has(filePath)) return
    try {
      const stop = await watch(
        filePath,
        async () => {
          try {
            const content = await readTextFile(filePath)
            fileChangedListeners.forEach(cb => cb({ filePath, content }))
          } catch {
            // File may be temporarily locked mid-write — ignore
          }
        },
        { recursive: false, delayMs: 300 }
      )
      watchers.set(filePath, stop)
    } catch (err) {
      console.warn('Failed to watch file:', filePath, err)
    }
  },

  unwatchFile: (filePath) => {
    const stop = watchers.get(filePath)
    if (stop) {
      stop()
      watchers.delete(filePath)
    }
  },

  // ── Settings ──────────────────────────────────────────

  getRecentFiles: () => invoke('get_recent_files'),

  // ── Path utilities ────────────────────────────────────

  resolvePath: (base, rel) => invoke('resolve_path', { base, rel }),

  // ── Window ────────────────────────────────────────────

  setTitle: (title) => getCurrentWebviewWindow().setTitle(title),

  // PDF export: triggers the system print dialog where user can Save as PDF
  printToPdf: () => window.print(),

  // ── Shell ─────────────────────────────────────────────

  openExternal: (url) => openUrl(url),

  showInFolder: (path) => revealItemInDir(path),

  // ── Event listeners (backend → frontend) ──────────────

  /**
   * Listen for a file opened from CLI or a second app instance.
   * Returns a synchronous cleanup function.
   */
  onFileOpened: (cb) => {
    let unlisten = () => {}
    listen('file-opened', (e) => cb(e.payload)).then(fn => { unlisten = fn })
    return () => unlisten()
  },

  /**
   * Listen for external changes to a watched file.
   * Returns a synchronous cleanup function.
   */
  onFileChanged: (cb) => {
    fileChangedListeners.add(cb)
    return () => fileChangedListeners.delete(cb)
  },

  /**
   * Listen for app menu actions emitted from Rust.
   * Returns a synchronous cleanup function.
   */
  onMenuAction: (action, cb) => {
    let unlisten = () => {}
    listen(`menu-${action}`, () => cb()).then(fn => { unlisten = fn })
    return () => unlisten()
  },
}
