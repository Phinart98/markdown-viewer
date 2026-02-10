import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // File operations
  openFileDialog: () => ipcRenderer.invoke('file:open-dialog'),
  readFile: (filePath) => ipcRenderer.invoke('file:read', filePath),
  saveFile: (filePath, content) => ipcRenderer.invoke('file:save', filePath, content),
  saveFileAs: (content) => ipcRenderer.invoke('file:save-as', content),
  watchFile: (filePath) => ipcRenderer.invoke('file:watch', filePath),
  unwatchFile: (filePath) => ipcRenderer.invoke('file:unwatch', filePath),
  getRecentFiles: () => ipcRenderer.invoke('file:get-recent'),
  resolvePath: (basePath, relativePath) =>
    ipcRenderer.invoke('file:resolve-path', basePath, relativePath),

  // Print
  printToPdf: (html) => ipcRenderer.invoke('print:to-pdf', html),

  // Window
  setTitle: (title) => ipcRenderer.invoke('window:set-title', title),

  // Shell
  openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),
  showInFolder: (filePath) => ipcRenderer.invoke('shell:show-in-folder', filePath),

  // Event listeners (main -> renderer)
  onFileOpened: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('file:opened', handler)
    return () => ipcRenderer.removeListener('file:opened', handler)
  },
  onFileChanged: (callback) => {
    const handler = (_event, data) => callback(data)
    ipcRenderer.on('file:changed', handler)
    return () => ipcRenderer.removeListener('file:changed', handler)
  },
  onMenuAction: (action, callback) => {
    const handler = () => callback()
    ipcRenderer.on(`menu:${action}`, handler)
    return () => ipcRenderer.removeListener(`menu:${action}`, handler)
  }
})
